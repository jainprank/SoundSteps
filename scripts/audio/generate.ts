// Generates every audio clip SoundSteps needs, for each accent.
//
//   npm run audio                 # all accents, only missing/changed clips
//   npm run audio -- --accent in  # one accent
//   npm run audio -- --force      # regenerate everything
//   npm run audio -- --no-verify  # skip the speech-to-text check of Fish Audio clips
//
// Voices (see VOICES below):
//  - "fish": a Fish Audio voice (https://fish.audio), e.g. a custom/cloned voice.
//    Needs FISH_API_KEY in the environment or in a git-ignored .env.local file.
//    Every clip is transcribed back with Fish Audio speech-to-text and compared
//    with the intended text, and sentence word timings come from the transcript.
//    Without a key, existing Fish clips are kept and only missing clips fall back
//    to the macOS voice.
//  - "say": a macOS text-to-speech voice (needs macOS).
//
// Isolated phonemes are carved out of carrier words (see dsp.ts) so consonants
// stay crisp. A recorded clip placed in recordings/<accent>/<key>.wav (e.g.
// recordings/in/ph/s.wav) always wins over the generated one. Encoding uses
// macOS `afconvert`.

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { phonemeEntries, speechEntries, type SpeechEntry } from "../../src/content/audioKeys";
import { PHONEME_BY_ID } from "../../src/content/phonemes";
import { splitWords } from "../../src/content/reading";
import type { Accent, CarveRecipe } from "../../src/content/types";
import { carve, concat, duration, fade, normalise, profile, readWav, trim, writeWav, type Clip } from "./dsp";
import { fishASR, fishKey, fishTTS, type FishVoice } from "./fish";

const run = promisify(execFile);
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CACHE = join(ROOT, ".audio-cache");
const OUT = join(ROOT, "public/audio");
const MANIFEST = join(ROOT, "src/content/audio-manifest.json");
const RECORDINGS = join(ROOT, "recordings");

interface SayVoice { provider: "say"; voice: string; wordRate: number; speechRate: number; carrierRate: number }
interface FishConfig { provider: "fish"; label: string; fish: FishVoice; wordSpeed: number; carrierSpeed: number; fallback: SayVoice }
type VoiceConfig = SayVoice | FishConfig;

const RISHI: SayVoice = { provider: "say", voice: "Rishi", wordRate: 140, speechRate: 160, carrierRate: 110 };

export const VOICES: Record<Accent, VoiceConfig> = {
  // Priyanka's custom voice: friendly and calm, slightly slower than normal speech
  in: {
    provider: "fish",
    label: "Priyanka (Fish Audio)",
    fish: { referenceId: "a82e43a901704f1f82b4e302e9b5e9b2", model: "s2.1-pro-free", speed: 0.9, temperature: 0.5 },
    wordSpeed: 0.85,
    carrierSpeed: 0.8,
    fallback: RISHI,
  },
  gb: { provider: "say", voice: "Daniel", wordRate: 140, speechRate: 160, carrierRate: 110 },
  us: { provider: "say", voice: "Samantha", wordRate: 140, speechRate: 160, carrierRate: 110 },
};

interface Manifest {
  voices: Record<string, string>;
  /** key → [seconds, content id] */
  clips: Record<string, Record<string, [number, string]>>;
  /** key → word start times in seconds */
  timings: Record<string, Record<string, number[]>>;
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const verify = !args.includes("--no-verify");
const phonemesOnly = args.includes("--phonemes-only");
const accentArg = args.includes("--accent") ? (args[args.indexOf("--accent") + 1] as Accent) : null;
const accents: Accent[] = accentArg ? [accentArg] : ["in", "gb", "us"];
const KEY = fishKey(ROOT);

const manifest: Manifest = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, "utf8"))
  : { voices: {}, clips: {}, timings: {} };

const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 8);

// ── synthesis ────────────────────────────────────────────────────────

async function say(voice: string, rate: number, text: string): Promise<Clip> {
  const file = join(CACHE, `${voice}-${rate}`, `${hash(text)}.wav`);
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
    await run("say", ["-v", voice, "-r", String(rate), "--file-format=WAVE", "--data-format=LEI16@22050", "-o", file, text]);
  }
  return readWav(file);
}

