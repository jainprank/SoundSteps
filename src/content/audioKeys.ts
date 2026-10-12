import { ANIMALS } from "./level0";
import { CORRESPONDENCES } from "./correspondences";
import { LEVELS } from "./curriculum";
import { PHONEMES } from "./phonemes";
import { PHRASES, type PhraseId } from "./phrases";
import { L5_SENTENCES, L7_SENTENCES, STORIES } from "./reading";
import { TRICKY, TRICKY_SENTENCES } from "./tricky";
import type { Accent, CarveRecipe } from "./types";
import { NONSENSE, WORDS } from "./words";

// Audio keys: one string per clip, mapped to public/audio/<accent>/<key>.m4a.
// The same registry drives the generator (scripts/audio/generate.ts), the in-app
// "Sound check" page, and the speech-synthesis fallback text.

export const K = {
  phoneme: (id: string) => `ph/${id}`,
  word: (text: string) => `w/${text.toLowerCase()}`,
  letterName: (letter: string) => `n/${letter.toLowerCase()}`,
  phrase: (id: PhraseId) => `p/${id}`,
  sentence: (id: string) => `s/${id}`,
  trickySentence: (id: string) => `ts/${id.toLowerCase()}`,
  trickyExplain: (id: string) => `x/${id.toLowerCase()}`,
  tip: (phonemeId: string) => `tip/${phonemeId}`,
  animal: (id: string) => `a/${id}`,
  levelIntro: (level: number) => `li/${level}`,
  storyTitle: (story: string) => `st/${story}/title`,
  storySentence: (story: string, page: number, i: number) => `st/${story}/${page}-${i}`,
  question: (story: string, q: string) => `q/${story}/${q}`,
  option: (story: string, q: string, i: number) => `q/${story}/${q}-${i}`,
  vocab: (story: string, word: string) => `v/${story}/${word}`,
  seq: (story: string, i: number) => `sq/${story}/${i}`,
};

export interface SpeechEntry {
  key: string;
  text: string;
  /** sentences get per-word timings for highlighting */
  timed?: boolean;
}

export interface PhonemeEntry {
  key: string;
  phoneme: string;
  carve: CarveRecipe;
  fallback: string;
}

export function phonemeEntries(): PhonemeEntry[] {
  return PHONEMES.map((p) => ({ key: K.phoneme(p.id), phoneme: p.id, carve: p.carve, fallback: p.fallback }));
}

export function speechEntries(_accent: Accent): SpeechEntry[] {
  const out = new Map<string, SpeechEntry>();
  const add = (key: string, text: string, timed = false) => {
    if (!out.has(key)) out.set(key, { key, text, timed });
  };
  for (const w of [...WORDS, ...NONSENSE]) add(K.word(w.text), w.text);
  for (const t of TRICKY) {
    add(K.word(t.text), t.text);
    add(K.trickyExplain(t.id), t.explain);
  }
  for (const [id, { sentence }] of Object.entries(TRICKY_SENTENCES)) add(K.trickySentence(id), capitalise(sentence) + ".", true);
  for (const c of CORRESPONDENCES) if (c.name) add(K.letterName(c.name), letterNameText(c.name));
  for (const id of Object.keys(PHRASES) as PhraseId[]) add(K.phrase(id), PHRASES[id]);
  for (const p of PHONEMES) add(K.tip(p.id), p.tip);
  for (const a of ANIMALS) {
    add(K.animal(a.id), a.sound);
    add(K.word(a.label), a.label);
  }
  for (const l of LEVELS) add(K.levelIntro(l.id), l.intro);
  for (const s of [...L5_SENTENCES, ...L7_SENTENCES]) add(K.sentence(s.id), s.text, true);
  for (const st of STORIES) {
    add(K.storyTitle(st.id), st.title);
    st.pages.forEach((p, pi) => p.sentences.forEach((s, si) => add(K.storySentence(st.id, pi, si), s, true)));
    st.questions.forEach((q) => {
      add(K.question(st.id, q.id), q.ask);
      q.options.forEach((o, i) => add(K.option(st.id, q.id, i), capitalise(o.text)));
    });
    st.vocab?.forEach((v) => add(K.vocab(st.id, v.word), `${v.word}: ${v.meaning}.`));
    st.sequence?.forEach((s, i) => add(K.seq(st.id, i), s.text));
  }
  return [...out.values()];
}

/**
 * "A." — a lone capital with a full stop makes the voices say the letter's name.
 * Exceptions are spelled out where a voice misreads the capital (the Indian
 * English voice reads "S." as two syllables).
 */
const LETTER_NAME_OVERRIDES: Record<string, string> = { S: "ess" };

function letterNameText(letter: string) {
  const l = letter.toUpperCase();
  return LETTER_NAME_OVERRIDES[l] ?? `${l}.`;
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let textIndex: Map<string, string> | null = null;
let textIndexAccent: Accent | null = null;

/** Text for a key: used for captions and for speech-synthesis fallback. */
export function audioText(key: string, accent: Accent = "in"): string {
  if (!textIndex || textIndexAccent !== accent) {
    textIndex = new Map(speechEntries(accent).map((e) => [e.key, e.text]));
    for (const p of phonemeEntries()) textIndex.set(p.key, p.fallback);
    textIndexAccent = accent;
  }
  return textIndex.get(key) ?? "";
}
