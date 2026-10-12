import type { Sentence, Story } from "./types";

// Sentences and stories. Every word must be decodable with the correspondences
// taught before that level, or be an explained tricky word — tests/curriculum.test.ts
// enforces this, so adding text here is safe: the test tells you if a word is too hard.

/** Level 5: sentences with no tricky words at all. */
export const L5_SENTENCES: Sentence[] = [
  { id: "l5-1", text: "Sam can hop.", emoji: "🐇" },
  { id: "l5-2", text: "Pat got wet.", emoji: "💦" },
  { id: "l5-3", text: "A frog can jump.", emoji: "🐸" },
  { id: "l5-4", text: "Dev fed his dog.", emoji: "🐕" },
  { id: "l5-5", text: "Meg had a red kite.", emoji: "🪁" },
  { id: "l5-6", text: "Raj can ride a bike.", emoji: "🚲" },
  { id: "l5-7", text: "Chen sat on a rug.", emoji: "🧘" },
  { id: "l5-8", text: "Liz has a pet snail.", emoji: "🐌" },
];

/** Level 7: sentences mixing decodable words with taught tricky words. */
export const L7_SENTENCES: Sentence[] = [
  { id: "l7-1", text: "Sam sat on a mat.", emoji: "🧘" },
  { id: "l7-2", text: "The red hen is in the pen.", emoji: "🐔" },
  { id: "l7-3", text: "I can see a big ship.", emoji: "🚢" },
  { id: "l7-4", text: "The dog was in the mud.", emoji: "🐕" },
  { id: "l7-5", text: "We had chips for lunch.", emoji: "🍟" },
  { id: "l7-6", text: "She has a coat and a hat.", emoji: "🧥" },
  { id: "l7-7", text: "They went to the farm.", emoji: "🚜" },
  { id: "l7-8", text: "The moon is bright at night.", emoji: "🌙" },
  { id: "l7-9", text: "My goat ate the corn.", emoji: "🐐" },
  { id: "l7-10", text: "You can swim in the pool.", emoji: "🏊" },
  { id: "l7-11", text: "The cow is in the shed.", emoji: "🐄" },
  { id: "l7-12", text: "A bee sat on a green leaf.", emoji: "🐝" },
];

