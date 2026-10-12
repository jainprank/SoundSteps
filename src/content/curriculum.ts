import { CHILD_NAME } from "./child";
import { CORR_BY_ID, GROUPS } from "./correspondences";
import { PHONEME_BY_ID } from "./phonemes";
import { L5_SENTENCES, L7_SENTENCES, STORIES } from "./reading";
import { TRICKY, TRICKY_SETS, TRICKY_SENTENCES } from "./tricky";
import { NAMEABLE, firstPhoneme, lastPhoneme } from "./nameable";
import { WORDS, isDecodable } from "./words";

// The learning path. Lessons are lists of reusable activity steps; the same
// activity components power every level. To add a lesson, add steps here.

export type Position = "first" | "last";

export type Step =
  | { type: "teach"; corr: string }
  | { type: "firstSound"; targets: string[]; pool: string[]; rounds: number; position: Position }
  | { type: "yesNo"; target: string; rounds: number; position: Position }
  | { type: "hearSound"; targets: string[]; pool: string[]; rounds: number; variant?: "grid" | "bubbles" | "monster" }
  | { type: "blend"; words: string[]; demo: boolean; check: "picture" | "self" }
  | { type: "buildWord"; words: string[]; prompt: "picture" | "audio" }
  | { type: "countSounds"; words: string[] }
  | { type: "missingSound"; words: string[]; position: "first" | "middle" | "last" }
  | { type: "wordChain"; chain: string[] }
  | { type: "wordFamily"; rime: string; words: string[] }
  | { type: "soundSafari"; corr: string; words: string[] }
  | { type: "spotGrapheme"; corr: string; words: string[] }
  | { type: "feedWords"; words: string[]; pool: string[]; variant: "monster" | "bubbles" }
  | { type: "realOrSilly"; real: string[]; silly: string[] }
  | { type: "blendSort"; items: { word: string; pair: string; kind: "blend" | "digraph" }[] }
  | { type: "syllables"; words: string[] }
  | { type: "magicE"; pairs: [string, string][] }
  | { type: "suffix"; items: { base: string; ending: string; result: string }[] }
  | { type: "soundSort"; corrs: [string, string]; words: string[] }
  | { type: "teachTricky"; word: string }
  | { type: "listenSelect"; words: string[]; pool: string[] }
  | { type: "missingWord"; items: { sentence: string; blank: string; options: string[]; emoji?: string }[] }
  | { type: "sentencePicture"; sentences: string[] }
  | { type: "readingTrain"; sentences: string[] }
  | { type: "envSounds"; rounds: number }
  | { type: "animalSounds"; rounds: number }
  | { type: "sameDifferent"; mode: "words" | "sounds"; rounds: number }
  | { type: "firstSoundMatch"; rounds: number }
  | { type: "story"; story: string; questions: boolean }
  | { type: "vocab"; story: string }
  | { type: "sequence"; story: string }
  | { type: "patternHunt"; story: string }
  | { type: "retell"; story: string }
  | { type: "treasureHunt"; clues: Step[] };

export type LessonKind = "lesson" | "check" | "mastery" | "challenge";

export interface Lesson {
  id: string;
  level: number;
  title: string;
  icon: string;
  kind: LessonKind;
  steps: Step[];
  /** correspondences this lesson introduces */
  teaches: string[];
  /** tricky words this lesson introduces */
  teachesTricky: string[];
  /** everything taught by the end of this lesson (for fairness checks + games) */
  taught: string[];
  trickyTaught: string[];
  optional?: boolean;
}

export interface Level {
  id: number;
  title: string;
  short: string;
  goal: string;
  intro: string;
  icon: string;
  color: "coral" | "sky" | "mint" | "sun" | "lilac" | "rose";
  units: { title: string; lessons: Lesson[] }[];
  mastery: Lesson;
}

// ── helpers ──────────────────────────────────────────────────────────

const taught = new Set<string>();
const trickyTaught = new Set<string>();

