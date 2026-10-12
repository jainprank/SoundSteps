// Generates every audio clip SoundSteps needs, for each accent, using the
// text-to-speech voices built into macOS (`say`) and `afconvert` for AAC encoding.
//
//   npm run audio                 # all accents, only missing/changed clips
//   npm run audio -- --accent gb  # one accent
//   npm run audio -- --force      # regenerate everything
//
// Isolated phonemes are carved out of carrier words (see dsp.ts) so consonants
// stay crisp. A recorded clip placed in recordings/<accent>/<key>.wav (e.g.
// recordings/in/ph/s.wav) always wins over the generated one.

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { phonemeEntries, speechEntries, type PhonemeEntry } from "../../src/content/audioKeys";
import { PHONEME_BY_ID } from "../../src/content/phonemes";
import { splitWords } from "../../src/content/reading";
import type { Accent, CarveRecipe } from "../../src/content/types";
import { carve, concat, duration, fade, normalise, profile, readWav, trim, writeWav, type Clip } from "./dsp";

const run = promisify(execFile);
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CACHE = join(ROOT, ".audio-cache");
const OUT = join(ROOT, "public/audio");
const MANIFEST = join(ROOT, "src/content/audio-manifest.json");
const RECORDINGS = join(ROOT, "recordings");

export const VOICES: Record<Accent, { voice: string; wordRate: number; speechRate: number; carrierRate: number }> = {
  in: { voice: "Rishi", wordRate: 140, speechRate: 160, carrierRate: 110 },
  gb: { voice: "Daniel", wordRate: 140, speechRate: 160, carrierRate: 110 },
  us: { voice: "Samantha", wordRate: 140, speechRate: 160, carrierRate: 110 },
};

interface Manifest {
  voices: Record<string, string>;
  /** key → [seconds, content hash] */
  clips: Record<string, Record<string, [number, string]>>;
  /** key → word start times in seconds */
  timings: Record<string, Record<string, number[]>>;
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const phonemesOnly = args.includes("--phonemes-only");
const accentArg = args.includes("--accent") ? (args[args.indexOf("--accent") + 1] as Accent) : null;
const accents: Accent[] = accentArg ? [accentArg] : ["in", "gb", "us"];

const manifest: Manifest = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, "utf8"))
  : { voices: {}, clips: {}, timings: {} };

const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 8);

async function say(voice: string, rate: number, text: string): Promise<Clip> {
  const file = join(CACHE, `${voice}-${rate}`, `${hash(text)}.wav`);
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
    await run("say", ["-v", voice, "-r", String(rate), "--file-format=WAVE", "--data-format=LEI16@22050", "-o", file, text]);
  }
  return readWav(file);
}

async function encode(clip: Clip, accent: Accent, key: string) {
  const wav = join(CACHE, "tmp", accent, `${key}.wav`);
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

async function carvePhoneme(accent: Accent, recipe: CarveRecipe, short = false): Promise<Clip> {
  const v = VOICES[accent];
  if (recipe.kind === "concat") {
    const parts = await Promise.all(recipe.parts.map((p) => carvePhoneme(accent, PHONEME_BY_ID[p].carve, true)));
    return fade(concat(parts), 2, 30);
  }
  const word = await say(v.voice, v.carrierRate, recipe.word);
  const r = short && "stretchTo" in recipe ? { ...recipe, stretchTo: 0.16 } : recipe;
  return carve(word, r as Exclude<CarveRecipe, { kind: "concat" }>);
}

async function main() {
  for (const accent of accents) {
    const v = VOICES[accent];
    manifest.voices[accent] = v.voice;
    const clips = (manifest.clips[accent] ??= {});
    const timings = (manifest.timings[accent] ??= {});
    const t0 = Date.now();
    let made = 0;

    // phonemes
    const report: string[] = [];
    for (const p of phonemeEntries()) {
      const h = hash(JSON.stringify(p.carve) + v.voice + "carve-v3");
      const rec = recorded(accent, p.key);
      const id = rec ? "rec-" + hash(String(rec.x.length)) : h;
      if (!force && clips[p.key]?.[1] === id && existsSync(join(OUT, accent, `${p.key}.m4a`))) continue;
      const clip = normalise(rec ?? (await carvePhoneme(accent, p.carve)), -22);
      await encode(clip, accent, p.key);
      clips[p.key] = [round(duration(clip)), id];
      report.push(`${(p as PhonemeEntry).phoneme.padEnd(4)} ${duration(clip).toFixed(2)}s ${profile(clip)}`);
      made++;
    }
    if (report.length) console.log(`[${accent}] phonemes (S=hiss v=voice .=quiet)\n  ` + report.join("\n  "));

    // speech
    const entries = phonemesOnly ? [] : speechEntries(accent);
    await pool(entries, 6, async (e) => {
      const isWord = e.key.startsWith("w/") || e.key.startsWith("n/");
      const rate = isWord ? v.wordRate : v.speechRate;
      const h = hash(`${v.voice}|${rate}|${e.text}`);
      const rec = recorded(accent, e.key);
      const id = rec ? "rec-" + hash(String(rec.x.length)) : h;
      if (!force && clips[e.key]?.[1] === id && existsSync(join(OUT, accent, `${e.key}.m4a`))) return;
      const clip = normalise(rec ?? trim(await say(v.voice, rate, e.text)));
      await encode(clip, accent, e.key);
      clips[e.key] = [round(duration(clip)), id];
      made++;
    });

    // word timings for highlighted narration: spread the sentence's length over its
    // words in proportion to how long each word takes on its own
    for (const e of entries.filter((x) => x.timed)) {
      const total = clips[e.key]?.[0];
      if (!total) continue;
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
  console.error(e);
  process.exit(1);
});
