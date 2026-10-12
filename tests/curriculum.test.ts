import { describe, expect, it } from "vitest";
import manifest from "../src/content/audio-manifest.json";
import { ALL_LESSONS, LEVELS, type Lesson, type Step } from "../src/content/curriculum";
import { phonemeEntries, speechEntries, K } from "../src/content/audioKeys";
import { CORR_BY_ID } from "../src/content/correspondences";
import { NAMEABLE, firstPhoneme, lastPhoneme } from "../src/content/nameable";
import { L5_SENTENCES, L7_SENTENCES } from "../src/content/reading";
import { contentProblems, unreadableWords } from "../src/content/validate";
import { NONSENSE, WORD_BY_ID, isDecodable } from "../src/content/words";
import { TRICKY_BY_ID } from "../src/content/tricky";
import { ANIMALS, FIRST_SOUND_WORDS, SAME_DIFFERENT_WORDS } from "../src/content/level0";
import { PHONEMES } from "../src/content/phonemes";

const ALL_SENTENCES = [...L5_SENTENCES, ...L7_SENTENCES];

/** Words a step asks the child to READ (must be decodable or taught tricky words). */
function readingWords(step: Step): string[] {
  switch (step.type) {
    case "blend": return step.words;
    case "buildWord": return step.words;
    case "missingSound": return step.words;
    case "wordChain": return step.chain;
    case "wordFamily": return step.words;
    case "spotGrapheme": return step.words;
    case "feedWords": return [...step.words, ...step.pool];
    case "realOrSilly": return step.real;
    case "magicE": return step.pairs.flat();
    case "suffix": return step.items.flatMap((i) => [i.base, i.result]);
    case "soundSort": return step.words;
    case "listenSelect": return [...step.words, ...step.pool];
    case "missingWord": return step.items.flatMap((i) => i.options);
    default: return [];
  }
}

/** Words a step shows as PICTURES. */
function pictureWords(step: Step): string[] {
  switch (step.type) {
    case "blend": return step.check === "picture" ? step.words : [];
    case "buildWord": return step.prompt === "picture" ? step.words : [];
    case "missingSound": case "countSounds": case "syllables": return step.words;
    case "soundSafari": return step.words;
    default: return [];
  }
}

function sentencesOf(step: Step): string[] {
  if (step.type === "sentencePicture" || step.type === "readingTrain") return step.sentences.map((id) => ALL_SENTENCES.find((s) => s.id === id)!.text);
  if (step.type === "missingWord") return step.items.map((i) => i.sentence);
  return [];
}

function allSteps(lesson: Lesson): Step[] {
  return lesson.steps.flatMap((s) => (s.type === "treasureHunt" ? s.clues : [s]));
}

describe("content", () => {
  it("has no data problems (decodable sentences, valid spellings, examples exist)", () => {
    expect(contentProblems()).toEqual([]);
  });

  it("has unique lesson ids and a mastery check for every level", () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const level of LEVELS) expect(level.mastery.kind).toBe("mastery");
    expect(LEVELS.map((l) => l.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("every lesson is fair", () => {
  for (const lesson of ALL_LESSONS) {
    it(`${lesson.id}: only uses what has been taught`, () => {
      const taught = new Set(lesson.taught);
      const tricky = new Set(lesson.trickyTaught.map((t) => t.toLowerCase()));
      for (const step of allSteps(lesson)) {
        for (const id of readingWords(step)) {
          const w = WORD_BY_ID[id.toLowerCase()];
          const ok = (w && isDecodable(w, taught)) || tricky.has(id.toLowerCase());
          expect(ok, `${step.type}: "${id}" is not readable yet in ${lesson.id}`).toBe(true);
        }
        for (const text of sentencesOf(step)) {
          expect(unreadableWords(text, taught, tricky), `${step.type}: "${text}"`).toEqual([]);
        }
        if (step.type === "hearSound") {
          for (const c of [...step.targets, ...step.pool]) expect(taught.has(c), `${step.type}: ${c} not taught`).toBe(true);
          for (const t of step.targets) expect(step.pool).toContain(t);
          expect(step.pool.length).toBeGreaterThanOrEqual(2);
        }
        if (step.type === "teach") expect(CORR_BY_ID[step.corr]).toBeTruthy();
        if (step.type === "teachTricky") expect(TRICKY_BY_ID[step.word.toLowerCase()]).toBeTruthy();
      }
    });

    it(`${lesson.id}: no step is empty`, () => {
      expect(lesson.steps.length).toBeGreaterThan(0);
      for (const step of allSteps(lesson)) {
        const lists = Object.entries(step).filter(([, v]) => Array.isArray(v)) as [string, unknown[]][];
        for (const [k, v] of lists) expect(v.length, `${step.type}.${k} is empty in ${lesson.id}`).toBeGreaterThan(0);
        if ("rounds" in step) expect(step.rounds).toBeGreaterThan(0);
      }
    });

    it(`${lesson.id}: every picture exists`, () => {
      for (const step of allSteps(lesson)) {
        for (const id of pictureWords(step)) {
          expect(WORD_BY_ID[id]?.emoji, `${step.type}: "${id}" has no picture`).toBeTruthy();
        }
        if (step.type === "firstSound" || step.type === "yesNo") {
          const at = step.position === "first" ? firstPhoneme : lastPhoneme;
          const targets = step.type === "firstSound" ? step.targets : [step.target];
          for (const t of targets) {
            const ph = CORR_BY_ID[t].phoneme;
            expect(NAMEABLE.filter((w) => at(w) === ph).length, `no clear pictures for /${ph}/ (${step.position}) in ${lesson.id}`).toBeGreaterThanOrEqual(2);
          }
        }
      }
    });
  }

  it("alien words are decodable but not real words", () => {
    for (const n of NONSENSE) expect(WORD_BY_ID[n.id]).toBeUndefined();
  });
});

describe("audio", () => {
  const clips = (manifest as { clips: Record<string, Record<string, unknown>> }).clips;
  for (const accent of ["in", "gb", "us"] as const) {
    it(`has every clip for ${accent}`, () => {
      const missing = [...phonemeEntries().map((p) => p.key), ...speechEntries(accent).map((e) => e.key)].filter((k) => !clips[accent]?.[k]);
      expect(missing, "run `npm run audio` to generate missing clips").toEqual([]);
    });
  }

  it("has a clip for every word the listening games and sound check say", () => {
    const keys = new Set(speechEntries("in").map((e) => e.key));
    const words = [
      ...ANIMALS.map((a) => a.label),
      ...FIRST_SOUND_WORDS,
      ...SAME_DIFFERENT_WORDS.flat(),
      ...PHONEMES.map((p) => p.fallback.split(" as in ")[1]),
    ];
    expect(words.filter((w) => !keys.has(K.word(w)))).toEqual([]);
  });

  it("has a word clip for every word a lesson can say", () => {
    const keys = new Set(speechEntries("in").map((e) => e.key));
    for (const lesson of ALL_LESSONS)
      for (const step of allSteps(lesson))
        for (const id of [...readingWords(step), ...pictureWords(step)]) expect(keys.has(K.word(id)), `w/${id}`).toBe(true);
  });
});