function lesson(level: number, id: string, title: string, icon: string, steps: Step[], opts: { kind?: LessonKind; teaches?: string[]; teachesTricky?: string[]; optional?: boolean } = {}): Lesson {
  opts.teaches?.forEach((c) => taught.add(c));
  opts.teachesTricky?.forEach((t) => trickyTaught.add(t));
  return {
    id, level, title, icon, steps,
    kind: opts.kind ?? "lesson",
    teaches: opts.teaches ?? [],
    teachesTricky: opts.teachesTricky ?? [],
    taught: [...taught],
    trickyTaught: [...trickyTaught],
    optional: opts.optional,
  };
}

function phonemeOf(corr: string) {
  return CORR_BY_ID[corr].phoneme;
}

/** Does this spelling start at least two words with clear pictures? */
function startsWords(corr: string) {
  return NAMEABLE.filter((w) => w.tokens[0].c === corr).length >= 2;
}

/** Where to listen for this sound in picture games, or null when no clear pictures exist. */
function listenPosition(corr: string): Position | null {
  const ph = phonemeOf(corr);
  if (startsWords(corr)) return "first";
  if (NAMEABLE.filter((w) => w.tokens[w.tokens.length - 1].c === corr).length >= 2) return "last";
  if (NAMEABLE.filter((w) => firstPhoneme(w) === ph).length >= 2) return "first";
  if (NAMEABLE.filter((w) => lastPhoneme(w) === ph).length >= 2) return "last";
  return null;
}

/** Words that use this correspondence and are readable now (picture words first). */
function readableWith(corr: string, count: number, opts: { pictures?: boolean } = {}): string[] {
  const all = WORDS.filter((w) => w.text === w.text.toLowerCase() && w.tokens.some((t) => t.c === corr) && isDecodable(w, taught));
  const pics = all.filter((w) => w.emoji);
  return (opts.pictures ? pics : [...pics, ...all.filter((w) => !w.emoji)]).slice(0, count).map((w) => w.id);
}

// ── Level 0: Meet the Sounds ─────────────────────────────────────────

function level0(): Level {
  return {
    id: 0, title: "Meet the Sounds", short: "Listen", icon: "👂", color: "rose",
    goal: "Tune in to sounds and notice that spoken words are made of sounds.",
    intro: `Welcome ${CHILD_NAME} to SoundSteps! Let's switch on our listening ears.`,
    units: [
      {
        title: "Listening ears",
        lessons: [
          lesson(0, "l0-listen", "What made that sound?", "🥁", [{ type: "envSounds", rounds: 5 }]),
          lesson(0, "l0-animals", "Animal sounds", "🐄", [{ type: "animalSounds", rounds: 5 }]),
          lesson(0, "l0-drum", "Tap the drum", "🥁", [{ type: "sameDifferent", mode: "words", rounds: 6 }]),
          lesson(0, "l0-first", "What sound can you hear?", "👂", [{ type: "firstSoundMatch", rounds: 5 }]),
          lesson(0, "l0-twins", "Sound twins", "👯", [{ type: "sameDifferent", mode: "sounds", rounds: 6 }]),
        ],
      },
    ],
    mastery: lesson(0, "l0-check", "Listening check", "⭐", [
      { type: "envSounds", rounds: 2 },
      { type: "animalSounds", rounds: 2 },
      { type: "sameDifferent", mode: "words", rounds: 2 },
      { type: "firstSoundMatch", rounds: 3 },
    ], { kind: "mastery" }),
  };
}

// ── Level 1: Alphabet Sounds ─────────────────────────────────────────

function letterLesson(corr: string): Lesson {
  const before = [...taught];
  const pool = [...before, corr];
  const position = listenPosition(corr);
  const steps: Step[] = [{ type: "teach", corr }];
  if (position) {
    steps.push({ type: "firstSound", targets: [corr], pool, rounds: 3, position });
    steps.push({ type: "yesNo", target: corr, rounds: 4, position });
  }
  if (pool.length >= 2) steps.push({ type: "hearSound", targets: [corr], pool, rounds: 3 });
  if (pool.length >= 4) steps.push({ type: "hearSound", targets: pool.slice(-6), pool, rounds: 3, variant: "bubbles" });
  const c = CORR_BY_ID[corr];
  return lesson(1, `l1-${corr}`, c.grapheme, c.grapheme, steps, { teaches: [corr] });
}

