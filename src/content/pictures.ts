import { L5_SENTENCES, L7_SENTENCES } from "./reading";
import { TRICKY_SENTENCES } from "./tricky";
import { K } from "./audioKeys";
export { NAMEABLE, firstPhoneme, lastPhoneme } from "./nameable";

/** Find the audio key for a sentence written anywhere in the content. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, "").trim();
const SENTENCE_KEYS = new Map<string, string>([
  ...L5_SENTENCES.map((s) => [norm(s.text), K.sentence(s.id)] as [string, string]),
  ...L7_SENTENCES.map((s) => [norm(s.text), K.sentence(s.id)] as [string, string]),
  ...Object.entries(TRICKY_SENTENCES).map(([id, s]) => [norm(s.sentence), K.trickySentence(id)] as [string, string]),
]);

export function sentenceKey(text: string): string | undefined {
  return SENTENCE_KEYS.get(norm(text));
}
