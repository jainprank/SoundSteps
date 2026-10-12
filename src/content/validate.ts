import { CORR_BY_ID, CORRESPONDENCES, GROUPS, taughtThrough } from "./correspondences";
import { PHONEME_BY_ID, PHONEMES } from "./phonemes";
import { L5_SENTENCES, L7_SENTENCES, STORIES, splitWords } from "./reading";
import { TRICKY, TRICKY_BY_ID, TRICKY_SENTENCES, TRICKY_SETS } from "./tricky";
import { WORDS, WORD_BY_ID, isDecodable } from "./words";

/** Tricky words taught up to and including a set. */
export function trickyThrough(setId: string | null): Set<string> {
  const out = new Set<string>();
  if (!setId) return out;
  for (const s of TRICKY_SETS) {
    TRICKY.filter((t) => t.set === s.id).forEach((t) => out.add(t.id.toLowerCase()));
    if (s.id === setId) return out;
  }
  throw new Error(`Unknown tricky set ${setId}`);
}

/** Can a child read this word with what has been taught? */
export function canRead(bare: string, taught: Set<string>, tricky: Set<string>): boolean {
  const key = bare.toLowerCase();
  if (tricky.has(key) || (bare === "I" && tricky.has("i"))) return true;
  const wd = WORD_BY_ID[key];
  return !!wd && isDecodable(wd, taught);
}

export function unreadableWords(text: string, taught: Set<string>, tricky: Set<string>): string[] {
  return splitWords(text)
    .map((w) => w.bare)
    .filter((bare) => bare && !canRead(bare, taught, tricky));
}

/** Everything wrong with the content, as readable messages. Empty = all good. */
export function contentProblems(): string[] {
  const problems: string[] = [];
  const allTaught = taughtThrough(GROUPS[GROUPS.length - 1].id);
  const allTricky = trickyThrough(TRICKY_SETS[TRICKY_SETS.length - 1].id);

  for (const p of PHONEMES) {
    if (p.carve.kind === "concat") p.carve.parts.forEach((x) => !PHONEME_BY_ID[x] && problems.push(`phoneme ${p.id}: unknown part ${x}`));
  }
  for (const c of CORRESPONDENCES) {
    if (!PHONEME_BY_ID[c.phoneme]) problems.push(`correspondence ${c.id}: unknown phoneme ${c.phoneme}`);
    c.examples.forEach((e) => !WORD_BY_ID[e] && problems.push(`correspondence ${c.id}: example "${e}" missing from word bank`));
  }
  for (const g of GROUPS) g.corrs.forEach((c) => !CORR_BY_ID[c] && problems.push(`group ${g.id}: unknown correspondence ${c}`));
  for (const w of WORDS) {
    w.tokens.forEach((t) => {
      if (t.c !== "_" && t.c !== "*" && !CORR_BY_ID[t.c]) problems.push(`word ${w.text}: unknown correspondence ${t.c}`);
      if (t.c !== "_" && t.c !== "*" && CORR_BY_ID[t.c] && !CORR_BY_ID[t.c].grapheme.replace("-", "").startsWith(t.g.toLowerCase()) && CORR_BY_ID[t.c].grapheme !== t.g.toLowerCase())
        problems.push(`word ${w.text}: "${t.g}" does not match correspondence ${t.c}`);
    });
  }
  for (const t of TRICKY) {
    if (t.parts.map((p) => p.g).join("") !== t.text) problems.push(`tricky ${t.id}: parts do not spell the word`);
  }

  const l5Taught = allTaught;
  for (const s of L5_SENTENCES) {
    const bad = unreadableWords(s.text, l5Taught, new Set());
    if (bad.length) problems.push(`L5 sentence "${s.text}": not decodable yet: ${bad.join(", ")}`);
  }
  for (const s of L7_SENTENCES) {
    const bad = unreadableWords(s.text, allTaught, allTricky);
    if (bad.length) problems.push(`L7 sentence "${s.text}": not readable: ${bad.join(", ")}`);
  }
  for (const story of STORIES) {
    for (const page of story.pages)
      for (const s of page.sentences) {
        const bad = unreadableWords(s, allTaught, allTricky);
        if (bad.length) problems.push(`story ${story.id} "${s}": not readable: ${bad.join(", ")}`);
      }
    story.vocab?.forEach((v) => {
      const inText = story.pages.some((p) => p.sentences.some((s) => s.toLowerCase().includes(v.word)));
      if (!inText) problems.push(`story ${story.id}: vocab "${v.word}" is not in the text`);
    });
  }
  for (const [id, { sentence }] of Object.entries(TRICKY_SENTENCES)) {
    const t = TRICKY_BY_ID[id.toLowerCase()];
    if (!t) { problems.push(`tricky sentence for unknown word ${id}`); continue; }
    const bad = unreadableWords(sentence, allTaught, trickyThrough(t.set));
    if (bad.length) problems.push(`tricky sentence for "${id}" "${sentence}": not readable yet: ${bad.join(", ")}`);
  }
  return problems;
}
