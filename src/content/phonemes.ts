import type { Phoneme } from "./types";

// Every speech sound taught in SoundSteps. `carve` tells scripts/audio/generate.ts
// how to cut the isolated sound out of a carrier word, so consonants stay crisp
// ("t", not "tuh"). Recorded files can replace any clip — see README "Audio".

const P = (p: Phoneme) => p;

export const PHONEMES: Phoneme[] = [
  // Group 1
  P({ id: "s", ipa: "s", say: "sss", kind: "consonant", continuous: true, mouth: "tongue-ridge", tip: "Smile a little and let the air hiss out, like a snake.", fallback: "s, as in sun", carve: { kind: "fricativeStart", word: "sun", stretchTo: 0.55 } }),
  P({ id: "a", ipa: "æ", say: "a", kind: "vowel", continuous: true, mouth: "open", tip: "Open your mouth wide, like you are at the dentist.", fallback: "a, as in apple", carve: { kind: "vowelStart", word: "at", stretchTo: 0.3 } }),
  P({ id: "t", ipa: "t", say: "t", kind: "consonant", continuous: false, mouth: "tongue-ridge", tip: "Tap your tongue behind your top teeth. Keep it short: t, t, t.", fallback: "t, as in tap", carve: { kind: "stopStart", word: "tap" } }),
  P({ id: "p", ipa: "p", say: "p", kind: "consonant", continuous: false, mouth: "lips-closed", tip: "Press your lips together and pop a puff of air.", fallback: "p, as in pan", carve: { kind: "stopStart", word: "pan" } }),
  P({ id: "i", ipa: "ɪ", say: "i", kind: "vowel", continuous: true, mouth: "smile", tip: "A small smile. Short and quick, like a little squeak.", fallback: "i, as in insect", carve: { kind: "vowelStart", word: "it", stretchTo: 0.3 } }),
  P({ id: "n", ipa: "n", say: "nnn", kind: "consonant", continuous: true, mouth: "tongue-ridge", tip: "Tongue up behind your teeth and hum through your nose.", fallback: "n, as in net", carve: { kind: "voicedStart", word: "nap", stretchTo: 0.5 } }),
  // Group 2
  P({ id: "m", ipa: "m", say: "mmm", kind: "consonant", continuous: true, mouth: "lips-closed", tip: "Close your lips and hum, like something tastes yummy.", fallback: "m, as in map", carve: { kind: "voicedStart", word: "map", stretchTo: 0.5 } }),
  P({ id: "d", ipa: "d", say: "d", kind: "consonant", continuous: false, mouth: "tongue-ridge", tip: "Tap your tongue behind your teeth and switch your voice on.", fallback: "d, as in dog", carve: { kind: "voicedStopStart", word: "dog", ms: 55 } }),
  P({ id: "g", ipa: "ɡ", say: "g", kind: "consonant", continuous: false, mouth: "back", tip: "Lift the back of your tongue, then let go with your voice on.", fallback: "g, as in gap", carve: { kind: "voicedStopStart", word: "gap", ms: 55 } }),
  P({ id: "o", ipa: "ɒ", say: "o", kind: "vowel", continuous: true, mouth: "open", tip: "Make a round, open mouth. Short: o, o, o.", fallback: "o, as in octopus", carve: { kind: "vowelStart", word: "ox", stretchTo: 0.3 } }),
  P({ id: "k", ipa: "k", say: "k", kind: "consonant", continuous: false, mouth: "back", tip: "Lift the back of your tongue and let a little puff go.", fallback: "k, as in kit", carve: { kind: "stopStart", word: "kit" } }),
  // Group 3
  P({ id: "e", ipa: "e", say: "e", kind: "vowel", continuous: true, mouth: "smile", tip: "Open your mouth a little and smile. Short: e, e, e.", fallback: "e, as in egg", carve: { kind: "vowelStart", word: "egg", stretchTo: 0.3 } }),
  P({ id: "u", ipa: "ʌ", say: "u", kind: "vowel", continuous: true, mouth: "open", tip: "Relax your mouth, open it a little: u, like in up.", fallback: "u, as in up", carve: { kind: "vowelStart", word: "up", stretchTo: 0.3 } }),
  P({ id: "r", ipa: "r", say: "rrr", kind: "consonant", continuous: true, mouth: "pout", tip: "Push your lips forward and growl softly, like a puppy.", fallback: "r, as in rat", carve: { kind: "voicedStart", word: "rat", stretchTo: 0.5 } }),
  P({ id: "h", ipa: "h", say: "h", kind: "consonant", continuous: false, mouth: "breath", tip: "Breathe out, like you are fogging up a window.", fallback: "h, as in hat", carve: { kind: "fricativeStart", word: "hat", stretchTo: 0.25 } }),
  P({ id: "b", ipa: "b", say: "b", kind: "consonant", continuous: false, mouth: "lips-closed", tip: "Lips together, then bounce them open with your voice on.", fallback: "b, as in bat", carve: { kind: "voicedStopStart", word: "bat", ms: 55 } }),
  // Group 4
  P({ id: "f", ipa: "f", say: "fff", kind: "consonant", continuous: true, mouth: "lip-teeth", tip: "Bite your bottom lip gently and blow.", fallback: "f, as in fan", carve: { kind: "fricativeStart", word: "fan", stretchTo: 0.55 } }),
  P({ id: "l", ipa: "l", say: "lll", kind: "consonant", continuous: true, mouth: "tongue-ridge", tip: "Tongue tip up behind your teeth and sing.", fallback: "l, as in leg", carve: { kind: "voicedStart", word: "lap", stretchTo: 0.5 } }),
  // Group 5
  P({ id: "j", ipa: "dʒ", say: "j", kind: "consonant", continuous: false, mouth: "pout", tip: "Push your lips out a little and make a short, buzzy j.", fallback: "j, as in jam", carve: { kind: "voicedStopStart", word: "jam", ms: 110 } }),
  P({ id: "v", ipa: "v", say: "vvv", kind: "consonant", continuous: true, mouth: "lip-teeth", tip: "Bite your bottom lip gently and buzz.", fallback: "v, as in van", carve: { kind: "voicedStart", word: "van", stretchTo: 0.5 } }),
  P({ id: "w", ipa: "w", say: "w", kind: "consonant", continuous: false, mouth: "round", tip: "Make a tiny round mouth, then open it.", fallback: "w, as in wet", carve: { kind: "voicedStopStart", word: "wet", ms: 110 } }),
  P({ id: "ks", ipa: "ks", say: "ks", kind: "consonant", continuous: false, mouth: "back", tip: "The letter x makes two sounds together: k and s.", fallback: "ks, as in box", carve: { kind: "concat", parts: ["k", "s"] } }),
  // Group 6
  P({ id: "y", ipa: "j", say: "y", kind: "consonant", continuous: false, mouth: "smile", tip: "Smile and slide into the next sound.", fallback: "y, as in yes", carve: { kind: "voicedStopStart", word: "yes", ms: 100 } }),
  P({ id: "z", ipa: "z", say: "zzz", kind: "consonant", continuous: true, mouth: "tongue-ridge", tip: "Make a snake sound, then switch your voice on to buzz like a bee.", fallback: "z, as in zip", carve: { kind: "voicedStart", word: "zap", stretchTo: 0.5 } }),
  P({ id: "kw", ipa: "kw", say: "kw", kind: "consonant", continuous: false, mouth: "round", tip: "q and u work together to make two sounds: k and w.", fallback: "kw, as in quick", carve: { kind: "concat", parts: ["k", "w"] } }),
  // Digraphs
  P({ id: "sh", ipa: "ʃ", say: "shh", kind: "consonant", continuous: true, mouth: "pout", tip: "Push your lips forward and say shh, like a sleeping baby.", fallback: "sh, as in ship", carve: { kind: "fricativeStart", word: "ship", stretchTo: 0.55 } }),
  P({ id: "ch", ipa: "tʃ", say: "ch", kind: "consonant", continuous: false, mouth: "pout", tip: "Lips forward, then a quick sneeze sound: ch!", fallback: "ch, as in chip", carve: { kind: "fricativeStart", word: "chip" } }),
  P({ id: "th", ipa: "θ", say: "th", kind: "consonant", continuous: true, mouth: "tongue-teeth", tip: "Poke your tongue out a tiny bit and blow, no voice.", fallback: "th, as in thin", carve: { kind: "fricativeStart", word: "thin", stretchTo: 0.5 } }),
  P({ id: "dh", ipa: "ð", say: "th", kind: "consonant", continuous: true, mouth: "tongue-teeth", tip: "Poke your tongue out a tiny bit and buzz with your voice on.", fallback: "th, as in this", carve: { kind: "voicedStart", word: "that", stretchTo: 0.45 } }),
  P({ id: "ng", ipa: "ŋ", say: "ng", kind: "consonant", continuous: true, mouth: "back", tip: "Lift the back of your tongue and hum through your nose.", fallback: "ng, as in ring", carve: { kind: "voicedEnd", word: "sing", stretchTo: 0.5 } }),
  // Vowel teams and r-controlled vowels
  P({ id: "ai", ipa: "eɪ", say: "ai", kind: "vowel", continuous: true, mouth: "smile", tip: "Open, then slide into a smile: ai.", fallback: "ai, as in rain", carve: { kind: "vowelStart", word: "ate", stretchTo: 0.4 } }),
  P({ id: "ee", ipa: "iː", say: "ee", kind: "vowel", continuous: true, mouth: "smile", tip: "Big wide smile and hold it: eee.", fallback: "ee, as in bee", carve: { kind: "vowelStart", word: "eat", stretchTo: 0.45 } }),
  P({ id: "igh", ipa: "aɪ", say: "igh", kind: "vowel", continuous: true, mouth: "open", tip: "Open wide, then slide into a smile: igh.", fallback: "igh, as in night", carve: { kind: "vowelStart", word: "ice", stretchTo: 0.4 } }),
  P({ id: "oa", ipa: "əʊ", say: "oa", kind: "vowel", continuous: true, mouth: "round", tip: "Start open and finish with round lips: oa.", fallback: "oa, as in boat", carve: { kind: "vowelStart", word: "oat", stretchTo: 0.4 } }),
  P({ id: "oo", ipa: "uː", say: "oo", kind: "vowel", continuous: true, mouth: "round", tip: "Tiny round lips, like blowing out a candle: ooo.", fallback: "oo, as in moon", carve: { kind: "vowelStart", word: "oops", stretchTo: 0.45 } }),
  P({ id: "uu", ipa: "ʊ", say: "oo", kind: "vowel", continuous: false, mouth: "round", tip: "A short, soft oo, like in book.", fallback: "oo, as in book", carve: { kind: "vowelAfterStop", word: "put", stretchTo: 0.28 } }),
  P({ id: "ar", ipa: "ɑː", say: "ar", kind: "vowel", continuous: true, mouth: "open", tip: "Open wide like the doctor says: aah.", fallback: "ar, as in car", carve: { kind: "vowelStart", word: "art", stretchTo: 0.45 } }),
  P({ id: "or", ipa: "ɔː", say: "or", kind: "vowel", continuous: true, mouth: "round", tip: "Make round lips and say or.", fallback: "or, as in fork", carve: { kind: "whole", word: "or" } }),
  P({ id: "er", ipa: "ɜː", say: "er", kind: "vowel", continuous: true, mouth: "smile", tip: "Relax your lips and say er, like when you are thinking.", fallback: "er, as in her", carve: { kind: "vowelStart", word: "earth", stretchTo: 0.45 } }),
  P({ id: "ow", ipa: "aʊ", say: "ow", kind: "vowel", continuous: true, mouth: "open", tip: "Open wide, then close to round lips, like you bumped your toe: ow!", fallback: "ow, as in cow", carve: { kind: "vowelStart", word: "out", stretchTo: 0.4 } }),
  P({ id: "oi", ipa: "ɔɪ", say: "oi", kind: "vowel", continuous: true, mouth: "round", tip: "Round lips, then slide into a smile: oi.", fallback: "oi, as in coin", carve: { kind: "vowelStart", word: "oyster", stretchTo: 0.4 } }),
  P({ id: "ue", ipa: "juː", say: "ue", kind: "vowel", continuous: true, mouth: "round", tip: "Say the name of the letter u: you.", fallback: "u, as in cube", carve: { kind: "vowelStart", word: "use", stretchTo: 0.4 } }),
];

export const PHONEME_BY_ID: Record<string, Phoneme> = Object.fromEntries(PHONEMES.map((p) => [p.id, p]));