function level1(): Level {
  const units = GROUPS.filter((g) => g.level === 1).map((g) => {
    const lessons = g.corrs.map(letterLesson);
    const checkPool = [...taught];
    const listenable = g.corrs.filter(startsWords);
    const checkSteps: Step[] = [{ type: "hearSound", targets: g.corrs, pool: checkPool, rounds: 4, variant: "monster" }];
    if (listenable.length) checkSteps.push({ type: "firstSound", targets: listenable, pool: checkPool, rounds: 3, position: "first" });
    else checkSteps.push({ type: "hearSound", targets: g.corrs, pool: checkPool, rounds: 3, variant: "bubbles" });
    lessons.push(lesson(1, `l1-check-${g.id}`, `Sound check: ${g.title}`, "⭐", checkSteps, { kind: "check" }));
    return { title: g.title, lessons };
  });
  const all = [...taught];
  return {
    id: 1, title: "Alphabet Sounds", short: "Letters", icon: "🔤", color: "coral",
    goal: "Learn the sound each letter makes, a few letters at a time.",
    intro: "Every letter makes a sound. Let's meet them, a few at a time!",
    units,
    mastery: lesson(1, "l1-mastery", "Alphabet sounds check", "🏅", [
      { type: "hearSound", targets: all, pool: all, rounds: 6 },
      { type: "firstSound", targets: all.filter(startsWords), pool: all, rounds: 4, position: "first" },
    ], { kind: "mastery" }),
  };
}

// ── Level 2: Blend ───────────────────────────────────────────────────

function level2(): Level {
  return {
    id: 2, title: "Blend Sounds", short: "Blend", icon: "🔗", color: "sky",
    goal: "Push sounds together to read words: s-a-t → sat.",
    intro: "Now for the magic! Sounds can join together to make words.",
    units: [
      {
        title: "Blending",
        lessons: [
          lesson(2, "l2-two", "Two sounds", "✌️", [{ type: "blend", words: ["at", "in", "it", "up", "on"], demo: true, check: "self" }]),
          lesson(2, "l2-g1", "s a t p i n words", "🍳", [{ type: "blend", words: ["pan", "pin", "tin", "nap", "sip", "tap"], demo: true, check: "picture" }]),
          lesson(2, "l2-g2", "m d g o c k words", "🐕", [{ type: "blend", words: ["cat", "dog", "pig", "map", "cap", "pot", "dig"], demo: true, check: "picture" }]),
          lesson(2, "l2-g3", "ck e u r h b words", "🦆", [{ type: "blend", words: ["sun", "bus", "cup", "hen", "bed", "duck", "hat", "bat"], demo: true, check: "picture" }]),
          lesson(2, "l2-g4", "More letter words", "🦊", [{ type: "blend", words: ["fan", "leg", "bell", "jam", "van", "web", "fox", "zip", "buzz"], demo: false, check: "picture" }]),
          lesson(2, "l2-four", "Four-sound words", "🐸", [{ type: "blend", words: ["frog", "drum", "crab", "tent", "nest", "hand", "milk", "lamp", "jump", "flag"], demo: false, check: "picture" }]),
          lesson(2, "l2-alien", "Alien words", "👽", [{ type: "realOrSilly", real: ["cat", "pig", "sun", "bed", "hop", "fan"], silly: ["zog", "vap", "tib", "lun", "mip", "jat"] }], { kind: "challenge", optional: true }),
        ],
      },
    ],
    mastery: lesson(2, "l2-mastery", "Blending check", "🏅", [
      { type: "blend", words: ["hat", "pig", "bus", "web", "box", "fox", "duck", "frog"], demo: false, check: "picture" },
    ], { kind: "mastery" }),
  };
}

// ── Level 3: Segment and build ───────────────────────────────────────

