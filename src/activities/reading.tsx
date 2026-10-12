import { useEffect, useMemo, useRef, useState } from "react";
import { K } from "@/content/audioKeys";
import { L5_SENTENCES, L7_SENTENCES, STORY_BY_ID, splitWords } from "@/content/reading";
import { WORD_BY_ID } from "@/content/words";
import { CORR_BY_ID } from "@/content/correspondences";
import { shuffle } from "@/lib/adaptive";
import { audio, wait, type Part } from "@/lib/audio";
import { useProgress } from "@/lib/progress";
import { hook } from "@/lib/testHooks";
import { Button, Emoji, Picture, SpeakerButton } from "@/components/ui";
import { SentenceText } from "@/components/SentenceText";
import { ActivityFrame, ChoiceRounds, encourage, praise, useInstruction, type ActivityProps, type ChoiceRound } from "./framework";

// ── Read to me: a story with optional narration and word highlighting ─

export function StoryReader({ storyId, onFinished }: { storyId: string; onFinished: () => void }) {
  const story = STORY_BY_ID[storyId];
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<{ s: number; w: number } | null>(null);
  const [reading, setReading] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; audio.stop(); };
  }, []);
  useEffect(() => { setActive(null); setReading(false); audio.stop(); }, [page]);

  const p = story.pages[page];
  const readPage = async (slow = false) => {
    setReading(true);
    for (let i = 0; i < p.sentences.length; i++) {
      const ok = await audio.play([K.storySentence(story.id, page, i)], { slow, onWord: (w) => alive.current && setActive({ s: i, w }) });
      if (!ok || !alive.current) {
        if (alive.current) { setReading(false); setActive(null); }
        return;
      }
      await wait(250);
    }
    if (alive.current) { setActive(null); setReading(false); }
  };
  const last = page === story.pages.length - 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col items-center gap-5 p-6">
        <span className="emoji text-[6rem] leading-none sm:text-[8rem]" role="img" aria-label="picture for this page">{p.emoji}</span>
        <div className="flex flex-col gap-3">
          {p.sentences.map((s, i) => (
            <SentenceText key={i} text={s} active={active?.s === i ? active.w : -1} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {reading ? (
            <Button variant="soft" onClick={() => { audio.stop(); setReading(false); setActive(null); }}><Emoji e="⏸️" label="" /> Stop</Button>
          ) : (
            <Button variant="sky" onClick={() => void readPage()}><Emoji e="▶️" label="" /> Read to me</Button>
          )}
          <Button variant="soft" onClick={() => void readPage(true)} aria-label="Read to me slowly"><Emoji e="🐢" label="" /></Button>
        </div>
        <p className="text-base text-ink/60">Tap any word to hear it.</p>
      </div>
      <nav className="flex items-center justify-between gap-3" aria-label="Story pages">
        <Button variant="soft" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page">◀</Button>
        <span className="font-display text-lg">Page {page + 1} of {story.pages.length}</span>
        {last ? (
          <Button onClick={onFinished}>The end ▶</Button>
        ) : (
          <Button onClick={() => setPage(page + 1)} aria-label="Next page">▶</Button>
        )}
      </nav>
    </div>
  );
}

export function Story({ step, onDone }: ActivityProps<"story">) {
  const story = STORY_BY_ID[step.story];
  const [phase, setPhase] = useState<"read" | "questions">("read");
  const intro: Part[] = [K.phrase("story-time"), { pause: 200 }, K.storyTitle(story.id)];
  useInstruction(intro, [step.story]);
  const rounds = useMemo<ChoiceRound[]>(() =>
    story.questions.map((q) => {
      const optionParts = q.options.map((_, i) => K.option(story.id, q.id, i));
      return {
        id: `q:${story.id}:${q.id}`,
        prompt: [K.question(story.id, q.id), { pause: 300 }, ...optionParts.flatMap((o) => [o, { pause: 250 }])],
        options: q.options.map((o, i) => ({
          id: String(i),
          label: o.text,
          content: <span className="flex items-center gap-3"><span className="emoji text-4xl">{o.emoji}</span><span className="font-read text-2xl font-bold">{o.text}</span></span>,
        })),
        correct: q.answer !== undefined ? String(q.answer) : "0",
        open: q.answer === undefined,
        hint: [K.question(story.id, q.id)],
        visual: <p className="rounded-2xl bg-white px-4 py-2 text-center font-display text-2xl">{q.ask}</p>,
      };
    }), [story]);
  if (phase === "read") {
    return (
      <ActivityFrame instruction={intro}>
        <h2 className="text-center font-display text-3xl">{story.title}</h2>
        <StoryReader storyId={story.id} onFinished={() => (step.questions ? (setPhase("questions"), void audio.play([K.phrase("question-time")])) : onDone({ correct: 0, total: 0 }))} />
      </ActivityFrame>
    );
  }
  return <ChoiceRounds rounds={rounds} onDone={(r) => onDone({ correct: r.correct, total: story.questions.filter((q) => q.answer !== undefined).length })} variant="list" />;
}

// ── New words before reading ─────────────────────────────────────────

export function Vocab({ step, onDone }: ActivityProps<"vocab">) {
  const story = STORY_BY_ID[step.story];
  const intro: Part[] = [K.phrase("vocab-time")];
  useInstruction(intro, [step.story]);
  return (
    <ActivityFrame instruction={intro}>
      <h2 className="text-center font-display text-3xl">New words: {story.title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {story.vocab?.map((v) => (
          <button key={v.word} type="button" className="card flex items-center gap-4 p-4 text-left" onClick={() => void audio.play([K.vocab(story.id, v.word)])}>
            <Picture emoji={WORD_BY_ID[v.word]?.emoji ?? "💬"} label={v.word} size="sm" />
            <span>
              <span className="block font-read text-3xl font-bold">{v.word}</span>
              <span className="text-lg">{v.meaning}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <Button onClick={() => onDone({ correct: 0, total: 0 })}>Let's read! ▶</Button>
      </div>
    </ActivityFrame>
  );
}

// ── Put events in order ──────────────────────────────────────────────

export function Sequence({ step, onDone }: ActivityProps<"sequence">) {
  const story = STORY_BY_ID[step.story];
  const events = story.sequence ?? [];
  const cards = useMemo(() => shuffle(events.map((e, i) => ({ ...e, i }))), [step]); // eslint-disable-line react-hooks/exhaustive-deps
  const [placed, setPlaced] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);
  const { recordItem } = useProgress();
  const intro: Part[] = [K.phrase("order-events")];
  useInstruction(intro, [step.story]);

  const tap = (i: number) => {
    if (done || placed.includes(i)) return;
    const next = [...placed, i];
    setPlaced(next);
    void audio.play([K.seq(story.id, i)]);
    if (next.length === events.length) {
      const correct = next.every((v, k) => v === k);
      if (correct) {
        setDone(true);
        recordItem(`seq:${story.id}`, misses === 0);
        void audio.play(praise());
      } else {
        setMisses((m) => m + 1);
        if (misses === 0) recordItem(`seq:${story.id}`, false);
        const keep = next.findIndex((v, k) => v !== k);
        setTimeout(() => setPlaced(next.slice(0, keep)), 800);
        void audio.play(encourage([K.seq(story.id, keep)]));
      }
    }
  };
  return (
    <ActivityFrame instruction={intro} total={events.length} done={placed.length} mood={done ? "cheer" : "happy"}>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Your order">
        {events.map((_, k) => {
          const ev = placed[k] !== undefined ? events[placed[k]] : null;
          return (
            <li key={k} className={`flex min-h-[8rem] flex-col items-center justify-center gap-1 rounded-3xl border-4 border-dashed p-2 text-center ${ev ? "border-mint-dark bg-mint-soft" : "border-ink/20"}`}>
              <span className="font-display text-2xl text-ink/40">{k + 1}</span>
              {ev && <><span className="emoji text-4xl">{ev.emoji}</span><span className="text-base">{ev.text}</span></>}
            </li>
          );
        })}
      </ol>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <button key={c.i} type="button" disabled={placed.includes(c.i)} onClick={() => tap(c.i)} {...hook("order", c.i)} className={`card flex flex-col items-center gap-1 p-3 text-center ${placed.includes(c.i) ? "opacity-30" : ""}`}>
            <span className="emoji text-5xl">{c.emoji}</span>
            <span className="text-lg">{c.text}</span>
          </button>
        ))}
      </div>
      <div className="flex min-h-[64px] justify-center gap-3">
        {placed.length > 0 && !done && <Button variant="soft" onClick={() => setPlaced([])}>Start again</Button>}
        {done && <Button className="anim-pop" onClick={() => onDone({ correct: misses === 0 ? 1 : 0, total: 1 })}>Next ▶</Button>}
      </div>
    </ActivityFrame>
  );
}

// ── Find words with a spelling pattern ───────────────────────────────

export function PatternHunt({ step, onDone }: ActivityProps<"patternHunt">) {
  const story = STORY_BY_ID[step.story];
  const pattern = story.pattern!;
  const sentences = story.pages.flatMap((p) => p.sentences);
  const hasPattern = (bare: string) => !!WORD_BY_ID[bare.toLowerCase()]?.tokens.some((t) => t.c === pattern.corr);
  const targets = new Set(sentences.flatMap((s) => splitWords(s).map((w) => w.bare.toLowerCase())).filter(hasPattern));
  const [found, setFound] = useState<Set<string>>(new Set());
  const intro: Part[] = [K.phrase("pattern-hunt"), K.phoneme(CORR_BY_ID[pattern.corr].phoneme)];
  useInstruction(intro, [step.story]);
  const tap = (bare: string) => {
    const key = bare.toLowerCase();
    if (hasPattern(bare)) {
      const next = new Set(found).add(key);
      setFound(next);
      void audio.play(next.size === targets.size ? praise([K.word(key)]) : [{ sfx: "correct" }, K.word(key)]);
    } else {
      void audio.play([K.word(key)]);
    }
  };
  return (
    <ActivityFrame instruction={intro} total={targets.size} done={found.size}>
      <p className="text-center font-display text-2xl">Find words with <span className="rounded-xl bg-lilac-soft px-2 font-read font-bold">{CORR_BY_ID[pattern.corr].grapheme}</span> ({pattern.label})</p>
      <div className="card flex flex-col gap-3 p-5">
        {sentences.map((s, i) => (
          <p key={i} className="flex flex-wrap gap-x-2 gap-y-1 font-read text-2xl font-bold sm:text-3xl">
            {splitWords(s).map((w, j) => (
              <button key={j} type="button" onClick={() => tap(w.bare)} className={`rounded-xl px-1 ${found.has(w.bare.toLowerCase()) ? "bg-lilac-soft ring-4 ring-lilac" : "hover:bg-sun-soft"}`}>
                {w.display}
              </button>
            ))}
          </p>
        ))}
      </div>
      <div className="flex justify-center gap-3">
        <Button variant={found.size === targets.size ? "primary" : "soft"} onClick={() => onDone({ correct: 0, total: 0 })}>
          {found.size === targets.size ? "Next ▶" : "I'm done ▶"}
        </Button>
      </div>
    </ActivityFrame>
  );
}

// ── Retell ───────────────────────────────────────────────────────────

export function Retell({ step, onDone }: ActivityProps<"retell">) {
  const story = STORY_BY_ID[step.story];
  const intro: Part[] = [K.phrase("retell")];
  useInstruction(intro, [step.story]);
  return (
    <ActivityFrame instruction={intro}>
      <h2 className="text-center font-display text-3xl">Tell the story: {story.title}</h2>
      <div className="flex flex-wrap justify-center gap-3" aria-label="Story pictures to help you remember">
        {story.pages.map((p, i) => (
          <span key={i} className="card emoji flex h-20 w-20 items-center justify-center text-5xl">{p.emoji}</span>
        ))}
      </div>
      <label className="flex flex-col gap-2">
        <span className="font-display text-lg">Write or type your own words (only on this screen — nothing is saved):</span>
        <textarea className="min-h-[8rem] rounded-3xl border-4 border-sky-soft bg-white p-4 font-read text-2xl focus:border-sky-dark focus:outline-none" placeholder="First... then... at the end..." />
      </label>
      <div className="flex justify-center">
        <Button onClick={() => { void audio.play(praise()); onDone({ correct: 0, total: 0 }); }}>I told it! ▶</Button>
      </div>
    </ActivityFrame>
  );
}

// ── Reading train: put words in order ────────────────────────────────

export function ReadingTrain({ step, onDone }: ActivityProps<"readingTrain">) {
  const all = [...L5_SENTENCES, ...L7_SENTENCES];
  const sentences = useMemo(() => step.sentences.map((id) => all.find((s) => s.id === id)!), [step]); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const score = useRef(0);
  return (
    <TrainRound
      key={index}
      s={sentences[index]}
      index={index}
      total={sentences.length}
      onSolved={(firstTry) => { if (firstTry) score.current++; }}
      onNext={() => (index + 1 < sentences.length ? setIndex(index + 1) : onDone({ correct: score.current, total: sentences.length }))}
    />
  );
}

function TrainRound({ s, index, total, onSolved, onNext }: {
  s: { id: string; text: string; emoji?: string };
  index: number;
  total: number;
  onSolved: (firstTry: boolean) => void;
  onNext: () => void;
}) {
  const { recordItem } = useProgress();
  const words = useMemo(() => splitWords(s.text).map((w, i) => ({ ...w, i })), [s]);
  const cars = useMemo(() => {
    let order = shuffle(words);
    while (words.length > 1 && order.every((w, k) => w.i === k)) order = shuffle(words);
    return order;
  }, [words]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);
  const intro: Part[] = [K.phrase("train-order")];
  useInstruction(intro, [s.id]);

  const tap = (i: number) => {
    if (done) return;
    if (placed.includes(i)) return setPlaced(placed.slice(0, placed.indexOf(i)));
    const next = [...placed, i];
    setPlaced(next);
    void audio.play([{ sfx: "tap" }, K.word(words[i].bare)]);
    if (next.length === words.length) {
      // compare words, not cards: two "the" cards are interchangeable
      const same = (v: number, k: number) => words[v].display.toLowerCase() === words[k].display.toLowerCase();
      if (next.every(same)) {
        onSolved(misses === 0);
        recordItem(`s:${s.id}`, misses === 0);
        setDone(true);
        void audio.play(praise([K.sentence(s.id)]));
      } else {
        const m = misses + 1;
        setMisses(m);
        if (m === 1) recordItem(`s:${s.id}`, false);
        const keep = next.findIndex((v, k) => !same(v, k));
        setTimeout(() => setPlaced(next.slice(0, keep)), 800);
        void audio.play(encourage(m >= 2 ? [K.sentence(s.id)] : []));
      }
    }
  };
  return (
    <ActivityFrame instruction={intro} total={total} done={index + (done ? 1 : 0)} mood={done ? "cheer" : misses ? "think" : "happy"}>
      <div className="flex justify-center"><Picture emoji={s.emoji} label="" /></div>
      <div className="flex min-h-[6rem] flex-wrap items-end gap-1 overflow-x-auto rounded-3xl bg-white/70 p-3" aria-label="Your train">
        <span className="emoji text-6xl" aria-hidden="true">🚂</span>
        {placed.map((i) => (
          <button key={i} type="button" onClick={() => tap(i)} className="anim-pop rounded-2xl border-b-8 border-ink/30 bg-coral px-3 py-2 font-read text-2xl font-bold text-white sm:text-3xl" aria-label={`remove ${words[i].bare}`}>
            {words[i].display}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {cars.map((w) => (
          <button key={w.i} type="button" disabled={placed.includes(w.i)} onClick={() => tap(w.i)} {...hook("order", w.i)} className={`rounded-2xl border-b-8 border-sky-dark bg-sky-soft px-4 py-3 font-read text-2xl font-bold sm:text-3xl ${placed.includes(w.i) ? "opacity-25" : ""}`}>
            {w.display}
          </button>
        ))}
      </div>
      {misses >= 2 && !done && <div className="flex justify-center"><SpeakerButton parts={[K.sentence(s.id)]} label="Hear the sentence" size="md" /></div>}
      <div className="flex min-h-[64px] justify-center">
        {done && <Button className="anim-pop" onClick={onNext}>Next ▶</Button>}
      </div>
    </ActivityFrame>
  );
}
