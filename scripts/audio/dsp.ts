// Tiny DSP toolkit for preparing speech clips: WAV I/O, silence trimming,
// frame analysis, phoneme carving and WSOLA time-stretching. No dependencies.

import { readFileSync, writeFileSync } from "node:fs";
import type { CarveRecipe } from "../../src/content/types";

export interface Clip {
  sr: number;
  x: Float32Array;
}

export function readWav(path: string): Clip {
  const b = readFileSync(path);
  if (b.toString("ascii", 0, 4) !== "RIFF") throw new Error(`${path}: not a WAV file`);
  let off = 12;
  let sr = 22050;
  let channels = 1;
  let bits = 16;
  while (off < b.length) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "fmt ") {
      channels = b.readUInt16LE(off + 10);
      sr = b.readUInt32LE(off + 12);
      bits = b.readUInt16LE(off + 22);
    } else if (id === "data") {
      if (bits !== 16) throw new Error(`${path}: expected 16-bit PCM`);
      const n = Math.floor(size / 2 / channels);
      const x = new Float32Array(n);
      for (let i = 0; i < n; i++) x[i] = b.readInt16LE(off + 8 + i * 2 * channels) / 32768;
      return { sr, x };
    }
    off += 8 + size + (size % 2);
  }
  throw new Error(`${path}: no data chunk`);
}

export function writeWav(path: string, clip: Clip) {
  const n = clip.x.length;
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0, "ascii");
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVE", 8, "ascii");
  b.write("fmt ", 12, "ascii");
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(clip.sr, 24);
  b.writeUInt32LE(clip.sr * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36, "ascii");
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, clip.x[i])) * 32767), 44 + i * 2);
  writeFileSync(path, b);
}

// ── analysis ─────────────────────────────────────────────────────────

export interface Frame {
  rms: number;
  /** share of energy below ~400 Hz: high for hums (m n l r v), lower for open vowels */
  low: number;
  /** zero crossings per second: high for hissy sounds (s, sh, f) */
  zcr: number;
}

export const FRAME_MS = 10;

export function frames(clip: Clip): Frame[] {
  const w = Math.round((clip.sr * FRAME_MS) / 1000);
  const a = Math.exp((-2 * Math.PI * 400) / clip.sr);
  let y = 0;
  const lp = clip.x.map((v) => (y = (1 - a) * v + a * y));
  const out: Frame[] = [];
  for (let i = 0; i + w <= clip.x.length; i += w) {
    let e = 0;
    let el = 0;
    let z = 0;
    for (let j = i; j < i + w; j++) {
      e += clip.x[j] * clip.x[j];
      el += lp[j] * lp[j];
      if (j > i && clip.x[j] >= 0 !== clip.x[j - 1] >= 0) z++;
    }
    out.push({ rms: Math.sqrt(e / w), zcr: (z * 1000) / FRAME_MS, low: e > 1e-9 ? el / e : 0 });
  }
  return out;
}

const FRIC_ZCR = 3000;

function stats(f: Frame[]) {
  const max = Math.max(...f.map((x) => x.rms));
  const silent = (x: Frame) => x.rms < max * 0.04;
  const fric = (x: Frame) => !silent(x) && x.zcr > FRIC_ZCR;
  const strongVoiced = (x: Frame, level: number) => x.rms > max * level && x.zcr < FRIC_ZCR * 0.8;
  return { max, silent, fric, strongVoiced };
}

function slice(clip: Clip, fromFrame: number, toFrame: number): Clip {
  const w = (clip.sr * FRAME_MS) / 1000;
  return { sr: clip.sr, x: clip.x.slice(Math.round(fromFrame * w), Math.round(toFrame * w)) };
}

function sliceMs(clip: Clip, fromMs: number, toMs: number): Clip {
  return { sr: clip.sr, x: clip.x.slice(Math.round((fromMs * clip.sr) / 1000), Math.round((toMs * clip.sr) / 1000)) };
}

/** Remove leading/trailing silence (keeps a few ms of padding). */
export function trim(clip: Clip, padMs = 15): Clip {
  const f = frames(clip);
  const { silent } = stats(f);
  const first = f.findIndex((x) => !silent(x));
  let last = f.length - 1;
  while (last > 0 && silent(f[last])) last--;
  if (first < 0) return clip;
  const pad = padMs / FRAME_MS;
  return slice(clip, Math.max(0, first - pad), Math.min(f.length, last + 1 + pad));
}