async function fish(cfg: FishConfig, text: string, speed: number): Promise<Clip> {
  const v = { ...cfg.fish, speed };
  const dir = join(CACHE, `fish-${v.referenceId.slice(0, 8)}-${v.model ?? "default"}-${speed}-${v.temperature}`);
  const file = join(dir, `${hash(text)}.wav`);
  if (!existsSync(file)) {
    if (!KEY) throw new Error("no key");
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, await fishTTS(KEY, v, text));
  }
  return readWav(file);
}

type Kind = "word" | "speech" | "carrier";

/** Content id: changes whenever the voice, its settings, or the text change. */
function clipId(cfg: VoiceConfig, kind: Kind, text: string, useFish: boolean): string {
  if (cfg.provider === "fish" && useFish) {
    const speed = kind === "word" ? cfg.wordSpeed : kind === "carrier" ? cfg.carrierSpeed : cfg.fish.speed;
    return "fish-" + hash(`${cfg.fish.referenceId}|${cfg.fish.model}|${speed}|${cfg.fish.temperature}|${text}`);
  }
  const s = cfg.provider === "fish" ? cfg.fallback : cfg;
  const rate = kind === "word" ? s.wordRate : kind === "carrier" ? s.carrierRate : s.speechRate;
  return hash(`${s.voice}|${rate}|${text}`);
}

async function synth(cfg: VoiceConfig, kind: Kind, text: string, useFish: boolean): Promise<Clip> {
  if (cfg.provider === "fish" && useFish) {
    return fish(cfg, text, kind === "word" ? cfg.wordSpeed : kind === "carrier" ? cfg.carrierSpeed : cfg.fish.speed);
  }
  const s = cfg.provider === "fish" ? cfg.fallback : cfg;
  return say(s.voice, kind === "word" ? s.wordRate : kind === "carrier" ? s.carrierRate : s.speechRate, text);
}

/** Text sent to the voice. For Fish voices, lone words get a full stop so they're said as a complete answer. */
function spoken(e: SpeechEntry, fishVoice: boolean) {
  return fishVoice && e.key.startsWith("w/") && !/[.!?]$/.test(e.text) ? `${e.text}.` : e.text;
}

// ── output ───────────────────────────────────────────────────────────

function tmpWav(accent: Accent, key: string) {
  return join(CACHE, "tmp", accent, `${key}.wav`);
}

async function encode(clip: Clip, accent: Accent, key: string) {
  const wav = tmpWav(accent, key);
  const m4a = join(OUT, accent, `${key}.m4a`);
  mkdirSync(dirname(wav), { recursive: true });
  mkdirSync(dirname(m4a), { recursive: true });
  writeWav(wav, clip);
  await run("afconvert", ["-f", "m4af", "-d", "aac", "-b", "40000", wav, m4a]);
}

function recorded(accent: Accent, key: string): Clip | null {
  const f = join(RECORDINGS, accent, `${key}.wav`);
  return existsSync(f) ? trim(readWav(f)) : null;
}

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

async function carvePhoneme(cfg: VoiceConfig, recipe: CarveRecipe, useFish: boolean, short = false): Promise<Clip> {
  if (recipe.kind === "concat") {
    const parts = await Promise.all(recipe.parts.map((p) => carvePhoneme(cfg, PHONEME_BY_ID[p].carve, useFish, true)));
    return fade(concat(parts), 2, 30);
  }
  const word = await synth(cfg, "carrier", recipe.word, useFish);
  const r = short && "stretchTo" in recipe ? { ...recipe, stretchTo: 0.16 } : recipe;
  return carve(word, r as Exclude<CarveRecipe, { kind: "concat" }>);
}

// ── verification with speech-to-text ─────────────────────────────────

