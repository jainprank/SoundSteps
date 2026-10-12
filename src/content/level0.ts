// Level 0 listening content: environmental sounds (synthesised in the browser,
// see src/lib/sfx.ts), animal sounds (spoken), and same/different sound pairs.

export type EnvSoundId = "drum" | "bell" | "whistle" | "clap" | "rain" | "clock" | "horn" | "phone";

export const ENV_SOUNDS: { id: EnvSoundId; label: string; emoji: string }[] = [
  { id: "drum", label: "drum", emoji: "🥁" },
  { id: "bell", label: "bell", emoji: "🔔" },
  { id: "whistle", label: "whistle", emoji: "📯" },
  { id: "clap", label: "clapping hands", emoji: "👏" },
  { id: "rain", label: "rain", emoji: "🌧️" },
  { id: "clock", label: "clock", emoji: "⏰" },
  { id: "horn", label: "car horn", emoji: "🚗" },
  { id: "phone", label: "phone", emoji: "📱" },
];

export const ANIMALS: { id: string; label: string; emoji: string; sound: string }[] = [
  { id: "cow", label: "cow", emoji: "🐄", sound: "Moooo!" },
  { id: "dog", label: "dog", emoji: "🐕", sound: "Woof woof!" },
  { id: "cat", label: "cat", emoji: "🐈", sound: "Meow!" },
  { id: "duck", label: "duck", emoji: "🦆", sound: "Quack quack!" },
  { id: "sheep", label: "sheep", emoji: "🐑", sound: "Baa baa!" },
  { id: "pig", label: "pig", emoji: "🐖", sound: "Oink oink!" },
  { id: "snake", label: "snake", emoji: "🐍", sound: "Hissss!" },
  { id: "bee", label: "bee", emoji: "🐝", sound: "Bzzzz!" },
  { id: "owl", label: "owl", emoji: "🦉", sound: "Hoo hoo!" },
  { id: "lion", label: "lion", emoji: "🦁", sound: "Roar!" },
];

/** Pairs of words for "tap the drum when they match". Same word = match. */
export const SAME_DIFFERENT_WORDS: [string, string][] = [
  ["cat", "cat"], ["cat", "hat"], ["sun", "sun"], ["pig", "big"], ["map", "map"], ["dog", "log"],
  ["fish", "fish"], ["bed", "red"], ["hen", "hen"], ["sock", "rock"],
];

/** Similar-sounding phoneme pairs for careful listening. */
export const SAME_DIFFERENT_SOUNDS: [string, string][] = [
  ["s", "s"], ["s", "sh"], ["f", "f"], ["f", "th"], ["m", "n"], ["b", "b"], ["b", "p"],
  ["d", "t"], ["e", "i"], ["v", "f"], ["sh", "sh"], ["ch", "sh"],
];

/** Picture words with clear first sounds for "same first sound" games (no letters needed). */
export const FIRST_SOUND_WORDS = [
  "sun", "sock", "six", "map", "man", "mug", "dog", "duck", "dad", "bat", "bus", "bed",
  "cat", "cup", "kite", "fan", "fox", "fish", "pig", "pan", "pen", "hat", "hen", "hut",
  "net", "nut", "ring", "rat", "red", "leg", "lamp", "log", "tap", "ten", "tent", "jam", "jet", "van", "web", "wig", "zip",
];
