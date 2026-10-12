import type { Step } from "@/content/curriculum";
import { CORR_BY_ID } from "@/content/correspondences";
import { NAMEABLE, firstPhoneme } from "@/content/pictures";
import { L5_SENTENCES, L7_SENTENCES } from "@/content/reading";
import { unreadableWords } from "@/content/validate";
import { WORDS, isDecodable, phonemesOf } from "@/content/words";
import { pick, sample, shuffle } from "./adaptive";

// Free-play games and the daily challenge are built from what the child has
// already been taught, so a game never asks for a sound that hasn't been met.

export interface GameDef {
  id: string;
  title: string;
  emoji: string;
  blurb: string;
  /** shown when there isn't enough taught content yet */
  needs: string;
  build: (taught: string[], tricky: string[]) => Step | null;
}

const readablePictures = (taught: string[]) => {
  const set = new Set(taught);
  return NAMEABLE.filter((w) => isDecodable(w, set));
};

const singleSoundCorrs = (taught: string[]) => {
  // one spelling per sound so answers are never ambiguous (c vs k)
  const byPhoneme = new Map<string, string>();
  for (const c of taught) if (CORR_BY_ID[c] && !byPhoneme.has(CORR_BY_ID[c].phoneme)) byPhoneme.set(CORR_BY_ID[c].phoneme, c);
  return [...byPhoneme.values()];
};

const RIMES = ["at", "an", "ap", "ig", "in", "it", "op", "ot", "ug", "un", "en", "et", "ell", "ock", "ish"];

