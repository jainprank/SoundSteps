import type { Correspondence } from "./types";

// Grapheme–phoneme correspondences in teaching order. The order follows a common
// systematic synthetic phonics progression: the first six (s a t p i n) already
// make dozens of real words, so children read from their very first week.

const C = (c: Correspondence) => c;

export interface CorrGroup {
  id: string;
  title: string;
  level: number;
  corrs: string[];
}

export const GROUPS: CorrGroup[] = [
  { id: "g1", title: "s a t p i n", level: 1, corrs: ["s", "a", "t", "p", "i", "n"] },
  { id: "g2", title: "m d g o c k", level: 1, corrs: ["m", "d", "g", "o", "c", "k"] },
  { id: "g3", title: "ck e u r h b", level: 1, corrs: ["ck", "e", "u", "r", "h", "b"] },
  { id: "g4", title: "f ff l ll ss", level: 1, corrs: ["f", "ff", "l", "ll", "ss"] },
  { id: "g5", title: "j v w x", level: 1, corrs: ["j", "v", "w", "x"] },
  { id: "g6", title: "y z zz qu", level: 1, corrs: ["y", "z", "zz", "qu"] },
  { id: "d1", title: "sh ch th ng", level: 4, corrs: ["sh", "ch", "th", "dh", "ng"] },
  { id: "d2", title: "ai ee igh oa", level: 4, corrs: ["ai", "ee", "igh", "oa"] },
  { id: "d3", title: "oo ar or ur er", level: 4, corrs: ["oo", "ar", "or", "ur", "er"] },
  { id: "d4", title: "ow oi", level: 4, corrs: ["ow", "oi"] },
  { id: "x1", title: "Double letters", level: 5, corrs: ["bb", "dd", "gg", "mm", "nn", "pp", "rr", "tt"] },
  { id: "x2", title: "Magic e", level: 5, corrs: ["a_e", "i_e", "o_e", "u_e"] },
  { id: "x3", title: "Endings -s -ed -ing", level: 5, corrs: ["s_z", "ed_t", "ed_d"] },
  { id: "x4", title: "Same letters, new sound", level: 5, corrs: ["ow_oa", "oo_u", "ea", "y_igh"] },
];

