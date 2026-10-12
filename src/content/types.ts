// Core content model. Everything a lesson needs (sounds, spellings, words,
// sentences, stories) is plain data so new content never needs UI changes.

export type Accent = "in" | "gb" | "us";

export const ACCENTS: { id: Accent; label: string; flag: string }[] = [
  { id: "in", label: "Indian English", flag: "🇮🇳" },
  { id: "gb", label: "British English", flag: "🇬🇧" },
  { id: "us", label: "American English", flag: "🇺🇸" },
];

/** Simple mouth pictures used for articulation tips. */
export type MouthShape =
  | "lips-closed" // m b p
  | "lip-teeth" // f v
  | "tongue-teeth" // th
  | "tongue-ridge" // t d n l s z
  | "open" // a o u ar
  | "smile" // i e ee ai
  | "round" // oo w oa or
  | "back" // k g ng
  | "breath" // h
  | "pout"; // sh ch j r

/**
 * How the audio generator cuts an isolated phoneme out of a carrier word.
 * The voices cannot speak a bare phoneme reliably, so we slice it out of a real word.
 */
export type CarveRecipe =
  | { kind: "fricativeStart"; word: string; stretchTo?: number } // hiss at the start: sun, ship
  | { kind: "voicedStart"; word: string; stretchTo?: number } // hum/buzz before the vowel: map, van
  | { kind: "stopStart"; word: string } // burst (+ aspiration) before the vowel: pan, tap
  | { kind: "voicedStopStart"; word: string; ms: number } // b d g j: burst + the smallest bit of vowel
  | { kind: "vowelStart"; word: string; stretchTo?: number } // vowel up to the following consonant: at, up
  | { kind: "vowelAfterStop"; word: string; stretchTo?: number } // vowel between consonants: put
  | { kind: "voicedEnd"; word: string; stretchTo?: number } // nasal tail: sing
  | { kind: "whole"; word: string } // the whole word is the sound: or
  | { kind: "concat"; parts: string[] }; // join other phonemes: k + w = /kw/

export interface Phoneme {
  id: string;
  /** IPA for grown-ups. */
  ipa: string;
  /** Child-facing display, e.g. "sss" or "a". */
  say: string;
  kind: "consonant" | "vowel";
  /** Continuous sounds can be stretched ("mmm"); stop sounds must be short and crisp. */
  continuous: boolean;
  mouth: MouthShape;
  /** One short articulation tip, read aloud by the guide. */
  tip: string;
  /** Used only when the recorded sound is unavailable: "s, as in sun". */
  fallback: string;
  carve: CarveRecipe;
}

/** A grapheme–phoneme correspondence, e.g. "ck" → /k/. */
export interface Correspondence {
  id: string;
  /** How the spelling is displayed: "ck", "a-e". */
  grapheme: string;
  phoneme: string;
  /** Letter name(s) for single letters, so we can teach name vs sound. */
  name?: string;
  /** Teaching example words (ids in the word bank). First is the "key" picture. */
  examples: string[];
  /** Optional note for grown-ups (alternative spellings, accent notes). */
  note?: string;
}

/** One unit of a word's spelling: the letters and which correspondence they use. */
export interface Token {
  g: string;
  /** correspondence id; "_" = silent letter (e.g. the e in a split digraph) */
  c: string;
}

export interface Word {
  id: string;
  text: string;
  tokens: Token[];
  emoji?: string;
  syllables: number;
  /** Optional meaning for vocabulary help. */
  meaning?: string;
}

export interface TrickyPart {
  g: string;
  /** set when this part is decodable with a taught correspondence */
  c?: string;
  /** set when this part is the tricky bit; describes the sound it makes */
  says?: string;
}

export interface TrickyWord {
  id: string;
  text: string;
  parts: TrickyPart[];
  /** Spoken explanation of the tricky bit. */
  explain: string;
  set: string;
}

export interface Sentence {
  id: string;
  text: string;
  emoji?: string;
}

export interface Question {
  id: string;
  ask: string;
  options: { text: string; emoji?: string }[];
  /** index of correct option; omit for open questions with no wrong answer (predictions). */
  answer?: number;
  kind: "who" | "what" | "where" | "why" | "how" | "predict" | "vocab";
}

export interface Story {
  id: string;
  title: string;
  level: 7 | 8;
  kind: "story" | "information";
  cover: string;
  /** pages of sentences */
  pages: { emoji: string; sentences: string[] }[];
  questions: Question[];
  /** events in order, for sequencing (level 8) */
  sequence?: { text: string; emoji: string }[];
  /** vocabulary words with child-friendly meanings */
  vocab?: { word: string; meaning: string }[];
  /** spelling pattern to hunt for */
  pattern?: { corr: string; label: string };
}
