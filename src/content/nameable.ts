import { WORDS, phonemesOf } from "./words";
import type { Word } from "./types";

// Which pictures are clear enough to name without help. For "which picture starts
// with /s/?" a child has to name the picture themselves, so ambiguous pictures
// (a tin or a can? a bed or a cot?) are left out of those games.

const NOT_NAMEABLE = new Set([
  "sat", "pat", "tap", "mat", "sit", "dot", "top", "mad", "tag", "din", "mug", "pet", "vat", "off", "jog", "run", "win",
  "wind", "fix", "yum", "zap", "fizz", "quick", "high", "down", "hurt", "pop", "tin", "can", "cot", "kit", "kid", "sip",
  "nap", "spin", "snap", "pond", "camp", "insect", "mint", "cod", "map", "sad", "bun", "pup", "mud", "step", "wait",
  "smell", "jeep", "storm", "herb", "fern", "soil", "town", "surf", "room", "park", "cart", "tomato", "dress", "magnet",
  "grin", "dark", "morning", "branch", "oak", "stick", "snack", "light", "quack", "quiz", "zoo", "wet", "wish",
  "jam", "jet", "neck", "kick", "yak", "yes", "zip", "cube", "tube", "note", "hope", "pine", "cape", "mane",
]);

export const NAMEABLE: Word[] = WORDS.filter((w) => w.emoji && w.text === w.text.toLowerCase() && !NOT_NAMEABLE.has(w.id));

export function firstPhoneme(w: Word) {
  return phonemesOf(w)[0];
}

export function lastPhoneme(w: Word) {
  const p = phonemesOf(w);
  return p[p.length - 1];
}

