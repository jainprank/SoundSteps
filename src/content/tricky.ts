import type { TrickyWord } from "./types";

// High-frequency words with an unusual spelling–sound bit. We never ask children to
// memorise these as shapes: the decodable parts are shown normally and only the
// "tricky bit" is highlighted and explained.

const T = (t: TrickyWord) => t;

export const TRICKY_SETS = [
  { id: "t1", title: "the to I no go into" },
  { id: "t2", title: "he she we me be is" },
  { id: "t3", title: "was you they all are my of" },
  { id: "t4", title: "said have like so do some" },
  { id: "t5", title: "come were there little one what" },
];

export const TRICKY: TrickyWord[] = [
  T({ id: "the", text: "the", set: "t1", parts: [{ g: "th", c: "dh" }, { g: "e", says: "uh" }], explain: "In the, the letters t h make their buzzy sound, and the e just says uh." }),
  T({ id: "to", text: "to", set: "t1", parts: [{ g: "t", c: "t" }, { g: "o", says: "oo" }], explain: "In to, the o says oo, like in moon." }),
  T({ id: "I", text: "I", set: "t1", parts: [{ g: "I", says: "igh" }], explain: "I is a word all by itself. It says its name, and it is always a capital letter." }),
  T({ id: "no", text: "no", set: "t1", parts: [{ g: "n", c: "n" }, { g: "o", says: "oa" }], explain: "In no, the o says its name, oh, like in boat." }),
  T({ id: "go", text: "go", set: "t1", parts: [{ g: "g", c: "g" }, { g: "o", says: "oa" }], explain: "In go, the o says its name, oh, like in boat." }),
  T({ id: "into", text: "into", set: "t1", parts: [{ g: "i", c: "i" }, { g: "n", c: "n" }, { g: "t", c: "t" }, { g: "o", says: "oo" }], explain: "into is in and to stuck together. The o says oo." }),
  T({ id: "he", text: "he", set: "t2", parts: [{ g: "h", c: "h" }, { g: "e", says: "ee" }], explain: "In he, the e says its name, ee, like in bee." }),
  T({ id: "she", text: "she", set: "t2", parts: [{ g: "sh", c: "sh" }, { g: "e", says: "ee" }], explain: "In she, the e says its name, ee, like in bee." }),
  T({ id: "we", text: "we", set: "t2", parts: [{ g: "w", c: "w" }, { g: "e", says: "ee" }], explain: "In we, the e says its name, ee, like in bee." }),
  T({ id: "me", text: "me", set: "t2", parts: [{ g: "m", c: "m" }, { g: "e", says: "ee" }], explain: "In me, the e says its name, ee, like in bee." }),
  T({ id: "be", text: "be", set: "t2", parts: [{ g: "b", c: "b" }, { g: "e", says: "ee" }], explain: "In be, the e says its name, ee, like in bee." }),
  T({ id: "is", text: "is", set: "t2", parts: [{ g: "i", c: "i" }, { g: "s", says: "z" }], explain: "In is, the s buzzes like a z." }),
  T({ id: "was", text: "was", set: "t3", parts: [{ g: "w", c: "w" }, { g: "a", says: "o" }, { g: "s", says: "z" }], explain: "In was, the a says o, like in dog, and the s buzzes like a z." }),
  T({ id: "you", text: "you", set: "t3", parts: [{ g: "y", c: "y" }, { g: "ou", says: "oo" }], explain: "In you, the letters o u say oo, like in moon." }),
  T({ id: "they", text: "they", set: "t3", parts: [{ g: "th", c: "dh" }, { g: "ey", says: "ai" }], explain: "In they, the letters e y say ai, like in rain." }),
  T({ id: "all", text: "all", set: "t3", parts: [{ g: "a", says: "or" }, { g: "ll", c: "ll" }], explain: "In all, the a says or, like in fork." }),
  T({ id: "are", text: "are", set: "t3", parts: [{ g: "ar", c: "ar" }, { g: "e", says: "silent" }], explain: "In are, a r says ar like in car, and the e is silent." }),
  T({ id: "my", text: "my", set: "t3", parts: [{ g: "m", c: "m" }, { g: "y", says: "igh" }], explain: "In my, the y says igh, like in night." }),
  T({ id: "of", text: "of", set: "t3", parts: [{ g: "o", c: "o" }, { g: "f", says: "v" }], explain: "In of, the f says v, like in van." }),
  T({ id: "said", text: "said", set: "t4", parts: [{ g: "s", c: "s" }, { g: "ai", says: "e" }, { g: "d", c: "d" }], explain: "In said, the a i says e, like in bed." }),
  T({ id: "have", text: "have", set: "t4", parts: [{ g: "h", c: "h" }, { g: "a", c: "a" }, { g: "v", c: "v" }, { g: "e", says: "silent" }], explain: "In have, the e is silent. English words do not end with a v, so the e keeps it company." }),
  T({ id: "like", text: "like", set: "t4", parts: [{ g: "l", c: "l" }, { g: "i", c: "i_e" }, { g: "k", c: "k" }, { g: "e", c: "_" }], explain: "You can sound out like! The magic e makes the i say igh." }),
  T({ id: "so", text: "so", set: "t4", parts: [{ g: "s", c: "s" }, { g: "o", says: "oa" }], explain: "In so, the o says its name, oh, like in boat." }),
  T({ id: "do", text: "do", set: "t4", parts: [{ g: "d", c: "d" }, { g: "o", says: "oo" }], explain: "In do, the o says oo, like in moon." }),
  T({ id: "some", text: "some", set: "t4", parts: [{ g: "s", c: "s" }, { g: "o", says: "u" }, { g: "m", c: "m" }, { g: "e", says: "silent" }], explain: "In some, the o says u, like in sun, and the e is silent." }),
  T({ id: "come", text: "come", set: "t5", parts: [{ g: "c", c: "c" }, { g: "o", says: "u" }, { g: "m", c: "m" }, { g: "e", says: "silent" }], explain: "In come, the o says u, like in sun, and the e is silent." }),
  T({ id: "were", text: "were", set: "t5", parts: [{ g: "w", c: "w" }, { g: "ere", says: "er" }], explain: "In were, the letters e r e say er, like in her." }),
  T({ id: "there", text: "there", set: "t5", parts: [{ g: "th", c: "dh" }, { g: "ere", says: "air" }], explain: "In there, the letters e r e say air, like in hair." }),
  T({ id: "little", text: "little", set: "t5", parts: [{ g: "l", c: "l" }, { g: "i", c: "i" }, { g: "tt", c: "tt" }, { g: "le", says: "ul" }], explain: "In little, the l e at the end says ul." }),
  T({ id: "one", text: "one", set: "t5", parts: [{ g: "one", says: "wun" }], explain: "one is a very tricky word. It sounds like w u n, but it is spelled o n e." }),
  T({ id: "what", text: "what", set: "t5", parts: [{ g: "wh", says: "w" }, { g: "a", says: "o" }, { g: "t", c: "t" }], explain: "In what, w h says w, and the a says o, like in dog." }),
];