function level3(): Level {
  return {
    id: 3, title: "Build Words", short: "Build", icon: "🧱", color: "mint",
    goal: "Hear each sound in a word and choose letters to spell it.",
    intro: "Let's be word builders! We'll pull words apart and put them back together.",
    units: [
      {
        title: "Hear every sound",
        lessons: [
          lesson(3, "l3-count", "Count the sounds", "🔢", [{ type: "countSounds", words: ["up", "cat", "sun", "pig", "bed", "frog", "hen"] }]),
          lesson(3, "l3-first", "Missing first sound", "1️⃣", [{ type: "missingSound", words: ["map", "dog", "bus", "fan", "net", "web"], position: "first" }]),
          lesson(3, "l3-middle", "Missing middle sound", "2️⃣", [{ type: "missingSound", words: ["pin", "hot", "bed", "cup", "bag", "pen"], position: "middle" }]),
          lesson(3, "l3-last", "Missing last sound", "3️⃣", [{ type: "missingSound", words: ["cat", "pig", "sun", "cup", "hen", "bed"], position: "last" }]),
        ],
      },
      {
        title: "Build and change",
        lessons: [
          lesson(3, "l3-build", "Build a word", "🧱", [{ type: "buildWord", words: ["cat", "sun", "pig", "bed", "hat", "cup"], prompt: "picture" }]),
          lesson(3, "l3-listen-build", "Listen and spell", "👂", [{ type: "buildWord", words: ["map", "red", "jug", "mud", "zip", "fox"], prompt: "audio" }]),
          lesson(3, "l3-chain", "Word chains", "⛓️", [
            { type: "wordChain", chain: ["cat", "cap", "map", "mop", "top"] },
            { type: "wordChain", chain: ["pin", "pit", "sit", "sat", "hat"] },
            { type: "wordChain", chain: ["hen", "pen", "pet", "pot", "hot"] },
          ]),
          lesson(3, "l3-families", "Word families", "👨‍👩‍👧", [
            { type: "wordFamily", rime: "at", words: ["cat", "hat", "mat", "bat", "rat", "sat"] },
            { type: "wordFamily", rime: "op", words: ["hop", "mop", "top", "pop"] },
            { type: "wordFamily", rime: "ig", words: ["pig", "big", "dig", "fig", "wig"] },
            { type: "wordFamily", rime: "un", words: ["sun", "run", "bun", "fun"] },
          ]),
        ],
      },
    ],
    mastery: lesson(3, "l3-mastery", "Word builder check", "🏅", [
      { type: "countSounds", words: ["dog", "cup", "lamp"] },
      { type: "missingSound", words: ["hat", "fox", "jam"], position: "middle" },
      { type: "buildWord", words: ["bus", "hen", "fan"], prompt: "picture" },
    ], { kind: "mastery" }),
  };
}

// ── Level 4: Digraphs and letter teams ───────────────────────────────

function digraphLesson(corr: string): Lesson {
  const c = CORR_BY_ID[corr];
  // the lesson's words are checked against what's taught *including* this sound
  taught.add(corr);
  const pictureWords = readableWith(corr, 4, { pictures: true });
  const anyWords = readableWith(corr, 4);
  taught.delete(corr);
  const pool = [...taught, corr].filter((x) => GROUPS.find((g) => g.corrs.includes(x))!.level === 4);
  const steps: Step[] = [
    { type: "teach", corr },
    { type: "spotGrapheme", corr, words: anyWords },
  ];
  if (pool.length >= 2) steps.push({ type: "hearSound", targets: [corr], pool, rounds: 3 });
  // words like "this" and "with" have no picture: read them, then hear them to check
  steps.push(pictureWords.length >= 3
    ? { type: "blend", words: pictureWords, demo: true, check: "picture" }
    : { type: "blend", words: anyWords, demo: true, check: "self" });
  return lesson(4, `l4-${corr}`, c.grapheme, c.grapheme, steps, { teaches: [corr] });
}