const HOMOPHONES = [
  ["sun", "son"], ["bee", "be", "b"], ["sea", "see", "c"], ["tail", "tale"], ["sail", "sale"], ["mail", "male"],
  ["pain", "pane"], ["right", "write", "rite"], ["night", "knight"], ["for", "four", "fore"], ["too", "to", "two"],
  ["one", "won", "1"], ["eight", "ate", "8"], ["by", "buy", "bye"], ["her", "hur"], ["oh", "o"], ["no", "know"],
  ["i", "eye", "aye"], ["you", "u", "ewe"], ["are", "r"], ["tea", "t", "tee"], ["wood", "would"], ["flu", "flew"],
  ["herb", "erb"], ["mum", "mom"], ["six", "6"], ["ten", "10"], ["five", "5"], ["nine", "9"], ["way", "weigh"],
  ["hole", "whole"], ["hare", "hair"], ["fir", "fur"], ["dear", "deer"], ["cell", "sell"], ["meet", "meat"],
  ["peel", "peal"], ["week", "weak"], ["sew", "so"], ["new", "knew"], ["bow", "bough"], ["the", "da", "thee"],
];
const norm = (s: string) => s.toLowerCase().replace(/<[^>]*>|\[[^\]]*\]|\([^)]*\)/g, " ").replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();
const same = (a: string, b: string) => a === b || HOMOPHONES.some((g) => g.includes(a) && g.includes(b));

function heardRight(entry: SpeechEntry, heard: string): boolean {
  const want = norm(entry.text).split(" ").filter(Boolean);
  const got = norm(heard).split(" ").filter(Boolean);
  if (entry.key.startsWith("n/")) {
    const letter = entry.key.slice(2);
    const names: Record<string, string[]> = { s: ["s", "ess", "es"], z: ["z", "zed", "zee"], h: ["h", "aitch", "age"] };
    return got.length > 0 && got.length <= 2 && got.some((g) => g === letter || names[letter]?.includes(g) || g.startsWith(letter));
  }
  if (want.length <= 2) return want.every((w) => got.some((g) => same(w, g))) && got.length <= want.length + 1;
  // sentences: most words must be heard, in any spelling
  const hits = want.filter((w) => got.some((g) => same(w, g))).length;
  return hits / want.length >= 0.75;
}

interface AsrCache { text: string; starts: number[] | null }