export function fade(clip: Clip, inMs: number, outMs: number): Clip {
  const x = clip.x.slice();
  const fi = Math.round((inMs * clip.sr) / 1000);
  const fo = Math.round((outMs * clip.sr) / 1000);
  for (let i = 0; i < fi && i < x.length; i++) x[i] *= i / fi;
  for (let i = 0; i < fo && i < x.length; i++) x[x.length - 1 - i] *= i / fo;
  return { sr: clip.sr, x };
}

/** Loudness-normalise to a target RMS (dBFS) over the voiced part, with a peak cap. */
export function normalise(clip: Clip, targetDb = -20, peakCap = 0.95): Clip {
  const f = frames(clip);
  const { silent } = stats(f);
  const voiced = f.filter((x) => !silent(x));
  if (!voiced.length) return clip;
  const rms = Math.sqrt(voiced.reduce((a, x) => a + x.rms * x.rms, 0) / voiced.length);
  let gain = Math.pow(10, targetDb / 20) / rms;
  const peak = clip.x.reduce((a, v) => Math.max(a, Math.abs(v)), 0);
  if (peak * gain > peakCap) gain = peakCap / peak;
  return { sr: clip.sr, x: clip.x.map((v) => v * gain) };
}

export function concat(clips: Clip[], gapMs = 0): Clip {
  const sr = clips[0].sr;
  const gap = Math.round((gapMs * sr) / 1000);
  const n = clips.reduce((a, c) => a + c.x.length, 0) + gap * (clips.length - 1);
  const x = new Float32Array(n);
  let o = 0;
  clips.forEach((c, i) => {
    x.set(c.x, o);
    o += c.x.length + (i < clips.length - 1 ? gap : 0);
  });
  return { sr, x };
}

export function duration(clip: Clip) {
  return clip.x.length / clip.sr;
}

// ── WSOLA time stretch (keeps pitch; good for steady sounds like mmm, sss) ──

export function stretch(clip: Clip, targetSec: number): Clip {
  const L = clip.x.length;
  const N = Math.round(targetSec * clip.sr);
  // 30 ms grains, smaller for very short sounds such as /h/
  const W = Math.round(Math.min(0.03 * clip.sr, L / 2.5));
  if (N <= L || W < 0.006 * clip.sr) return clip;
  const Hs = W >> 1;
  const Ha = (Hs * L) / N;
  const delta = Math.round(0.008 * clip.sr);
  const win = new Float32Array(W).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / W));
  const out = new Float32Array(N + W);
  const norm = new Float32Array(N + W);
  let prevNatural = Hs;
  for (let k = 0; k * Hs < N; k++) {
    const ideal = Math.min(L - W, Math.round(k * Ha));
    let best = ideal;
    if (k > 0) {
      let bestC = -Infinity;
      for (let p = Math.max(0, ideal - delta); p <= Math.min(L - W, ideal + delta); p++) {
        let c = 0;
        for (let j = 0; j < W; j += 2) c += clip.x[p + j] * clip.x[Math.min(L - 1, prevNatural + j)];
        if (c > bestC) { bestC = c; best = p; }
      }
    }
    for (let j = 0; j < W; j++) {
      out[k * Hs + j] += clip.x[best + j] * win[j];
      norm[k * Hs + j] += win[j];
    }
    prevNatural = Math.min(L - W, best + Hs);
  }
  for (let i = 0; i < N; i++) if (norm[i] > 1e-3) out[i] /= norm[i];
  return { sr: clip.sr, x: out.slice(0, N) };
}

// ── phoneme carving ──────────────────────────────────────────────────

/**
 * Where a word-initial voiced consonant (m n l r v z th) hands over to the vowel.
 * Voices differ a lot, so the cut is measured per word:
 *  - z often turns hissy in the middle: run to the end of the hiss;
 *  - a sudden loudness jump marks the vowel (quiet hum → loud vowel);
 *  - otherwise the consonant has more low-frequency energy than the vowel: cut
 *    halfway between this word's consonant level and its steady-vowel level.
 */