function level4(): Level {
  const units = GROUPS.filter((g) => g.level === 4).map((g) => {
    const lessons = g.corrs.map(digraphLesson);
    const words = g.corrs.flatMap((c) => readableWith(c, 2, { pictures: true }));
    const safariCorr = g.corrs[0];
    lessons.push(
      lesson(4, `l4-check-${g.id}`, `Review: ${g.title}`, "⭐", [
        { type: "feedWords", words, pool: words, variant: "monster" },
        { type: "soundSafari", corr: safariCorr, words: [...readableWith(safariCorr, 4, { pictures: true }), ...WORDS.filter((w) => w.emoji && isCVCish(w.id)).slice(0, 6).map((w) => w.id)] },
      ], { kind: "check" }),
    );
    return { title: g.title, lessons };
  });
  return {
    id: 4, title: "Letter Teams", short: "Teams", icon: "🤝", color: "lilac",
    goal: "Learn that two or three letters can work together to make one sound.",
    intro: "Some letters are best friends. They team up to make one sound!",
    units,
    mastery: lesson(4, "l4-mastery", "Letter teams check", "🏅", [
      { type: "hearSound", targets: ["sh", "ch", "th", "ng", "ai", "ee", "igh", "oa", "oo", "ar", "or", "ow", "oi"], pool: ["sh", "ch", "th", "ng", "ai", "ee", "igh", "oa", "oo", "ar", "or", "ow", "oi"], rounds: 5 },
      { type: "blend", words: ["ship", "rain", "night", "boat", "moon", "car", "fork", "cow", "coin"], demo: false, check: "picture" },
    ], { kind: "mastery" }),
  };
}

function isCVCish(id: string) {
  return ["cat", "dog", "pig", "hen", "bus", "cup", "fox", "web", "jam", "bed"].includes(id);
}

// ── Level 5: Intermediate reader ─────────────────────────────────────

function splitDigraphLesson(corr: string, pairs: [string, string][]): Lesson {
  taught.add(corr);
  const words = CORR_BY_ID[corr].examples.filter((e) => WORDS.some((w) => w.id === e && w.emoji && isDecodable(w, taught)));
  taught.delete(corr);
  if (words.length < 2) throw new Error(`Magic e lesson ${corr} needs at least two picture words`);
  return lesson(5, `l5-${corr}`, CORR_BY_ID[corr].grapheme, "✨", [
    { type: "teach", corr },
    { type: "magicE", pairs },
    { type: "blend", words, demo: true, check: "picture" },
  ], { teaches: [corr] });
}