async function transcribe(accent: Accent, key: string, id: string, timed: boolean, words: string[]): Promise<AsrCache> {
  const file = join(CACHE, "asr", accent, `${key}.${id}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const t = await fishASR(KEY!, readFileSync(tmpWav(accent, key)), timed);
  let starts: number[] | null = null;
  if (timed) {
    const segs = t.segments.filter((s) => norm(s.text));
    if (segs.length === words.length) starts = segs.map((s) => round(s.start));
  }
  const out = { text: t.text, starts };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(out));
  return out;
}

// ── main ─────────────────────────────────────────────────────────────

async function main() {
  for (const accent of accents) {
    const cfg = VOICES[accent];
    const useFish = cfg.provider === "fish" && !!KEY;
    if (cfg.provider === "fish" && !KEY) {
      console.warn(`[${accent}] No FISH_API_KEY: keeping existing ${cfg.label} clips; any missing clip uses the macOS voice ${cfg.fallback.voice}.`);
    }
    const clips = (manifest.clips[accent] ??= {});
    const timings = (manifest.timings[accent] ??= {});
    manifest.voices[accent] = cfg.provider === "fish" ? cfg.label : cfg.voice;
    const keep = (key: string) => !useFish && cfg.provider === "fish" && clips[key]?.[1]?.startsWith("fish-") && existsSync(join(OUT, accent, `${key}.m4a`));
    const t0 = Date.now();
    let made = 0;

    // phonemes, carved from carrier words in the same voice
    const report: string[] = [];
    for (const p of phonemeEntries()) {
      const rec = recorded(accent, p.key);
      const carriers = p.carve.kind === "concat" ? p.carve.parts.map((x) => JSON.stringify(PHONEME_BY_ID[x].carve)).join() : JSON.stringify(p.carve);
      const id = rec ? "rec-" + hash(String(rec.x.length)) : clipId(cfg, "carrier", carriers + "carve-v5", useFish);
      if (keep(p.key) || (!force && clips[p.key]?.[1] === id && existsSync(join(OUT, accent, `${p.key}.m4a`)))) continue;
      const clip = normalise(rec ?? (await carvePhoneme(cfg, p.carve, useFish)), -22);
      await encode(clip, accent, p.key);
      clips[p.key] = [round(duration(clip)), id];
      report.push(`${p.phoneme.padEnd(4)} ${duration(clip).toFixed(2)}s ${profile(clip)}`);
      made++;
    }
    if (report.length) console.log(`[${accent}] phonemes (S=hiss v=voice .=quiet)\n  ` + report.join("\n  "));

    // words, phrases, sentences
    const entries = phonemesOnly ? [] : speechEntries(accent);
    await pool(entries, useFish ? 4 : 6, async (e) => {
      const kind: Kind = e.key.startsWith("w/") || e.key.startsWith("n/") ? "word" : "speech";
      const text = spoken(e, useFish);
      const rec = recorded(accent, e.key);
      const id = rec ? "rec-" + hash(String(rec.x.length)) : clipId(cfg, kind, text, useFish);
      if (keep(e.key) || (!force && clips[e.key]?.[1] === id && existsSync(join(OUT, accent, `${e.key}.m4a`)))) return;
      const clip = normalise(rec ?? trim(await synth(cfg, kind, text, useFish)));
      await encode(clip, accent, e.key);
      clips[e.key] = [round(duration(clip)), id];
      made++;
      if (made % 100 === 0) console.log(`[${accent}] ${made} clips…`);
    });

    // check Fish Audio clips by transcribing them back; also gives exact word timings
    const problems: string[] = [];
    const asrTimed = new Set<string>();
    let asrOk = true;
    if (useFish && verify) {
      await pool(entries.filter((e) => clips[e.key]?.[1]?.startsWith("fish-") && existsSync(tmpWav(accent, e.key))), 4, async (e) => {
        if (!asrOk) return;
        const words = splitWords(e.text).map((w) => w.bare);
        let t: AsrCache;
        try {
          t = await transcribe(accent, e.key, clips[e.key][1], !!e.timed, words);
        } catch (err) {
          if (asrOk) console.warn(`[${accent}] speech-to-text check skipped: ${(err as Error).message.slice(0, 160)}`);
          asrOk = false;
          return;
        }
        if (!heardRight(e, t.text)) problems.push(`${e.key.padEnd(22)} wanted "${e.text}"  heard "${t.text}"`);
        if (e.timed && t.starts) {
          timings[e.key] = t.starts;
          asrTimed.add(e.key);
        }
      });
      // free checks that need no API: every clip should have a believable length
      for (const e of entries) {
        const d = clips[e.key]?.[0];
        if (!d || !clips[e.key][1].startsWith("fish-")) continue;
        const words = splitWords(e.text).length;
        const max = e.key.startsWith("w/") || e.key.startsWith("n/") ? 1.8 : 1.2 + words * 0.75;
        const min = e.key.startsWith("w/") || e.key.startsWith("n/") ? 0.15 : 0.18 * words;
        if (d > max || d < min) problems.push(`${e.key.padEnd(22)} "${e.text}" is ${d}s long (expected ${min.toFixed(1)}–${max.toFixed(1)}s)`);
      }
      if (problems.length) {
        const f = join(ROOT, `scripts/audio/review-${accent}.txt`);
        writeFileSync(f, problems.sort().join("\n") + "\n");
        console.log(`[${accent}] ${problems.length} clips may be misread; listen to them (list in ${f}). Fix a clip by rewording its text, adding a recording, or deleting its line from .audio-cache and re-running.`);
      } else {
        rmSync(join(ROOT, `scripts/audio/review-${accent}.txt`), { force: true });
        console.log(`[${accent}] checks passed: ${asrOk ? "every clip says what it should" : "all clip lengths look right (speech-to-text skipped)"}`);
      }
    }

    // timings for clips without transcript timings: spread the sentence's length
    // over its words in proportion to how long each word takes on its own
    for (const e of entries.filter((x) => x.timed)) {
      const total = clips[e.key]?.[0];
      if (!total || asrTimed.has(e.key)) continue;
      const words = splitWords(e.text).map((w) => w.bare.toLowerCase());
      const lens = words.map((w) => clips[`w/${w}`]?.[0] ?? 0.35);
      const sum = lens.reduce((a, b) => a + b, 0);
      let t = 0.02;
      timings[e.key] = lens.map((l) => {
        const start = round(t);
        t += (l / sum) * (total - 0.05);
        return start;
      });
    }
    console.log(`[${accent}] ${made} clips generated in ${((Date.now() - t0) / 1000).toFixed(0)}s (${Object.keys(clips).length} total)`);
    writeFileSync(MANIFEST, JSON.stringify(manifest));
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest));
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