export const STORIES: Story[] = [
  {
    id: "big-red-bus",
    title: "Sam and the Big Red Bus",
    level: 7,
    kind: "story",
    cover: "🚌",
    pages: [
      { emoji: "🚌", sentences: ["Sam sat on the bus.", "The bus is big and red."] },
      { emoji: "🐕", sentences: ["A dog got on the bus.", "The dog was wet."] },
      { emoji: "🤗", sentences: ["Sam and the dog sat and had a hug."] },
      { emoji: "🏞️", sentences: ["Then the bus got to the park.", "Sam ran and the dog ran."] },
    ],
    questions: [
      { id: "q1", kind: "who", ask: "Who sat on the bus?", options: [{ text: "Sam", emoji: "🧒" }, { text: "a hen", emoji: "🐔" }, { text: "a fox", emoji: "🦊" }], answer: 0 },
      { id: "q2", kind: "what", ask: "What got on the bus?", options: [{ text: "a cat", emoji: "🐈" }, { text: "a dog", emoji: "🐕" }, { text: "a pig", emoji: "🐖" }], answer: 1 },
      { id: "q3", kind: "where", ask: "Where did the bus go?", options: [{ text: "the shop", emoji: "🏪" }, { text: "the farm", emoji: "🚜" }, { text: "the park", emoji: "🏞️" }], answer: 2 },
    ],
    pattern: { corr: "u", label: "u as in bus" },
  },
  {
    id: "red-hen",
    title: "The Red Hen",
    level: 7,
    kind: "story",
    cover: "🐔",
    pages: [
      { emoji: "🐔", sentences: ["The red hen is in the pen.", "She has six chicks."] },
      { emoji: "🐥", sentences: ["The chicks are little.", "They can peck and run."] },
      { emoji: "🦊", sentences: ["A fox sat on a log.", "The fox was sly."] },
      { emoji: "🛖", sentences: ["The hen got the chicks into the shed.", "The fox got no lunch!"] },
    ],
    questions: [
      { id: "q1", kind: "where", ask: "Where is the red hen?", options: [{ text: "in the pen", emoji: "🐔" }, { text: "on a bus", emoji: "🚌" }, { text: "in the sea", emoji: "🌊" }], answer: 0 },
      { id: "q2", kind: "how", ask: "How many chicks does the hen have?", options: [{ text: "two", emoji: "2️⃣" }, { text: "six", emoji: "6️⃣" }, { text: "ten", emoji: "🔟" }], answer: 1 },
      { id: "q3", kind: "what", ask: "What did the fox sit on?", options: [{ text: "a log", emoji: "🪵" }, { text: "a bed", emoji: "🛏️" }, { text: "a rock", emoji: "🪨" }], answer: 0 },
      { id: "q4", kind: "predict", ask: "What do you think the fox will do next?", options: [{ text: "go home", emoji: "🏠" }, { text: "have a nap", emoji: "😴" }, { text: "look for lunch", emoji: "🔍" }] },
    ],
    pattern: { corr: "ch", label: "ch as in chick" },
  },
  {
    id: "raj-kite",
    title: "Raj and the Kite",
    level: 7,
    kind: "story",
    cover: "🪁",
    pages: [
      { emoji: "🪁", sentences: ["Raj has a kite.", "It is red and green."] },
      { emoji: "🌬️", sentences: ["The wind is strong.", "The kite went up and up."] },
      { emoji: "🌳", sentences: ["The kite got stuck in a tree."] },
      { emoji: "👨‍👦", sentences: ["Dad got a long stick.", "Dad got the kite down.", "Raj had a big grin."] },
    ],
    questions: [
      { id: "q1", kind: "what", ask: "What does Raj have?", options: [{ text: "a ball", emoji: "⚽" }, { text: "a kite", emoji: "🪁" }, { text: "a bike", emoji: "🚲" }], answer: 1 },
      { id: "q2", kind: "where", ask: "Where did the kite get stuck?", options: [{ text: "in a tree", emoji: "🌳" }, { text: "in a box", emoji: "📦" }, { text: "on a car", emoji: "🚗" }], answer: 0 },
      { id: "q3", kind: "who", ask: "Who got the kite down?", options: [{ text: "Raj", emoji: "🧒" }, { text: "a cat", emoji: "🐈" }, { text: "Dad", emoji: "👨" }], answer: 2 },
      { id: "q4", kind: "how", ask: "How did Raj feel at the end?", options: [{ text: "happy", emoji: "😁" }, { text: "sad", emoji: "😢" }, { text: "cross", emoji: "😠" }], answer: 0 },
    ],
    pattern: { corr: "i_e", label: "i-e as in kite" },
  },
  {
    id: "jin-beach",
    title: "Jin at the Beach",
    level: 7,
    kind: "story",
    cover: "🏖️",
    pages: [
      { emoji: "🏖️", sentences: ["Jin and Chen went to the beach.", "The sun was hot."] },
      { emoji: "🪣", sentences: ["Jin dug in the sand.", "Chen got a bucket."] },
      { emoji: "🌊", sentences: ["Then the sea came up.", "Splash!"] },
      { emoji: "😄", sentences: ["The sand was wet.", "Jin and Chen had fun in the sea."] },
    ],
    questions: [
      { id: "q1", kind: "where", ask: "Where did Jin and Chen go?", options: [{ text: "the beach", emoji: "🏖️" }, { text: "the zoo", emoji: "🦁" }, { text: "the shop", emoji: "🏪" }], answer: 0 },
      { id: "q2", kind: "who", ask: "Who dug in the sand?", options: [{ text: "Chen", emoji: "👧" }, { text: "Jin", emoji: "🧒" }, { text: "a crab", emoji: "🦀" }], answer: 1 },
      { id: "q3", kind: "what", ask: "What came up the beach?", options: [{ text: "a bus", emoji: "🚌" }, { text: "the sea", emoji: "🌊" }, { text: "a goat", emoji: "🐐" }], answer: 1 },
    ],
    pattern: { corr: "ea", label: "ea as in beach" },
  },
  {
    id: "snail-storm",
    title: "The Snail and the Storm",
    level: 8,
    kind: "story",
    cover: "🐌",
    pages: [
      { emoji: "🐌", sentences: ["A little snail lived in a garden.", "Each morning, the snail went for a slow trail on the wet path."] },
      { emoji: "⛈️", sentences: ["Then the sky went dark.", "Rain fell and the wind began to howl."] },
      { emoji: "🐚", sentences: ["The snail was not afraid.", "She hid in her shell and waited."] },
      { emoji: "🌈", sentences: ["At last the rain stopped.", "The snail peeped from her shell.", "The sun was bright and the garden was fresh and green."] },
    ],
    vocab: [
      { word: "trail", meaning: "a path or a track that you follow" },
      { word: "afraid", meaning: "scared" },
      { word: "howl", meaning: "make a long, loud sound, like a wolf" },
      { word: "fresh", meaning: "clean and new" },
    ],
    sequence: [
      { text: "The snail went on the wet path.", emoji: "🐌" },
      { text: "The sky went dark.", emoji: "⛈️" },
      { text: "The snail hid in her shell.", emoji: "🐚" },
      { text: "The sun was bright.", emoji: "☀️" },
    ],
    questions: [
      { id: "q1", kind: "where", ask: "Where did the snail live?", options: [{ text: "in a garden", emoji: "🌷" }, { text: "in the sea", emoji: "🌊" }, { text: "on a ship", emoji: "🚢" }], answer: 0 },
      { id: "q2", kind: "what", ask: "What did the snail do when the rain fell?", options: [{ text: "ran home", emoji: "🏃" }, { text: "hid in her shell", emoji: "🐚" }, { text: "went to sleep in a tree", emoji: "🌳" }], answer: 1 },
      { id: "q3", kind: "why", ask: "Why did the snail hide?", options: [{ text: "There was a storm", emoji: "⛈️" }, { text: "She was hungry", emoji: "🍽️" }, { text: "It was her birthday", emoji: "🎂" }], answer: 0 },
      { id: "q4", kind: "vocab", ask: "The snail was not afraid. What does afraid mean?", options: [{ text: "scared", emoji: "😨" }, { text: "sleepy", emoji: "😴" }, { text: "hungry", emoji: "😋" }], answer: 0 },
      { id: "q5", kind: "predict", ask: "What do you think the snail will do tomorrow?", options: [{ text: "go on the path again", emoji: "🐌" }, { text: "stay in her shell", emoji: "🐚" }, { text: "make a friend", emoji: "🤝" }] },
    ],
    pattern: { corr: "ai", label: "ai as in snail" },
  },
  {
    id: "dev-torch",
    title: "Dev and the Lost Torch",
    level: 8,
    kind: "story",
    cover: "🔦",
    pages: [
      { emoji: "🏕️", sentences: ["Dev and Gran went camping in the forest.", "They set up a tent next to a big oak tree."] },
      { emoji: "🌃", sentences: ["At night, Dev needed the torch.", "He felt in his bag, but the torch was not there."] },
      { emoji: "🦉", sentences: ["An owl sat on a branch.", "Hoot, hoot!", "Dev looked up.", "In the moonlight, he spotted the torch on a log."] },
      { emoji: "🔦", sentences: ["Dev grinned at the owl.", "Then he and Gran sat in the tent and had a snack."] },
    ],
    vocab: [
      { word: "forest", meaning: "a place with lots and lots of trees" },
      { word: "branch", meaning: "a part of a tree that grows out like an arm" },
      { word: "spotted", meaning: "saw something" },
      { word: "torch", meaning: "a small lamp you carry (a flashlight)" },
    ],
    sequence: [
      { text: "Dev and Gran set up a tent.", emoji: "⛺" },
      { text: "Dev could not find the torch.", emoji: "🎒" },
      { text: "An owl went hoot, hoot.", emoji: "🦉" },
      { text: "Dev spotted the torch on a log.", emoji: "🔦" },
    ],
    questions: [
      { id: "q1", kind: "where", ask: "Where did Dev and Gran go camping?", options: [{ text: "in the forest", emoji: "🌲" }, { text: "on the beach", emoji: "🏖️" }, { text: "on a farm", emoji: "🚜" }], answer: 0 },
      { id: "q2", kind: "what", ask: "What did Dev need at night?", options: [{ text: "his coat", emoji: "🧥" }, { text: "the torch", emoji: "🔦" }, { text: "a snack", emoji: "🍪" }], answer: 1 },
      { id: "q3", kind: "why", ask: "Why did Dev need the torch?", options: [{ text: "It was dark", emoji: "🌃" }, { text: "It was hot", emoji: "🥵" }, { text: "It was raining", emoji: "🌧️" }], answer: 0 },
      { id: "q4", kind: "how", ask: "How did Dev find the torch?", options: [{ text: "Gran gave it to him", emoji: "👵" }, { text: "He looked up when the owl hooted", emoji: "🦉" }, { text: "It was in his bag", emoji: "🎒" }], answer: 1 },
      { id: "q5", kind: "predict", ask: "What might Dev and Gran do in the morning?", options: [{ text: "go for a walk", emoji: "🥾" }, { text: "look for the owl", emoji: "🦉" }, { text: "have a big breakfast", emoji: "🍳" }] },
    ],
    pattern: { corr: "or", label: "or as in torch" },
  },
  {
    id: "busy-bees",
    title: "Busy Bees",
    level: 8,
    kind: "information",
    cover: "🐝",
    pages: [
      { emoji: "🐝", sentences: ["Bees are insects.", "A bee has six legs.", "It has wings to help it fly."] },
      { emoji: "🌸", sentences: ["Bees visit flowers.", "They sip sweet nectar from the flowers."] },
      { emoji: "🌱", sentences: ["Bees help plants.", "Bees bring pollen from one flower to the next.", "This helps plants grow seeds."] },
      { emoji: "🍯", sentences: ["Bees rest in a hive.", "Next time you see a bee, let it buzz on!"] },
    ],
    vocab: [
      { word: "insect", meaning: "a small animal with six legs" },
      { word: "nectar", meaning: "sweet juice inside flowers" },
      { word: "pollen", meaning: "yellow dust inside flowers" },
      { word: "hive", meaning: "a home for lots of bees" },
    ],
    sequence: [
      { text: "A bee flies to a flower.", emoji: "🐝" },
      { text: "It sips nectar.", emoji: "🌸" },
      { text: "It brings pollen to the next flower.", emoji: "🌼" },
      { text: "The plant grows seeds.", emoji: "🌱" },
    ],
    questions: [
      { id: "q1", kind: "how", ask: "How many legs does a bee have?", options: [{ text: "two", emoji: "2️⃣" }, { text: "four", emoji: "4️⃣" }, { text: "six", emoji: "6️⃣" }], answer: 2 },
      { id: "q2", kind: "what", ask: "What do bees sip from flowers?", options: [{ text: "nectar", emoji: "🍯" }, { text: "milk", emoji: "🥛" }, { text: "tea", emoji: "🍵" }], answer: 0 },
      { id: "q3", kind: "why", ask: "Why are bees good for plants?", options: [{ text: "They bring pollen", emoji: "🌼" }, { text: "They eat the leaves", emoji: "🍃" }, { text: "They dig holes", emoji: "🕳️" }], answer: 0 },
      { id: "q4", kind: "vocab", ask: "What is a hive?", options: [{ text: "a home for bees", emoji: "🍯" }, { text: "a kind of flower", emoji: "🌸" }, { text: "a big tree", emoji: "🌳" }], answer: 0 },
    ],
    pattern: { corr: "ee", label: "ee as in bee" },
  },
  {
    id: "the-moon",
    title: "The Moon",
    level: 8,
    kind: "information",
    cover: "🌙",
    pages: [
      { emoji: "🌙", sentences: ["The moon is in the sky at night.", "The moon is a big rock."] },
      { emoji: "☀️", sentences: ["The moon has no light of its own.", "It gets its light from the sun."] },
      { emoji: "🚀", sentences: ["A rocket can zoom to the moon.", "On the moon, you can jump high!"] },
      { emoji: "👣", sentences: ["There is no wind and no rain on the moon.", "A footprint on the moon can last for a long time."] },
    ],
    vocab: [
      { word: "rocket", meaning: "a machine that flies up into space" },
      { word: "footprint", meaning: "the mark a foot makes on the ground" },
      { word: "own", meaning: "belonging to itself" },
    ],
    sequence: [
      { text: "A rocket zooms up.", emoji: "🚀" },
      { text: "It lands on the moon.", emoji: "🌙" },
      { text: "You jump high.", emoji: "🤸" },
      { text: "You leave a footprint.", emoji: "👣" },
    ],
    questions: [
      { id: "q1", kind: "what", ask: "What is the moon?", options: [{ text: "a big rock", emoji: "🪨" }, { text: "a lamp", emoji: "💡" }, { text: "a cloud", emoji: "☁️" }], answer: 0 },
      { id: "q2", kind: "where", ask: "Where does the moon get its light?", options: [{ text: "from a torch", emoji: "🔦" }, { text: "from the sun", emoji: "☀️" }, { text: "from the sea", emoji: "🌊" }], answer: 1 },
      { id: "q3", kind: "why", ask: "Why can a footprint on the moon last a long time?", options: [{ text: "There is no wind or rain", emoji: "🌬️" }, { text: "The moon is very small", emoji: "🔍" }, { text: "Bees look after it", emoji: "🐝" }], answer: 0 },
    ],
    pattern: { corr: "oo", label: "oo as in moon" },
  },
];

export const STORY_BY_ID: Record<string, Story> = Object.fromEntries(STORIES.map((s) => [s.id, s]));

/** Split a sentence into word-like chunks, keeping punctuation attached for display. */
export function splitWords(text: string): { display: string; bare: string }[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((display) => ({ display, bare: display.replace(/[^A-Za-z']/g, "") }));
}
