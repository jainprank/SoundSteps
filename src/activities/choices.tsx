import { useMemo } from "react";
import { K } from "@/content/audioKeys";
import { CORR_BY_ID } from "@/content/correspondences";
import { ANIMALS, ENV_SOUNDS, FIRST_SOUND_WORDS, SAME_DIFFERENT_SOUNDS, SAME_DIFFERENT_WORDS } from "@/content/level0";
import { NAMEABLE, firstPhoneme, lastPhoneme, sentenceKey } from "@/content/pictures";
import { L5_SENTENCES, L7_SENTENCES } from "@/content/reading";
import { NONSENSE, WORD_BY_ID, word } from "@/content/words";
import type { Word } from "@/content/types";
import { choiceCount, pick, prioritise, sample, shuffle } from "@/lib/adaptive";
import type { Part } from "@/lib/audio";
import { Picture, Emoji, SpeakerButton } from "@/components/ui";
import { WordTiles } from "@/components/WordTiles";
import { SentenceText } from "@/components/SentenceText";
import { ChoiceRounds, type ActivityProps, type ChoiceOption, type ChoiceRound } from "./framework";

// All the "tap the right answer" activities. Each builds rounds from data;
// ChoiceRounds handles feedback, hints, retries and scoring.

const phonemeOfCorr = (c: string) => CORR_BY_ID[c].phoneme;

function picOption(w: Word): ChoiceOption {
  return { id: w.id, label: w.text, content: <Picture emoji={w.emoji} label={w.text} /> };
}

function wordOption(text: string): ChoiceOption {
  return { id: text, label: text, content: <span className="font-read text-4xl font-bold sm:text-5xl">{text}</span> };
}

function graphemeOption(corr: string): ChoiceOption {
  const g = CORR_BY_ID[corr].grapheme;
  return { id: corr, label: g, content: <span className="font-read text-6xl font-bold">{g}</span> };
}

/** Distractor pictures with different emoji from each other and from the answer. */
function distinctPictures(answer: Word, candidates: Word[], n: number): Word[] {
  const seen = new Set([answer.emoji]);
  const out: Word[] = [];
  for (const w of shuffle(candidates)) {
    if (out.length >= n) break;
    if (w.id === answer.id || seen.has(w.emoji)) continue;
    seen.add(w.emoji);
    out.push(w);
  }
  return out;
}

const exampleFor = (corr: string) => CORR_BY_ID[corr].examples.find((e) => WORD_BY_ID[e]) ?? CORR_BY_ID[corr].examples[0];

function soundHint(corr: string): Part[] {
  return [K.phoneme(phonemeOfCorr(corr)), K.phrase("as-in"), K.word(exampleFor(corr))];
}

// ── Find the first (or last) sound ───────────────────────────────────

