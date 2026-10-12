import type { EnvSoundId } from "@/content/level0";

// Small sound effects synthesised with the Web Audio API — no files to load.
// Feedback sounds are deliberately soft: a gentle chime for success and a quiet
// "hmm" for a retry. There is never a loud buzzer.

export type SfxId = "correct" | "retry" | "pop" | "tap" | "cheer" | "chomp" | `env:${EnvSoundId}`;

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, out: AudioNode, freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.25) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g).connect(out);
  o.start(start);
  o.stop(start + dur + 0.05);
}

function noise(c: AudioContext, out: AudioNode, start: number, dur: number, gain: number, filterFreq: number, q = 1, type: BiquadFilterType = "bandpass") {
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterFreq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  src.connect(f).connect(g).connect(out);
  src.start(start);
}

export function playSfx(id: SfxId, volume = 0.9) {
  const c = ac();
  if (!c) return;
  const out = c.createGain();
  out.gain.value = volume;
  out.connect(c.destination);
  const t = c.currentTime + 0.02;
  switch (id) {
    case "correct":
      tone(c, out, 659, t, 0.25, "sine", 0.18);
      tone(c, out, 988, t + 0.1, 0.35, "sine", 0.15);
      break;
    case "retry":
      tone(c, out, 330, t, 0.25, "sine", 0.08);
      tone(c, out, 294, t + 0.12, 0.3, "sine", 0.06);
      break;
    case "pop":
      tone(c, out, 600, t, 0.08, "triangle", 0.2);
      noise(c, out, t, 0.05, 0.15, 2000, 2);
      break;
    case "tap":
      tone(c, out, 880, t, 0.06, "sine", 0.1);
      break;
    case "chomp":
      noise(c, out, t, 0.08, 0.25, 500, 1);
      noise(c, out, t + 0.15, 0.08, 0.25, 500, 1);
      break;
    case "cheer":
      [523, 659, 784, 1047].forEach((f, i) => tone(c, out, f, t + i * 0.1, 0.4, "sine", 0.14));
      break;
    case "env:drum":
      [0, 0.35, 0.7].forEach((d) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.frequency.setValueAtTime(140, t + d);
        o.frequency.exponentialRampToValueAtTime(50, t + d + 0.3);
        g.gain.setValueAtTime(0.6, t + d);
        g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.35);
        o.connect(g).connect(out);
        o.start(t + d);
        o.stop(t + d + 0.4);
      });
      break;
    case "env:bell":
      [0, 0.6].forEach((d) => {
        tone(c, out, 880, t + d, 1.2, "sine", 0.2);
        tone(c, out, 2210, t + d, 0.8, "sine", 0.06);
        tone(c, out, 1320, t + d, 1.0, "sine", 0.08);
      });
      break;
    case "env:whistle": {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.setValueAtTime(1800, t);
      o.frequency.linearRampToValueAtTime(2400, t + 0.4);
      o.frequency.linearRampToValueAtTime(1600, t + 0.9);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.05);
      g.gain.setValueAtTime(0.12, t + 0.85);
      g.gain.linearRampToValueAtTime(0, t + 0.95);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 1);
      break;
    }
    case "env:clap":
      [0, 0.3, 0.6, 0.9].forEach((d) => noise(c, out, t + d, 0.09, 0.6, 1200, 0.8));
      break;
    case "env:rain":
      for (let i = 0; i < 40; i++) noise(c, out, t + Math.random() * 1.6, 0.03, 0.15 + Math.random() * 0.15, 3000 + Math.random() * 3000, 3);
      noise(c, out, t, 1.8, 0.08, 1500, 0.5, "lowpass");
      break;
    case "env:clock":
      for (let i = 0; i < 6; i++) tone(c, out, i % 2 ? 1500 : 1200, t + i * 0.3, 0.04, "square", 0.08);
      break;
    case "env:horn":
      [0, 0.45].forEach((d) => {
        tone(c, out, 392, t + d, 0.35, "sawtooth", 0.08);
        tone(c, out, 494, t + d, 0.35, "sawtooth", 0.06);
      });
      break;
    case "env:phone":
      [0, 0.12, 0.24, 0.36, 0.8, 0.92, 1.04, 1.16].forEach((d) => tone(c, out, 1400, t + d, 0.1, "sine", 0.12));
      break;
  }
}
