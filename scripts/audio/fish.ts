// Fish Audio (https://fish.audio) text-to-speech and speech-to-text, used by
// generate.ts for custom voices. Clips are generated once, at build time; the
// app itself never calls Fish Audio.
//
// The API key is read from FISH_API_KEY, or from a git-ignored .env.local file
// in the project root:   FISH_API_KEY=...

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function fishKey(root: string): string | null {
  if (process.env.FISH_API_KEY) return process.env.FISH_API_KEY.trim();
  const f = join(root, ".env.local");
  if (!existsSync(f)) return null;
  const line = readFileSync(f, "utf8").split(/\r?\n/).find((l) => /^\s*FISH_API_KEY\s*=/.test(l));
  return line ? line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "") || null : null;
}

async function withRetry<T>(what: string, fn: () => Promise<Response>, read: (r: Response) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const res = await fn();
    if (res.ok) return read(res);
    const body = await res.text().catch(() => "");
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    // never echo request headers: they contain the key
    throw new Error(`Fish Audio ${what} failed: HTTP ${res.status} ${body.slice(0, 300)}`);
  }
}

export interface FishVoice {
  /** model id from the fish.audio voice page URL */
  referenceId: string;
  /** TTS model; omit for Fish Audio's default */
  model?: string;
  /** 0.5–2.0; below 1 is slower and calmer */
  speed: number;
  /** 0–1; lower is steadier and more consistent between clips */
  temperature: number;
}

/** Returns 16-bit mono WAV bytes. */
export async function fishTTS(key: string, voice: FishVoice, text: string): Promise<Buffer> {
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  if (voice.model) headers.model = voice.model;
  const body = JSON.stringify({
    text,
    reference_id: voice.referenceId,
    format: "wav",
    sample_rate: 24000,
    normalize: true,
    latency: "normal",
    temperature: voice.temperature,
    top_p: 0.7,
    prosody: { speed: voice.speed },
  });
  return withRetry(`text-to-speech for "${text.slice(0, 40)}"`, () => fetch("https://api.fish.audio/v1/tts", { method: "POST", headers, body }), async (r) => Buffer.from(await r.arrayBuffer()));
}

export interface Transcript {
  text: string;
  segments: { text: string; start: number; end: number }[];
}

export async function fishASR(key: string, wav: Buffer, timestamps: boolean): Promise<Transcript> {
  const form = new FormData();
  form.append("audio", new Blob([wav], { type: "audio/wav" }), "clip.wav");
  form.append("language", "en");
  form.append("ignore_timestamps", timestamps ? "false" : "true");
  return withRetry("speech-to-text", () => fetch("https://api.fish.audio/v1/asr", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form }), async (r) => {
    const j = (await r.json()) as { text?: string; segments?: { text: string; start: number; end: number }[] };
    return { text: j.text ?? "", segments: j.segments ?? [] };
  });
}