function voicedConsonantEnd(f: Frame[], onset: number, fric: (x: Frame) => boolean): number {
  const max = Math.max(...f.map((x) => x.rms));
  const cap = onset + Math.round(250 / FRAME_MS);
  const firstFric = f.findIndex((x, i) => i >= onset && i < onset + 8 && fric(x));
  if (firstFric >= 0) {
    let end = firstFric;
    while (end < cap && (fric(f[end]) || f[end].rms < 0.5 * max)) end++;
    return end;
  }
  const jump = f.findIndex((x, i) => i > onset + 2 && i < cap && x.rms > 0.75 * max && x.rms > 1.6 * f[i - 1].rms);
  const peak = f.findIndex((x) => x.rms === max);
  const steady = f.slice(peak, peak + 10).map((x) => x.low).sort((a, b) => a - b);
  const vowelLow = steady[Math.floor(steady.length / 2)] ?? 0.4;
  const consLow = f.slice(onset, onset + 3).reduce((a, x) => a + x.low, 0) / 3;
  let lowEnd = -1;
  if (consLow - vowelLow > 0.12) {
    const mid = (consLow + vowelLow) / 2;
    lowEnd = f.findIndex((x, i) => i > onset + 3 && x.low < mid);
  }
  const candidates = [jump, lowEnd].filter((x) => x > 0);
  return candidates.length ? Math.min(cap, ...candidates) : onset + Math.round(90 / FRAME_MS);
}

/** Cut an isolated phoneme out of a carrier-word recording. */
export function carve(word: Clip, recipe: Exclude<CarveRecipe, { kind: "concat" }>): Clip {
  const f = frames(word);
  const { silent, fric, strongVoiced } = stats(f);
  const onset = Math.max(0, f.findIndex((x) => !silent(x)));
  const maxFrames = (ms: number) => Math.round(ms / FRAME_MS);
  let seg: Clip;

  switch (recipe.kind) {
    case "fricativeStart": {
      // take the hiss up to where the voice comes in
      let end = onset;
      while (end < f.length && !strongVoiced(f[end], 0.3) && end - onset < maxFrames(350)) end++;
      // drop the first voicing transition frame
      seg = slice(word, onset, Math.max(onset + 3, end - 1));
      seg = fade(seg, 8, 25);
      break;
    }
    case "voicedStart": {
      const end = voicedConsonantEnd(f, onset, fric);
      seg = slice(word, onset, Math.max(onset + 4, end));
      seg = fade(seg, 10, 30);
      break;
    }
    case "stopStart": {
      let end = onset + 1;
      while (end < f.length && !strongVoiced(f[end], 0.3) && end - onset < maxFrames(120)) end++;
      seg = slice(word, onset, Math.max(onset + 3, end));
      seg = fade(seg, 2, 12);
      break;
    }
    case "voicedStopStart": {
      // some voices hum for 100 ms+ before releasing b/d/g; start just before the
      // release burst (a sudden jump in loudness) so the child hears the "b", not the hum
      const max = Math.max(...f.map((x) => x.rms));
      const release = f.findIndex((x, i) => i > onset + 3 && x.rms > 0.6 * max && x.rms > 1.5 * f[i - 1].rms);
      const startFrame = release > 0 ? release - 2 : onset;
      const ms = startFrame * FRAME_MS;
      seg = sliceMs(word, ms, ms + recipe.ms);
      seg = fade(seg, 2, 25);
      break;
    }
    case "vowelStart": {
      let end = onset + maxFrames(40);
      while (end < f.length && !silent(f[end]) && !fric(f[end]) && f[end].rms > 0.25 * Math.max(...f.map((x) => x.rms))) end++;
      seg = slice(word, onset, end);
      seg = fade(seg, 10, 35);
      break;
    }
    case "vowelAfterStop": {
      const start = f.findIndex((x, i) => i > onset && strongVoiced(x, 0.3));
      let end = start + maxFrames(40);
      while (end < f.length && !silent(f[end]) && !fric(f[end]) && f[end].rms > 0.25 * Math.max(...f.map((x) => x.rms))) end++;
      seg = slice(word, start, end);
      seg = fade(seg, 15, 35);
      break;
    }
    case "voicedEnd": {
      let end = f.length - 1;
      while (end > 0 && silent(f[end])) end--;
      let start = end;
      const max = Math.max(...f.map((x) => x.rms));
      while (start > onset && f[start].rms < 0.5 * max) start--;
      seg = slice(word, start + 2, end + 1);
      seg = fade(seg, 25, 40);
      break;
    }
    case "whole":
      seg = fade(trim(word, 5), 5, 30);
      break;
  }
  if ("stretchTo" in recipe && recipe.stretchTo && duration(seg) < recipe.stretchTo) {
    seg = fade(stretch(seg, recipe.stretchTo), 10, 40);
  }
  return seg;
}

/** Rough character of a clip for the generator's report (S = hiss, v = voice, . = silence). */
export function profile(clip: Clip): string {
  const f = frames(clip);
  const { silent, fric } = stats(f);
  return f.map((x) => (silent(x) ? "." : fric(x) ? "S" : "v")).join("");
}