function level5(): Level {
  const blendsLesson = lesson(5, "l5-blends", "Consonant blends", "🐸", [
    { type: "blend", words: ["frog", "flag", "drum", "crab", "clap", "stop", "swim", "snail", "train", "tree", "star", "spoon"], demo: false, check: "picture" },
    { type: "blendSort", items: [
      { word: "stop", pair: "st", kind: "blend" }, { word: "ship", pair: "sh", kind: "digraph" },
      { word: "frog", pair: "fr", kind: "blend" }, { word: "chip", pair: "ch", kind: "digraph" },
      { word: "clap", pair: "cl", kind: "blend" }, { word: "moth", pair: "th", kind: "digraph" },
      { word: "spoon", pair: "sp", kind: "blend" }, { word: "ring", pair: "ng", kind: "digraph" },
    ] },
  ]);
  const doubles = lesson(5, "l5-syllables", "Long words", "🥁", [
    { type: "syllables", words: ["rabbit", "kitten", "sunset", "picnic", "pumpkin", "rocket", "tomato", "octopus", "cat", "dentist"] },
    { type: "blend", words: ["rabbit", "kitten", "sunset", "rocket", "magnet", "carrot"], demo: true, check: "picture" },
  ], { teaches: GROUPS.find((g) => g.id === "x1")!.corrs });
  const magic = [
    splitDigraphLesson("a_e", [["cap", "cape"], ["man", "mane"]]),
    splitDigraphLesson("i_e", [["kit", "kite"], ["pin", "pine"]]),
    splitDigraphLesson("o_e", [["hop", "hope"], ["not", "note"]]),
    splitDigraphLesson("u_e", [["cub", "cube"], ["tub", "tube"]]),
  ];
  const endings = lesson(5, "l5-endings", "Endings -s -ed -ing", "➕", [
    { type: "suffix", items: [
      { base: "cat", ending: "s", result: "cats" }, { base: "dog", ending: "s", result: "dogs" },
      { base: "jump", ending: "ed", result: "jumped" }, { base: "fill", ending: "ed", result: "filled" },
      { base: "rest", ending: "ed", result: "rested" }, { base: "jump", ending: "ing", result: "jumping" },
      { base: "fish", ending: "ing", result: "fishing" }, { base: "sing", ending: "ing", result: "singing" },
    ] },
  ], { teaches: ["s_z", "ed_t", "ed_d"] });
  const alt = lesson(5, "l5-alternatives", "Same letters, new sound", "🔀", [
    { type: "teach", corr: "ow_oa" },
    { type: "soundSort", corrs: ["ow", "ow_oa"], words: ["cow", "snow", "owl", "slow", "town", "bowl", "crown", "grow"] },
    { type: "teach", corr: "oo_u" },
    { type: "soundSort", corrs: ["oo", "oo_u"], words: ["moon", "book", "boot", "foot", "zoo", "cook", "spoon", "wood"] },
    { type: "teach", corr: "ea" },
    { type: "teach", corr: "y_igh" },
    { type: "blend", words: ["sea", "leaf", "beach", "fly", "sky", "cry"], demo: false, check: "picture" },
  ], { teaches: ["ow_oa", "oo_u", "ea", "y_igh"] });
  const sentences = lesson(5, "l5-sentences", "Read a sentence", "📜", [
    { type: "sentencePicture", sentences: L5_SENTENCES.map((s) => s.id) },
  ]);
  return {
    id: 5, title: "Bigger Words", short: "Bigger", icon: "🚀", color: "sun",
    goal: "Read words with blends, magic e, endings and more than one beat.",
    intro: "You're getting so good! Let's read bigger, longer words.",
    units: [
      { title: "Blends and long words", lessons: [blendsLesson, doubles] },
      { title: "Magic e", lessons: magic },
      { title: "Endings and new sounds", lessons: [endings, alt, sentences] },
    ],
    mastery: lesson(5, "l5-mastery", "Bigger words check", "🏅", [
      { type: "blend", words: ["frog", "cake", "kite", "bone", "cube", "rabbit", "snow", "book"], demo: false, check: "picture" },
      { type: "sentencePicture", sentences: ["l5-3", "l5-6", "l5-8"] },
    ], { kind: "mastery" }),
  };
}

// ── Level 6: Tricky words ────────────────────────────────────────────

function level6(): Level {
  const units = TRICKY_SETS.map((set) => {
    const words = TRICKY.filter((t) => t.set === set.id).map((t) => t.id);
    const steps: Step[] = words.map((w) => ({ type: "teachTricky", word: w }) as Step);
    const pool = [...trickyTaught, ...words];
    steps.push({ type: "listenSelect", words, pool });
    steps.push({
      type: "missingWord",
      items: words.map((w) => {
        const { sentence, emoji } = TRICKY_SENTENCES[w];
        const others = pool.filter((x) => x !== w);
        return { sentence, blank: w, emoji, options: [w, ...pickSome(others, 2, w)] };
      }),
    });
    const l = lesson(6, `l6-${set.id}`, set.title, "💡", steps, { teachesTricky: words });
    const review = lesson(6, `l6-${set.id}-review`, `Tricky word game`, "🫧", [
      { type: "feedWords", words, pool: [...trickyTaught], variant: "bubbles" },
    ], { kind: "check" });
    return { title: set.title, lessons: [l, review] };
  });
  const all = [...trickyTaught];
  return {
    id: 6, title: "Tricky Words", short: "Tricky", icon: "💡", color: "rose",
    goal: "Read common words that have a tricky bit, and learn why it's tricky.",
    intro: "Some words have a tricky bit that doesn't follow the rules. Let's spot them!",
    units,
    mastery: lesson(6, "l6-mastery", "Tricky words check", "🏅", [
      { type: "listenSelect", words: ["the", "was", "said", "you", "they", "are", "have", "one"], pool: all },
    ], { kind: "mastery" }),
  };
}

