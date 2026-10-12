import { audioText } from "@/content/audioKeys";
import { PHONEME_BY_ID } from "@/content/phonemes";
import type { Accent } from "@/content/types";
import type { Settings } from "./progress";
import { playSfx, type SfxId } from "./sfx";
import { fastMode } from "./testHooks";

// One audio engine for the whole app:
//  - plays curated clips from public/audio/<accent>/<key>.m4a in sequence
//  - shows a caption for everything it says
//  - falls back to the browser's speech synthesis (never for bare phonemes unless
//    the clip is missing, and then it says "s, as in sun" rather than a letter name)
//  - keeps working when muted or when audio is unavailable (captions + timing only)
// Audio only ever starts from something the child tapped.

export type Part = string | { key: string } | { pause: number } | { sfx: SfxId };

interface Manifest {
  clips: Record<string, Record<string, [number, string]>>;
  timings: Record<string, Record<string, number[]>>;
}

export interface EngineState {
  caption: string | null;
  playing: boolean;
}

const LANG: Record<Accent, string> = { in: "en-IN", gb: "en-GB", us: "en-US" };

class AudioEngine {
  private manifest: Manifest | null = null;
  private manifestPromise: Promise<void> | null = null;
  private el: HTMLAudioElement | null = null;
  private token = 0;
  private listeners = new Set<(s: EngineState) => void>();
  private state: EngineState = { caption: null, playing: false };
  settings: Pick<Settings, "accent" | "volume" | "muted" | "slow" | "soundEffects"> = {
    accent: "in", volume: 0.9, muted: false, slow: false, soundEffects: true,
  };

  loadManifest() {
    if (!this.manifestPromise) {
      this.manifestPromise = import("@/content/audio-manifest.json")
        .then((m) => { this.manifest = (m.default ?? m) as unknown as Manifest; })
        .catch(() => { this.manifest = { clips: {}, timings: {} }; });
    }
    return this.manifestPromise;
  }

  subscribe(fn: (s: EngineState) => void) {
    this.listeners.add(fn);
    fn(this.state);
    return () => { this.listeners.delete(fn); };
  }

  private emit(patch: Partial<EngineState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  has(key: string) {
    return !!this.manifest?.clips[this.settings.accent]?.[key];
  }

  url(key: string, accent: Accent = this.settings.accent) {
    return `${import.meta.env.BASE_URL}audio/${accent}/${key}.m4a`;
  }

  timings(key: string): number[] | undefined {
    return this.manifest?.timings[this.settings.accent]?.[key];
  }

  /** How a part reads in a caption. Phonemes show as /s/. */
  captionFor(part: Part): string {
    if (typeof part === "object" && "pause" in part) return "";
    if (typeof part === "object" && "sfx" in part) return "";
    const key = typeof part === "string" ? part : part.key;
    if (key.startsWith("ph/")) return `/${PHONEME_BY_ID[key.slice(3)]?.say ?? key.slice(3)}/`;
    if (key.startsWith("n/")) return `"${key.slice(2).toUpperCase()}"`;
    return audioText(key, this.settings.accent);
  }

  stop() {
    this.token++;
    this.el?.pause();
    try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
    this.emit({ playing: false, caption: null });
  }

  /** Warm the browser/service-worker cache for clips we are about to need. */
  preload(keys: string[]) {
    void this.loadManifest().then(() => {
      for (const k of keys) if (this.has(k)) fetch(this.url(k)).catch(() => {});
    });
  }

  /**
   * Play parts in order. Resolves true when everything played, false if
   * interrupted by another play() or stop().
   */
  async play(parts: Part[], opts: { slow?: boolean; onWord?: (i: number) => void; caption?: string } = {}): Promise<boolean> {
    const my = ++this.token;
    this.el?.pause();
    try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
    await this.loadManifest();
    if (my !== this.token) return false;
    const caption = opts.caption ?? parts.map((p) => this.captionFor(p)).filter(Boolean).join(" ").replace(/\s+([?.!,])/g, "$1");
    this.emit({ caption: caption || this.state.caption, playing: true });
    for (const part of parts) {
      if (my !== this.token) return false;
      if (typeof part === "object" && "pause" in part) { await wait(part.pause); continue; }
      if (typeof part === "object" && "sfx" in part) {
        if (this.settings.soundEffects && !this.settings.muted) playSfx(part.sfx, this.settings.volume);
        await wait(250);
        continue;
      }
      const key = typeof part === "string" ? part : part.key;
      await this.playKey(key, my, opts);
    }
    if (my === this.token) this.emit({ playing: false });
    return my === this.token;
  }

  private async playKey(key: string, my: number, opts: { slow?: boolean; onWord?: (i: number) => void }) {
    const slow = opts.slow ?? this.settings.slow;
    const text = this.captionText(key);
    if (fastMode()) return;
    if (this.settings.muted) {
      await wait(Math.min(1500, 250 + text.length * 25));
      return;
    }
    if (this.has(key)) {
      const ok = await this.playClip(key, my, slow, opts.onWord);
      if (ok || my !== this.token) return;
    }
    await this.speak(text, slow, my);
  }

  private captionText(key: string) {
    return audioText(key, this.settings.accent) || key.split("/").pop() || "";
  }

  private playClip(key: string, my: number, slow: boolean, onWord?: (i: number) => void): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.el) {
        this.el = new Audio();
        this.el.preload = "auto";
      }
      const el = this.el;
      const times = onWord ? this.timings(key) : undefined;
      let raf = 0;
      let lastWord = -1;
      const finish = (ok: boolean) => {
        cancelAnimationFrame(raf);
        el.onended = el.onerror = null;
        resolve(ok);
      };
      el.onended = () => finish(true);
      el.onerror = () => finish(false);
      el.src = this.url(key);
      el.volume = this.settings.volume;
      el.playbackRate = slow ? 0.7 : 1;
      (el as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
      el.play().then(
        () => {
          if (!times || !onWord) return;
          const tick = () => {
            if (my !== this.token) return;
            const t = el.currentTime;
            let i = 0;
            while (i + 1 < times.length && times[i + 1] <= t) i++;
            if (i !== lastWord) { lastWord = i; onWord(i); }
            raf = requestAnimationFrame(tick);
          };
          tick();
        },
        () => finish(false),
      );
    });
  }

  private speak(text: string, slow: boolean, my: number): Promise<void> {
    return new Promise((resolve) => {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth || typeof SpeechSynthesisUtterance === "undefined" || !text) {
        void wait(Math.min(1500, 300 + text.length * 30)).then(resolve);
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANG[this.settings.accent];
      const voice = synth.getVoices().find((v) => v.lang.replace("_", "-") === u.lang);
      if (voice) u.voice = voice;
      u.rate = slow ? 0.7 : 0.9;
      u.volume = this.settings.volume;
      const timer = setTimeout(resolve, 3000 + text.length * 120); // some browsers never fire onend
      u.onend = u.onerror = () => { clearTimeout(timer); resolve(); };
      if (my === this.token) synth.speak(u);
      else resolve();
    });
  }
}

export function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, fastMode() ? 0 : ms));
}

export const audio = new AudioEngine();