export const GAMES: GameDef[] = [
  {
    id: "monster", title: "Feed the Monster", emoji: "👾", blurb: "Feed the hungry monster the sound it asks for.", needs: "Learn your first sounds",
    build: (taught) => {
      const corrs = singleSoundCorrs(taught);
      return corrs.length >= 3 ? { type: "hearSound", targets: sample(corrs, 6), pool: corrs, rounds: 6, variant: "monster" } : null;
    },
  },
  {
    id: "bubbles", title: "Pop the Sound", emoji: "🫧", blurb: "Pop the bubble that makes the sound.", needs: "Learn your first sounds",
    build: (taught) => {
      const corrs = singleSoundCorrs(taught);
      return corrs.length >= 4 ? { type: "hearSound", targets: sample(corrs, 6), pool: corrs, rounds: 6, variant: "bubbles" } : null;
    },
  },
  {
    id: "safari", title: "Sound Safari", emoji: "🦁", blurb: "Find everything in the scene with a sound.", needs: "Learn your first sounds",
    build: (taught) => {
      const options = singleSoundCorrs(taught).filter((c) => NAMEABLE.filter((w) => phonemesOf(w).includes(CORR_BY_ID[c].phoneme)).length >= 3);
      if (!options.length) return null;
      const corr = pick(options);
      const ph = CORR_BY_ID[corr].phoneme;
      const yes = sample(NAMEABLE.filter((w) => phonemesOf(w).includes(ph)), 4);
      const seen = new Set(yes.map((w) => w.emoji));
      const no = shuffle(NAMEABLE.filter((w) => !phonemesOf(w).includes(ph))).filter((w) => !seen.has(w.emoji) && seen.add(w.emoji)).slice(0, 6);
      return { type: "soundSafari", corr, words: shuffle([...yes, ...no]).map((w) => w.id) };
    },
  },
  {
    id: "blend", title: "Blend It!", emoji: "🔗", blurb: "Blend the sounds and find the picture.", needs: "Finish the first letter group",
    build: (taught) => {
      const words = readablePictures(taught);
      return words.length >= 4 ? { type: "blend", words: sample(words, 6).map((w) => w.id), demo: false, check: "picture" } : null;
    },
  },
  {
    id: "build", title: "Build a Word", emoji: "🧱", blurb: "Drag letters into the boxes to spell the picture.", needs: "Finish the first letter group",
    build: (taught) => {
      const words = readablePictures(taught).filter((w) => w.tokens.length <= 4 && !w.tokens.some((t) => t.c === "_"));
      return words.length >= 4 ? { type: "buildWord", words: sample(words, 5).map((w) => w.id), prompt: "picture" } : null;
    },
  },
  {
    id: "families", title: "Word Families", emoji: "👨‍👩‍👧", blurb: "Change the first sound to make new words.", needs: "Learn a few more letters",
    build: (taught) => {
      const set = new Set(taught);
      const families = RIMES.map((rime) => ({
        rime,
        words: WORDS.filter((w) => w.text.endsWith(rime) && w.text.length === rime.length + 1 && w.text === w.text.toLowerCase() && isDecodable(w, set)).map((w) => w.id),
      })).filter((f) => f.words.length >= 3);
      if (!families.length) return null;
      const f = pick(families);
      return { type: "wordFamily", rime: f.rime, words: f.words.slice(0, 6) };
    },
  },
  {
    id: "train", title: "Reading Train", emoji: "🚂", blurb: "Put the word carriages in order.", needs: "Reach the reading levels",
    build: (taught, tricky) => {
      const set = new Set(taught);
      const t = new Set(tricky.map((x) => x.toLowerCase()));
      const ok = [...L5_SENTENCES, ...L7_SENTENCES].filter((s) => !unreadableWords(s.text, set, t).length);
      return ok.length >= 2 ? { type: "readingTrain", sentences: sample(ok, 3).map((s) => s.id) } : null;
    },
  },
  {
    id: "tricky", title: "Tricky Word Bubbles", emoji: "💡", blurb: "Pop the tricky word you hear.", needs: "Reach the tricky words level",
    build: (_taught, tricky) => (tricky.length >= 4 ? { type: "feedWords", words: sample(tricky, 6), pool: tricky, variant: "bubbles" } : null),
  },
  {
    id: "treasure", title: "Treasure Hunt", emoji: "🗺️", blurb: "Solve sound clues to find the treasure.", needs: "Learn your first sounds",
    build: (taught) => {
      const corrs = singleSoundCorrs(taught);
      if (corrs.length < 3) return null;
      const startCorrs = corrs.filter((c) => NAMEABLE.filter((w) => firstPhoneme(w) === CORR_BY_ID[c].phoneme).length >= 2);
      const clues: Step[] = [
        { type: "hearSound", targets: sample(corrs, 2), pool: corrs, rounds: 2 },
      ];
      if (startCorrs.length) clues.push({ type: "firstSound", targets: sample(startCorrs, 2), pool: corrs, rounds: 2, position: "first" });
      const words = readablePictures(taught);
      if (words.length >= 3) clues.push({ type: "blend", words: sample(words, 2).map((w) => w.id), demo: false, check: "picture" });
      clues.push({ type: "hearSound", targets: sample(corrs, 2), pool: corrs, rounds: 2, variant: "bubbles" });
      return { type: "treasureHunt", clues };
    },
  },
];

export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));

/** A short, gentle review of things already learned. No streaks, no penalties. */
export function dailyChallenge(taught: string[], tricky: string[], recent: string[]): Step[] {
  const corrs = singleSoundCorrs(taught);
  const review = [...new Set([...recent.filter((c) => corrs.includes(c)), ...shuffle(corrs)])].slice(0, 4);
  const steps: Step[] = [{ type: "hearSound", targets: review, pool: corrs, rounds: 3 }];
  const words = readablePictures(taught);
  if (words.length >= 3) steps.push({ type: "blend", words: sample(words, 2).map((w) => w.id), demo: false, check: "picture" });
  else steps.push({ type: "firstSoundMatch", rounds: 2 });
  if (tricky.length >= 4) steps.push({ type: "listenSelect", words: sample(tricky, 2), pool: tricky });
  else steps.push({ type: "hearSound", targets: sample(corrs, 2), pool: corrs, rounds: 2, variant: "bubbles" });
  return steps;
}