export function FirstSound({ step, onDone }: ActivityProps<"firstSound">) {
  const rounds = useMemo<ChoiceRound[]>(() => {
    const at = step.position === "first" ? firstPhoneme : lastPhoneme;
    const targets = prioritise(step.targets, (t) => `ph:${phonemeOfCorr(t)}`);
    return Array.from({ length: step.rounds }, (_, i) => {
      const corr = targets[i % targets.length];
      const ph = phonemeOfCorr(corr);
      const matches = NAMEABLE.filter((w) => at(w) === ph);
      const answer = pick(matches.length ? matches : NAMEABLE);
      const others = distinctPictures(answer, NAMEABLE.filter((w) => at(w) !== ph && firstPhoneme(w) !== ph), choiceCount(3) - 1);
      return {
        id: `ph:${ph}`,
        prompt: [K.phrase(step.position === "first" ? "which-starts-with" : "which-ends-with"), K.phoneme(ph)],
        options: shuffle([answer, ...others]).map(picOption),
        correct: answer.id,
        hint: soundHint(corr),
        after: [K.word(answer.text)],
        visual: <SoundBadge corr={corr} />,
      };
    });
  }, [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} />;
}

function SoundBadge({ corr }: { corr: string }) {
  const c = CORR_BY_ID[corr];
  return (
    <div className="flex items-center gap-3 rounded-blob bg-white px-6 py-3 shadow-popsm">
      <span className="font-read text-5xl font-bold">{c.grapheme}</span>
      <SpeakerButton parts={[K.phoneme(c.phoneme)]} label={`Hear the sound ${c.grapheme}`} size="md" />
    </div>
  );
}

// ── Thumbs up / down ─────────────────────────────────────────────────

export function YesNo({ step, onDone }: ActivityProps<"yesNo">) {
  const rounds = useMemo<ChoiceRound[]>(() => {
    const ph = phonemeOfCorr(step.target);
    const at = step.position === "first" ? firstPhoneme : lastPhoneme;
    const yes = shuffle(NAMEABLE.filter((w) => at(w) === ph));
    const no = shuffle(NAMEABLE.filter((w) => at(w) !== ph && firstPhoneme(w) !== ph));
    return Array.from({ length: step.rounds }, (_, i) => {
      const isYes = i % 2 === 0 ? true : false;
      const w = (isYes ? yes[i >> 1] : no[i >> 1]) ?? no[i];
      const correct = isYes && at(w) === ph ? "yes" : "no";
      return {
        id: `ph:${ph}`,
        prompt: [K.phrase(step.position === "first" ? "does-it-start" : "does-it-end"), K.phoneme(ph), { pause: 300 }, K.word(w.text)],
        visual: <Picture emoji={w.emoji} label={w.text} size="lg" />,
        options: [
          { id: "yes", label: "Yes", content: <Emoji e="👍" label="yes" /> },
          { id: "no", label: "No", content: <Emoji e="👎" label="no" /> },
        ],
        correct,
        hint: [K.word(w.text), { pause: 200 }, K.phoneme(ph)],
        after: [K.word(w.text)],
      };
    }).sort(() => Math.random() - 0.5);
  }, [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} variant="thumbs" />;
}

// ── Hear a sound, choose the letters (cards, bubbles or monster) ─────

export function HearSound({ step, onDone }: ActivityProps<"hearSound">) {
  const rounds = useMemo<ChoiceRound[]>(() => {
    const targets = prioritise(step.targets, (t) => `ph:${phonemeOfCorr(t)}`);
    return Array.from({ length: step.rounds }, (_, i) => {
      const corr = targets[i % targets.length];
      const ph = phonemeOfCorr(corr);
      // never offer two spellings of the same sound (c and k) as competing answers
      const pool = [...new Map(step.pool.filter((c) => phonemeOfCorr(c) !== ph).map((c) => [phonemeOfCorr(c), c])).values()];
      const n = step.variant === "bubbles" ? 4 : choiceCount(3);
      const opts = shuffle([corr, ...sample(pool, n - 1)]);
      const prompt: Part[] =
        step.variant === "monster" ? [K.phrase("feed-sound"), K.phoneme(ph)]
          : step.variant === "bubbles" ? [K.phrase("pop-the"), K.phoneme(ph)]
            : [K.phrase("which-letter"), { pause: 200 }, K.phoneme(ph)];
      return { id: `ph:${ph}`, prompt, options: opts.map(graphemeOption), correct: corr, hint: soundHint(corr), after: soundHint(corr) };
    });
  }, [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} variant={step.variant ?? "grid"} />;
}

// ── Feed / pop a word ────────────────────────────────────────────────

export function FeedWords({ step, onDone }: ActivityProps<"feedWords">) {
  const rounds = useMemo<ChoiceRound[]>(() => {
    const words = prioritise(step.words, (w) => `w:${w}`).slice(0, 6);
    return words.map((w) => {
      const others = sample(step.pool.filter((p) => p.toLowerCase() !== w.toLowerCase()), (step.variant === "bubbles" ? 4 : choiceCount(3)) - 1);
      return {
        id: `w:${w}`,
        prompt: [K.phrase(step.variant === "monster" ? "feed-word" : "which-word"), K.word(w)],
        options: shuffle([w, ...others]).map(wordOption),
        correct: w,
        hint: [K.word(w)],
        after: [K.word(w)],
      };
    });
  }, [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} variant={step.variant} />;
}

// ── Real or silly (alien) words ──────────────────────────────────────

export function RealOrSilly({ step, onDone }: ActivityProps<"realOrSilly">) {
  const rounds = useMemo<ChoiceRound[]>(() => {
    const items = shuffle([...step.real.map((r) => ({ w: word(r), real: true })), ...step.silly.map((s) => ({ w: NONSENSE.find((n) => n.id === s)!, real: false }))]);
    return items.map(({ w, real }) => ({
      id: `w:${w.id}`,
      prompt: [K.phrase("real-or-silly")],
      visual: <WordTiles word={w} size="xl" spaced={false} />,
      options: [
        { id: "real", label: "Real word", content: <span className="flex flex-col items-center gap-1"><Emoji e="🏠" label="" /><span className="font-display text-xl">Real</span></span> },
        { id: "silly", label: "Silly alien word", content: <span className="flex flex-col items-center gap-1"><Emoji e="👽" label="" /><span className="font-display text-xl">Silly</span></span> },
      ],
      correct: real ? "real" : "silly",
      hint: [K.word(w.text)],
      after: [K.word(w.text)],
    }));
  }, [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} variant="thumbs" />;
}

// ── Blend or digraph? ────────────────────────────────────────────────

export function BlendSort({ step, onDone }: ActivityProps<"blendSort">) {
  const rounds = useMemo<ChoiceRound[]>(() =>
    shuffle(step.items).map((it) => {
      const w = word(it.word);
      // highlight the token(s) that spell the pair
      let acc = "";
      const marked = new Set<number>();
      w.tokens.forEach((t, i) => {
        const start = acc.length;
        acc += t.g;
        const pairAt = w.text.indexOf(it.pair);
        if (start < pairAt + it.pair.length && start + t.g.length > pairAt) marked.add(i);
      });
      return {
        id: `w:${it.word}`,
        prompt: [K.phrase("blend-or-digraph")],
        visual: (
          <div className="flex flex-col items-center gap-3">
            <Picture emoji={w.emoji} label={w.text} />
            <WordTiles word={w} highlight={(i) => marked.has(i)} />
            <SpeakerButton parts={[K.word(w.text)]} label={`Hear ${w.text}`} size="md" />
          </div>
        ),
        options: [
          { id: "blend", label: "Two sounds", content: <span className="flex flex-col items-center gap-1"><Emoji e="👫" label="" /><span className="font-display text-xl">2 sounds</span></span> },
          { id: "digraph", label: "One sound", content: <span className="flex flex-col items-center gap-1"><Emoji e="🤝" label="" /><span className="font-display text-xl">1 sound</span></span> },
        ],
        correct: it.kind,
        hint: [K.word(w.text)],
        after: [K.word(w.text), K.phrase(it.kind === "blend" ? "two-sounds" : "one-sound")],
      };
    }), [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} variant="thumbs" />;
}

// ── Same letters, different sound (ow: cow / snow) ───────────────────

export function SoundSort({ step, onDone }: ActivityProps<"soundSort">) {
  const rounds = useMemo<ChoiceRound[]>(() => {
    const [a, b] = step.corrs;
    const keyA = word(CORR_BY_ID[a].examples[0]);
    const keyB = word(CORR_BY_ID[b].examples[0]);
    return shuffle(step.words).map((id) => {
      const w = word(id);
      const corr = w.tokens.find((t) => t.c === a || t.c === b)!.c;
      const opt = (k: Word, c: string): ChoiceOption => ({
        id: c,
        label: `${CORR_BY_ID[c].grapheme} as in ${k.text}`,
        content: <span className="flex flex-col items-center gap-1"><Picture emoji={k.emoji} label={k.text} size="sm" /><span className="font-read text-2xl font-bold">{k.text}</span></span>,
      });
      return {
        id: `w:${id}`,
        prompt: [K.phrase("sort-sounds"), K.word(w.text)],
        visual: (
          <div className="flex flex-col items-center gap-3">
            <WordTiles word={w} highlight={(i) => w.tokens[i].c === corr} />
          </div>
        ),
        options: [opt(keyA, a), opt(keyB, b)],
        correct: corr,
        hint: [K.word(w.text), K.phoneme(CORR_BY_ID[corr].phoneme)],
        after: [K.word(w.text), K.phrase("as-in"), K.word(corr === a ? keyA.text : keyB.text)],
      };
    });
  }, [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} variant="thumbs" />;
}

// ── Tricky words: listen and select ──────────────────────────────────

export function ListenSelect({ step, onDone }: ActivityProps<"listenSelect">) {
  const rounds = useMemo<ChoiceRound[]>(() =>
    prioritise(step.words, (w) => `t:${w}`).map((w) => ({
      id: `t:${w}`,
      prompt: [K.phrase("which-word"), K.word(w)],
      options: shuffle([w, ...sample(step.pool.filter((p) => p !== w), choiceCount(3) - 1)]).map(wordOption),
      correct: w,
      hint: [K.word(w)],
      after: [K.word(w)],
    })), [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} />;
}

// ── Missing sound in a word ──────────────────────────────────────────

export function MissingSound({ step, ctx, onDone }: ActivityProps<"missingSound">) {
  const rounds = useMemo<ChoiceRound[]>(() =>
    shuffle(step.words).map((id) => {
      const w = word(id);
      const idx = step.position === "first" ? 0 : step.position === "last" ? w.tokens.length - 1 : 1;
      const answer = w.tokens[idx];
      const ph = CORR_BY_ID[answer.c].phoneme;
      const sameKind = (c: string) => (step.position === "middle") === ["a", "e", "i", "o", "u"].includes(c);
      const pool = ctx.taught.filter((c) => CORR_BY_ID[c] && CORR_BY_ID[c].phoneme !== ph && CORR_BY_ID[c].grapheme.length === 1 && sameKind(c));
      const opts = shuffle([answer.c, ...sample(pool, choiceCount(3) - 1)]);
      const phrase = step.position === "first" ? "missing-first" : step.position === "last" ? "missing-last" : "missing-middle";
      return {
        id: `ph:${ph}`,
        prompt: [K.phrase(phrase), { pause: 200 }, K.word(w.text)],
        visual: (
          <div className="flex flex-col items-center gap-3">
            <Picture emoji={w.emoji} label={w.text} />
            <div className="flex gap-2">
              {w.tokens.map((t, i) => (
                <span key={i} className={`flex h-20 w-16 items-center justify-center rounded-2xl font-read text-5xl font-bold shadow-popsm ${i === idx ? "border-4 border-dashed border-coral bg-coral-soft" : "bg-white"}`}>
                  {i === idx ? "?" : t.g}
                </span>
              ))}
            </div>
          </div>
        ),
        options: opts.map(graphemeOption),
        correct: answer.c,
        hint: [K.word(w.text), { pause: 200 }, K.phoneme(ph)],
        after: [K.phoneme(ph), K.word(w.text)],
      };
    }), [step, ctx.taught]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} />;
}

// ── Missing word in a sentence ───────────────────────────────────────

export function MissingWord({ step, onDone }: ActivityProps<"missingWord">) {
  const rounds = useMemo<ChoiceRound[]>(() =>
    shuffle(step.items).map((it) => {
      const key = sentenceKey(it.sentence);
      const shown = it.sentence.replace(new RegExp(`\\b${it.blank}\\b`, "i"), "____");
      return {
        id: `w:${it.blank}`,
        prompt: [K.phrase("missing-word")],
        visual: (
          <div className="flex flex-col items-center gap-3">
            {it.emoji && <Picture emoji={it.emoji} label="" />}
            <p className="text-center font-read text-3xl font-bold sm:text-4xl">{capital(shown)}</p>
          </div>
        ),
        options: shuffle(it.options).map(wordOption),
        correct: it.blank,
        hint: [K.word(it.blank)],
        after: key ? [key] : [K.word(it.blank)],
      };
    }), [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} />;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Read a sentence, choose the picture ──────────────────────────────

export function SentencePicture({ step, onDone }: ActivityProps<"sentencePicture">) {
  const rounds = useMemo<ChoiceRound[]>(() => {
    const all = [...L5_SENTENCES, ...L7_SENTENCES];
    return shuffle(step.sentences).map((id) => {
      const s = all.find((x) => x.id === id)!;
      const others = shuffle(all.filter((x) => x.emoji !== s.emoji)).filter((x, i, arr) => arr.findIndex((y) => y.emoji === x.emoji) === i).slice(0, choiceCount(3) - 1);
      return {
        id: `s:${id}`,
        prompt: [K.phrase("read-sentence"), K.phrase("which-picture-sentence")],
        visual: <SentenceText text={s.text} />,
        options: shuffle([s, ...others]).map((x) => ({ id: x.id, label: x.text, content: <Picture emoji={x.emoji} label={x.text} /> })),
        correct: s.id,
        hint: [K.sentence(s.id)],
        after: [K.sentence(s.id)],
      };
    });
  }, [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} />;
}

// ── Level 0 listening games ──────────────────────────────────────────

export function EnvSounds({ step, onDone }: ActivityProps<"envSounds">) {
  const rounds = useMemo<ChoiceRound[]>(() =>
    sample(ENV_SOUNDS, step.rounds).map((s) => {
      const sfx = { sfx: `env:${s.id}` as const };
      const others = sample(ENV_SOUNDS.filter((x) => x.id !== s.id), choiceCount(3) - 1);
      return {
        id: `env:${s.id}`,
        prompt: [K.phrase("what-made-sound"), { pause: 300 }, sfx],
        visual: <SpeakerButton parts={[sfx]} label="Hear the sound again" />,
        options: shuffle([s, ...others]).map((x) => ({ id: x.id, label: x.label, content: <Picture emoji={x.emoji} label={x.label} /> })),
        correct: s.id,
        hint: [sfx],
        after: [],
      };
    }), [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} />;
}

export function AnimalSounds({ step, onDone }: ActivityProps<"animalSounds">) {
  const rounds = useMemo<ChoiceRound[]>(() =>
    sample(ANIMALS, step.rounds).map((a) => ({
      id: `animal:${a.id}`,
      prompt: [K.phrase("what-sound-animal"), { pause: 300 }, K.animal(a.id)],
      visual: <SpeakerButton parts={[K.animal(a.id)]} label="Hear the animal again" />,
      options: shuffle([a, ...sample(ANIMALS.filter((x) => x.id !== a.id), choiceCount(3) - 1)]).map((x) => ({ id: x.id, label: x.label, content: <Picture emoji={x.emoji} label={x.label} /> })),
      correct: a.id,
      hint: [K.animal(a.id)],
      after: [K.word(a.label)],
    })), [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} />;
}

export function SameDifferent({ step, onDone }: ActivityProps<"sameDifferent">) {
  const rounds = useMemo<ChoiceRound[]>(() => {
    const pairs = step.mode === "words" ? SAME_DIFFERENT_WORDS : SAME_DIFFERENT_SOUNDS;
    const key = step.mode === "words" ? K.word : K.phoneme;
    const same = shuffle(pairs.filter(([a, b]) => a === b));
    const diff = shuffle(pairs.filter(([a, b]) => a !== b));
    const chosen = shuffle(Array.from({ length: step.rounds }, (_, i) => (i % 2 ? diff[i >> 1] : same[i >> 1]) ?? diff[i]));
    return chosen.map(([a, b]) => {
      const parts: Part[] = [key(a), { pause: 500 }, key(b)];
      return {
        id: `sd:${a}-${b}`,
        prompt: [K.phrase("same-or-different"), { pause: 300 }, ...parts],
        visual: <SpeakerButton parts={parts} label="Hear the two sounds again" slowButton />,
        options: [
          { id: "same", label: "Same — tap the drum", content: <span className="flex flex-col items-center gap-1"><Emoji e="🥁" label="" /><span className="font-display text-xl">Same</span></span> },
          { id: "different", label: "Different", content: <span className="flex flex-col items-center gap-1"><Emoji e="🙅" label="" /><span className="font-display text-xl">Different</span></span> },
        ],
        correct: a === b ? "same" : "different",
        hint: parts,
        after: [K.phrase(a === b ? "same" : "different")],
      };
    });
  }, [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} variant="drum" />;
}

export function FirstSoundMatch({ step, onDone }: ActivityProps<"firstSoundMatch">) {
  const rounds = useMemo<ChoiceRound[]>(() => {
    const pool = FIRST_SOUND_WORDS.map(word);
    const refs = pool.filter((r) => pool.some((w) => w.id !== r.id && firstPhoneme(w) === firstPhoneme(r) && w.emoji !== r.emoji));
    return Array.from({ length: step.rounds }, () => {
      const ref = pick(refs);
      const ph = firstPhoneme(ref);
      const match = pick(pool.filter((w) => w.id !== ref.id && firstPhoneme(w) === ph && w.emoji !== ref.emoji));
      const others = distinctPictures(match, pool.filter((w) => firstPhoneme(w) !== ph), choiceCount(3) - 1);
      return {
        id: `ph:${ph}`,
        prompt: [K.phrase("same-start-as"), K.word(ref.text)],
        visual: <Picture emoji={ref.emoji} label={ref.text} size="lg" />,
        options: shuffle([match, ...others]).map(picOption),
        correct: match.id,
        hint: [K.word(ref.text), { pause: 200 }, K.phoneme(ph)],
        after: [K.word(ref.text), K.word(match.text)],
      };
    });
  }, [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} />;
}