export const CORRESPONDENCES: Correspondence[] = [
  // g1
  C({ id: "s", grapheme: "s", phoneme: "s", name: "S", examples: ["sun", "sock", "six", "sad"] }),
  C({ id: "a", grapheme: "a", phoneme: "a", name: "A", examples: ["ant", "apple", "cat", "map"], note: "Short /a/ as in apple. In some British and Indian accents the vowel in 'bath' and 'grass' differs; we only use words where all accents agree." }),
  C({ id: "t", grapheme: "t", phoneme: "t", name: "T", examples: ["tap", "tin", "ten", "cat"] }),
  C({ id: "p", grapheme: "p", phoneme: "p", name: "P", examples: ["pan", "pin", "pig", "cap"] }),
  C({ id: "i", grapheme: "i", phoneme: "i", name: "I", examples: ["insect", "pin", "pig", "six"] }),
  C({ id: "n", grapheme: "n", phoneme: "n", name: "N", examples: ["net", "nut", "pan", "tin"] }),
  // g2
  C({ id: "m", grapheme: "m", phoneme: "m", name: "M", examples: ["map", "man", "mug", "mat"] }),
  C({ id: "d", grapheme: "d", phoneme: "d", name: "D", examples: ["dog", "dad", "duck", "bed"] }),
  C({ id: "g", grapheme: "g", phoneme: "g", name: "G", examples: ["gap", "pig", "dog", "bag"] }),
  C({ id: "o", grapheme: "o", phoneme: "o", name: "O", examples: ["octopus", "dog", "pot", "box"], note: "Short /o/ as in dog. American speakers say a more open vowel here; both are correct." }),
  C({ id: "c", grapheme: "c", phoneme: "k", name: "C", examples: ["cat", "cap", "cup", "can"], note: "c and k make the same sound here. Later, children meet c saying /s/ in words like 'city'." }),
  C({ id: "k", grapheme: "k", phoneme: "k", name: "K", examples: ["kit", "kid", "king", "kick"] }),
  // g3
  C({ id: "ck", grapheme: "ck", phoneme: "k", examples: ["duck", "sock", "rock", "neck"], note: "Two letters, one sound. ck comes straight after a short vowel." }),
  C({ id: "e", grapheme: "e", phoneme: "e", name: "E", examples: ["egg", "bed", "hen", "ten"] }),
  C({ id: "u", grapheme: "u", phoneme: "u", name: "U", examples: ["up", "sun", "cup", "bus"] }),
  C({ id: "r", grapheme: "r", phoneme: "r", name: "R", examples: ["rat", "red", "rug", "run"], note: "British and Indian English often do not sound an r after a vowel (car); American English does. Initial r is the same everywhere." }),
  C({ id: "h", grapheme: "h", phoneme: "h", name: "H", examples: ["hat", "hen", "hut", "hop"] }),
  C({ id: "b", grapheme: "b", phoneme: "b", name: "B", examples: ["bat", "bed", "bus", "bag"] }),
  // g4
  C({ id: "f", grapheme: "f", phoneme: "f", name: "F", examples: ["fan", "fig", "fox", "fin"] }),
  C({ id: "ff", grapheme: "ff", phoneme: "f", examples: ["puff", "cuff", "off", "huff"] }),
  C({ id: "l", grapheme: "l", phoneme: "l", name: "L", examples: ["leg", "lip", "log", "lid"] }),
  C({ id: "ll", grapheme: "ll", phoneme: "l", examples: ["bell", "doll", "hill", "well"] }),
  C({ id: "ss", grapheme: "ss", phoneme: "s", examples: ["kiss", "mess", "less", "boss"] }),
  // g5
  C({ id: "j", grapheme: "j", phoneme: "j", name: "J", examples: ["jam", "jet", "jug", "jog"] }),
  C({ id: "v", grapheme: "v", phoneme: "v", name: "V", examples: ["van", "vet", "vest", "vat"] }),
  C({ id: "w", grapheme: "w", phoneme: "w", name: "W", examples: ["web", "wig", "wet", "win"] }),
  C({ id: "x", grapheme: "x", phoneme: "ks", name: "X", examples: ["box", "fox", "six", "wax"], note: "x makes two sounds, /k/ + /s/." }),
  // g6
  C({ id: "y", grapheme: "y", phoneme: "y", name: "Y", examples: ["yak", "yes", "yell", "yum"] }),
  C({ id: "z", grapheme: "z", phoneme: "z", name: "Z", examples: ["zip", "zap", "zig", "zed"] }),
  C({ id: "zz", grapheme: "zz", phoneme: "z", examples: ["buzz", "fizz", "jazz", "fuzz"] }),
  C({ id: "qu", grapheme: "qu", phoneme: "kw", name: "Q", examples: ["quiz", "quick", "quit", "quack"], note: "q is almost always followed by u; together they say /kw/." }),
  // d1
  C({ id: "sh", grapheme: "sh", phoneme: "sh", examples: ["ship", "fish", "shell", "shop"] }),
  C({ id: "ch", grapheme: "ch", phoneme: "ch", examples: ["chick", "chip", "chin", "lunch"] }),
  C({ id: "th", grapheme: "th", phoneme: "th", examples: ["thin", "bath", "moth", "thick"], note: "th has two sounds: unvoiced (thin) and voiced (this). Some Indian English speakers use a dental t/d sound here; both are understood." }),
  C({ id: "dh", grapheme: "th", phoneme: "dh", examples: ["this", "that", "then", "with"] }),
  C({ id: "ng", grapheme: "ng", phoneme: "ng", examples: ["ring", "king", "sing", "wing"] }),
  // d2
  C({ id: "ai", grapheme: "ai", phoneme: "ai", examples: ["rain", "snail", "tail", "sail"] }),
  C({ id: "ee", grapheme: "ee", phoneme: "ee", examples: ["bee", "feet", "sheep", "seed"] }),
  C({ id: "igh", grapheme: "igh", phoneme: "igh", examples: ["night", "light", "high", "right"] }),
  C({ id: "oa", grapheme: "oa", phoneme: "oa", examples: ["boat", "goat", "coat", "soap"] }),
  // d3
  C({ id: "oo", grapheme: "oo", phoneme: "oo", examples: ["moon", "boot", "zoo", "food"], note: "oo has a long sound (moon) and a short sound (book). The short sound comes in level 5." }),
  C({ id: "ar", grapheme: "ar", phoneme: "ar", examples: ["car", "jar", "farm", "shark"], note: "American English sounds the r; British and Indian English usually do not." }),
  C({ id: "or", grapheme: "or", phoneme: "or", examples: ["fork", "corn", "horn", "torch"] }),
  C({ id: "ur", grapheme: "ur", phoneme: "er", examples: ["burn", "surf", "turn", "hurt"] }),
  C({ id: "er", grapheme: "er", phoneme: "er", examples: ["her", "fern", "herb", "term"], note: "In longer words (sister) er is often a weak 'uh' sound." }),
  // d4
  C({ id: "ow", grapheme: "ow", phoneme: "ow", examples: ["cow", "owl", "town", "down"], note: "ow can also say /oa/ as in snow (level 5)." }),
  C({ id: "oi", grapheme: "oi", phoneme: "oi", examples: ["coin", "oil", "soil", "boil"] }),
  // x1 doubles
  C({ id: "bb", grapheme: "bb", phoneme: "b", examples: ["rabbit"] }),
  C({ id: "dd", grapheme: "dd", phoneme: "d", examples: ["ladder"] }),
  C({ id: "gg", grapheme: "gg", phoneme: "g", examples: ["egg"] }),
  C({ id: "mm", grapheme: "mm", phoneme: "m", examples: ["hammer"] }),
  C({ id: "nn", grapheme: "nn", phoneme: "n", examples: ["tennis"] }),
  C({ id: "pp", grapheme: "pp", phoneme: "p", examples: ["apple"] }),
  C({ id: "rr", grapheme: "rr", phoneme: "r", examples: ["carrot"] }),
  C({ id: "tt", grapheme: "tt", phoneme: "t", examples: ["kitten"] }),
  // x2 split digraphs
  C({ id: "a_e", grapheme: "a-e", phoneme: "ai", examples: ["cake", "cape", "snake", "game"], note: "A split digraph: the e jumps over one letter and makes the vowel say its name." }),
  C({ id: "i_e", grapheme: "i-e", phoneme: "igh", examples: ["kite", "bike", "five", "nine"] }),
  C({ id: "o_e", grapheme: "o-e", phoneme: "oa", examples: ["bone", "rose", "home", "rope"] }),
  C({ id: "u_e", grapheme: "u-e", phoneme: "ue", examples: ["cube", "flute", "tube", "mule"] }),
  // x3 endings
  C({ id: "s_z", grapheme: "s", phoneme: "z", examples: ["dogs", "is", "his", "has"], note: "s often says /z/, especially at the end of a word (dogs, is)." }),
  C({ id: "ed_t", grapheme: "ed", phoneme: "t", examples: ["jumped", "kicked", "helped"] }),
  C({ id: "ed_d", grapheme: "ed", phoneme: "d", examples: ["filled", "hummed", "rained"] }),
  // x4 alternatives
  C({ id: "ow_oa", grapheme: "ow", phoneme: "oa", examples: ["snow", "bowl", "slow", "grow"] }),
  C({ id: "oo_u", grapheme: "oo", phoneme: "uu", examples: ["book", "foot", "cook", "wood"] }),
  C({ id: "ea", grapheme: "ea", phoneme: "ee", examples: ["sea", "tea", "leaf", "beach"] }),
  C({ id: "y_igh", grapheme: "y", phoneme: "igh", examples: ["fly", "sky", "cry", "my"] }),
];

export const CORR_BY_ID: Record<string, Correspondence> = Object.fromEntries(CORRESPONDENCES.map((c) => [c.id, c]));

/** Correspondences taught up to and including the given group. */
export function taughtThrough(groupId: string): Set<string> {
  const out = new Set<string>();
  for (const g of GROUPS) {
    g.corrs.forEach((c) => out.add(c));
    if (g.id === groupId) return out;
  }
  throw new Error(`Unknown group ${groupId}`);
}

export function groupOf(corrId: string): string {
  const g = GROUPS.find((x) => x.corrs.includes(corrId));
  if (!g) throw new Error(`Correspondence ${corrId} is not in any group`);
  return g.id;
}