export const TRICKY_BY_ID: Record<string, TrickyWord> = Object.fromEntries(TRICKY.map((t) => [t.id.toLowerCase(), t]));

/** Tricky words for picture/sentence games. */
export const TRICKY_SENTENCES: Record<string, { sentence: string; emoji: string }> = {
  the: { sentence: "the sun is hot", emoji: "☀️" },
  to: { sentence: "I ran to the bus", emoji: "🚌" },
  I: { sentence: "I can hop", emoji: "🐇" },
  no: { sentence: "no, not in the mud", emoji: "🟫" },
  go: { sentence: "go to bed", emoji: "🛏️" },
  into: { sentence: "the frog got into the pond", emoji: "🐸" },
  he: { sentence: "he can swim", emoji: "🏊" },
  she: { sentence: "she has a red hat", emoji: "👒" },
  we: { sentence: "we can sing", emoji: "🎤" },
  me: { sentence: "hug me", emoji: "🤗" },
  be: { sentence: "be quick", emoji: "⚡" },
  is: { sentence: "the cat is big", emoji: "🐈" },
  was: { sentence: "the dog was wet", emoji: "🐕" },
  you: { sentence: "you can jump", emoji: "🤸" },
  they: { sentence: "they got on the bus", emoji: "🚌" },
  all: { sentence: "all the fish swim", emoji: "🐟" },
  are: { sentence: "the bees are in the tree", emoji: "🐝" },
  my: { sentence: "my dog can run", emoji: "🐕" },
  said: { sentence: "yes, said Raj", emoji: "✅" },
  have: { sentence: "I have a pet cat", emoji: "🐈" },
  like: { sentence: "I like jam", emoji: "🍓" },
  so: { sentence: "the sun is so hot", emoji: "🥵" },
  do: { sentence: "do you see the moon", emoji: "🌙" },
  some: { sentence: "I have some nuts", emoji: "🥜" },
  come: { sentence: "come and see the moon", emoji: "🌙" },
  were: { sentence: "the hens were in the shed", emoji: "🐔" },
  there: { sentence: "there is a fox", emoji: "🦊" },
  little: { sentence: "a little bug", emoji: "🐛" },
  one: { sentence: "one big red bus", emoji: "🚌" },
  what: { sentence: "what is in the box", emoji: "📦" },
  of: { sentence: "a box of chips", emoji: "🍟" },
};