/** Deterministic "random" pick so lessons are stable between visits. */
function pickSome<T>(arr: T[], n: number, seed: string): T[] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    out.push(copy.splice(h % copy.length, 1)[0]);
  }
  return out;
}

// ── Level 7: Beginner reader ─────────────────────────────────────────

function level7(): Level {
  const ids = L7_SENTENCES.map((s) => s.id);
  const missing = [
    { sentence: "Sam sat on a mat.", blank: "mat", options: ["mat", "map", "man"], emoji: "🧘" },
    { sentence: "The red hen is in the pen.", blank: "pen", options: ["pen", "pin", "pan"], emoji: "🐔" },
    { sentence: "We had chips for lunch.", blank: "chips", options: ["chips", "chin", "ship"], emoji: "🍟" },
    { sentence: "The moon is bright at night.", blank: "night", options: ["night", "light", "nine"], emoji: "🌙" },
    { sentence: "You can swim in the pool.", blank: "pool", options: ["pool", "pond", "pot"], emoji: "🏊" },
  ];
  const stories = STORIES.filter((s) => s.level === 7).map((s) =>
    lesson(7, `l7-${s.id}`, s.title, s.cover, [{ type: "story", story: s.id, questions: true }]),
  );
  return {
    id: 7, title: "Beginner Reader", short: "Read", icon: "📖", color: "mint",
    goal: "Read sentences and short stories, and talk about what they mean.",
    intro: "You can read words, so now you can read sentences and stories!",
    units: [
      {
        title: "Sentences",
        lessons: [
          lesson(7, "l7-sentences", "Read and match", "🖼️", [{ type: "sentencePicture", sentences: ids.slice(0, 6) }]),
          lesson(7, "l7-train", "Reading train", "🚂", [{ type: "readingTrain", sentences: ids.slice(6, 10) }]),
          lesson(7, "l7-missing", "Missing words", "🧩", [{ type: "missingWord", items: missing }]),
        ],
      },
      { title: "Short stories", lessons: stories },
    ],
    mastery: lesson(7, "l7-mastery", "Reader check", "🏅", [
      { type: "sentencePicture", sentences: ids.slice(8, 12) },
      { type: "readingTrain", sentences: [ids[0], ids[2]] },
    ], { kind: "mastery" }),
  };
}

// ── Level 8: Confident reader ────────────────────────────────────────

function level8(): Level {
  const l8 = STORIES.filter((s) => s.level === 8);
  const [last, ...rest] = [l8[l8.length - 1], ...l8.slice(0, -1)];
  const storyLesson = (id: string) => {
    const s = STORIES.find((x) => x.id === id)!;
    return lesson(8, `l8-${s.id}`, s.title, s.cover, [
      { type: "vocab", story: s.id },
      { type: "story", story: s.id, questions: true },
      { type: "sequence", story: s.id },
      { type: "patternHunt", story: s.id },
      { type: "retell", story: s.id },
    ]);
  };
  return {
    id: 8, title: "Confident Reader", short: "Explore", icon: "🌟", color: "lilac",
    goal: "Read longer stories and information texts, learn new words, and retell.",
    intro: "Let's read longer stories and find out amazing facts!",
    units: [{ title: "Stories and facts", lessons: rest.map((s) => storyLesson(s.id)) }],
    mastery: lesson(8, "l8-mastery", "Reading champion", "🏆", [
      { type: "story", story: last.id, questions: true },
      { type: "sequence", story: last.id },
    ], { kind: "mastery" }),
  };
}

// ── assemble ─────────────────────────────────────────────────────────

export const LEVELS: Level[] = [level0(), level1(), level2(), level3(), level4(), level5(), level6(), level7(), level8()];

export const ALL_LESSONS: Lesson[] = LEVELS.flatMap((l) => [...l.units.flatMap((u) => u.lessons), l.mastery]);
export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(ALL_LESSONS.map((l) => [l.id, l]));

export function levelLessons(level: Level): Lesson[] {
  return [...level.units.flatMap((u) => u.lessons), level.mastery];
}

/** Phoneme for display/audio of a correspondence. */
export function corrPhoneme(corr: string) {
  return PHONEME_BY_ID[phonemeOf(corr)];
}
