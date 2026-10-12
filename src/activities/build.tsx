import { useEffect, useMemo, useRef, useState } from "react";
import { K } from "@/content/audioKeys";
import { CORR_BY_ID } from "@/content/correspondences";
import { phonemesOf, word } from "@/content/words";
import type { Word } from "@/content/types";
import { noteResult, sample, shuffle } from "@/lib/adaptive";
import { audio, wait, type Part } from "@/lib/audio";
import { useProgress } from "@/lib/progress";
import { hook } from "@/lib/testHooks";
import { DragTile } from "@/components/DragTile";
import { Button, Emoji, Picture, SpeakerButton } from "@/components/ui";
import { ActivityFrame, encourage, praise, useInstruction, type ActivityProps } from "./framework";

const SINGLE_VOWELS = ["a", "e", "i", "o", "u"];

/** Distractor letter tiles: taught single letters not in the word. */
function distractors(w: Word, taught: string[], n: number) {
  const inWord = new Set(w.tokens.map((t) => t.c));
  const phon = new Set(phonemesOf(w));
  const pool = taught.filter((c) => CORR_BY_ID[c] && !inWord.has(c) && !phon.has(CORR_BY_ID[c].phoneme) && CORR_BY_ID[c].grapheme.length === 1);
  const vowels = pool.filter((c) => SINGLE_VOWELS.includes(c));
  const cons = pool.filter((c) => !SINGLE_VOWELS.includes(c));
  return [...sample(vowels, 1), ...sample(cons, n - 1)];
}

interface Tile { id: string; corr: string; g: string }

// ── Build a word in sound boxes ──────────────────────────────────────

export function BuildWord({ step, ctx, onDone }: ActivityProps<"buildWord">) {
  const words = useMemo(() => shuffle(step.words).map(word), [step]);
  const [index, setIndex] = useState(0);
  const score = useRef(0);
  const finish = () => onDone({ correct: score.current, total: words.length });
  // a fresh round component per word, so nothing from the last word leaks in
  return (
    <BuildRound
      key={index}
      w={words[index]}
      taught={ctx.taught}
      prompt={step.prompt}
      index={index}
      total={words.length}
      onSolved={(firstTry) => { if (firstTry) score.current++; }}
      onNext={() => (index + 1 < words.length ? setIndex(index + 1) : finish())}
      onSkip={finish}
    />
  );
}

function BuildRound({ w, taught, prompt: mode, index, total, onSolved, onNext, onSkip }: {
  w: Word;
  taught: string[];
  prompt: "picture" | "audio";
  index: number;
  total: number;
  onSolved: (firstTry: boolean) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { recordItem } = useProgress();
  const tiles = useMemo<Tile[]>(() => shuffle([...w.tokens.map((t, i) => ({ id: `w${i}`, corr: t.c, g: t.g })), ...distractors(w, taught, 2).map((c, i) => ({ id: `d${i}`, corr: c, g: CORR_BY_ID[c].grapheme }))]), [w, taught]);
  const [boxes, setBoxes] = useState<(string | null)[]>(() => w.tokens.map(() => null));
  const [selected, setSelected] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [wrongBoxes, setWrongBoxes] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  const prompt: Part[] = mode === "picture" ? [K.phrase("build-picture"), K.word(w.text)] : [K.phrase("build-the-word"), K.word(w.text)];
  useInstruction(prompt, [w.id]);

  const tileById = (id: string) => tiles.find((t) => t.id === id)!;
  const used = new Set(boxes.filter(Boolean) as string[]);

  const place = (tileId: string, boxIndex: number) => {
    if (done) return;
    const next = boxes.map((b) => (b === tileId ? null : b));
    next[boxIndex] = tileId;
    setBoxes(next);
    setSelected(null);
    setWrongBoxes(new Set());
    void audio.play([K.phoneme(CORR_BY_ID[tileById(tileId).corr].phoneme)]);
    if (next.every(Boolean)) void check(next as string[]);
  };

  const check = async (filled: string[]) => {
    await wait(500);
    const wrong = new Set(filled.map((id, i) => (tileById(id).corr === w.tokens[i].c ? -1 : i)).filter((i) => i >= 0));
    if (!wrong.size) {
      onSolved(misses === 0);
      recordItem(`w:${w.id}`, misses === 0);
      noteResult(`w:${w.id}`, misses === 0);
      setDone(true);
      void audio.play(praise([K.word(w.text)]));
      return;
    }
    const m = misses + 1;
    setMisses(m);
    if (m === 1) recordItem(`w:${w.id}`, false);
    setWrongBoxes(wrong);
    // return the wrong tiles to the tray and say the sound that belongs there
    setTimeout(() => setBoxes((b) => b.map((x, i) => (wrong.has(i) ? null : x))), 900);
    const first = [...wrong][0];
    void audio.play(encourage([K.word(w.text), { pause: 300 }, ...(m >= 2 ? [K.phoneme(CORR_BY_ID[w.tokens[first].c].phoneme)] : [])]));
  };

  const tapTile = (id: string) => {
    const empty = boxes.findIndex((b) => b === null);
    if (empty >= 0) place(id, empty);
    else setSelected(id);
  };
  const tapBox = (i: number) => {
    if (done) return;
    if (selected) return place(selected, i);
    if (boxes[i]) setBoxes(boxes.map((b, j) => (j === i ? null : b)));
    else if (misses > 0) void audio.play([K.phoneme(CORR_BY_ID[w.tokens[i].c].phoneme)]);
  };

  return (
    <ActivityFrame instruction={prompt} total={total} done={index + (done ? 1 : 0)} mood={done ? "cheer" : misses ? "think" : "happy"} onSkip={onSkip}>
      <div className="flex flex-col items-center gap-4">
        {mode === "picture" ? <Picture emoji={w.emoji} label={w.text} size="lg" /> : <SpeakerButton parts={[K.word(w.text)]} label="Hear the word" slowButton />}
        <div className="flex gap-2 sm:gap-3">
          {boxes.map((b, i) => (
            <button
              key={i}
              type="button"
              data-drop={String(i)}
              onClick={() => tapBox(i)}
              aria-label={b ? `box ${i + 1}: ${tileById(b).g}` : `empty box ${i + 1}`}
              className={`flex h-24 min-w-[4.5rem] items-center justify-center rounded-3xl border-4 border-dashed px-2 font-read text-5xl font-bold transition sm:h-28 ${
                done ? "border-mint-dark bg-mint-soft" : wrongBoxes.has(i) ? "anim-shake border-coral bg-coral-soft" : b ? "border-sky-dark bg-white" : "border-ink/25 bg-white/60"
              }`}
            >
              {b ? tileById(b).g : misses >= 2 ? <span className="text-ink/20">{w.tokens[i].g}</span> : ""}
            </button>
          ))}
        </div>
        {w.tokens.some((t) => t.c === "_") && <p className="text-base text-ink/60">One box holds a silent letter.</p>}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {tiles.map((t) => (
            <DragTile key={t.id} id={t.id} data={t.id.startsWith("w") ? hook("answer", t.id.slice(1)) : undefined} label={`letter ${t.g}`} selected={selected === t.id} disabled={used.has(t.id) || done} onTap={tapTile} onDrop={(id, target) => place(id, Number(target))}>
              {t.g}
            </DragTile>
          ))}
        </div>
      </div>
      <div className="flex min-h-[64px] justify-center">
        {done && <Button className="anim-pop" onClick={onNext}>Next ▶</Button>}
      </div>
    </ActivityFrame>
  );
}

// ── Count the sounds (or the beats) ──────────────────────────────────

function Counter({ items, target, phrase, unit, icon, scoreLabel, onDone, reveal }: {
  items: Word[];
  target: (w: Word) => number;
  phrase: "count-sounds" | "clap-beats";
  unit: string;
  icon: string;
  scoreLabel: string;
  onDone: (r: { correct: number; total: number }) => void;
  reveal: (w: Word) => Part[];
}) {
  const { recordItem } = useProgress();
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);
  const [lit, setLit] = useState(-1);
  const score = useRef(0);
  const w = items[index];
  const prompt: Part[] = [K.phrase(phrase), K.word(w.text), { pause: 200 }, ...(phrase === "count-sounds" ? [K.phrase("tap-a-dot")] : [])];
  useInstruction(prompt, [index]);
  useEffect(() => { setCount(0); setMisses(0); setDone(false); setLit(-1); }, [index]);

  const check = async () => {
    const n = target(w);
    if (count === n) {
      if (misses === 0) score.current++;
      recordItem(`${scoreLabel}:${w.id}`, misses === 0);
      setDone(true);
      await audio.play(praise());
      // show the sounds lighting up one by one
      const parts = reveal(w);
      for (let i = 0; i < parts.length; i++) {
        setLit(i);
        if (!(await audio.play([parts[i]]))) return;
      }
      setLit(-1);
      return;
    }
    const m = misses + 1;
    setMisses(m);
    if (m === 1) recordItem(`${scoreLabel}:${w.id}`, false);
    setCount(0);
    void audio.play(encourage([K.word(w.text)]), { slow: true });
  };

  const n = target(w);
  return (
    <ActivityFrame instruction={prompt} total={items.length} done={index + (done ? 1 : 0)} mood={done ? "cheer" : misses ? "think" : "happy"}>
      <div className="flex flex-col items-center gap-5">
        <Picture emoji={w.emoji} label={w.text} size="lg" />
        <SpeakerButton parts={[K.word(w.text)]} label={`Hear ${w.text}`} slowButton />
        <div className="flex min-h-[4rem] gap-3" aria-live="polite" aria-label={`${count} ${unit}`}>
          {Array.from({ length: Math.max(count, done ? n : 0) }, (_, i) => (
            <span key={i} className={`anim-pop flex h-14 w-14 items-center justify-center rounded-full text-2xl ${lit === i ? "bg-sun" : "bg-coral text-white"}`}>
              {done && phrase === "count-sounds" ? <span className="font-read font-bold">{w.tokens.filter((t) => t.c !== "_")[i]?.g}</span> : ""}
            </span>
          ))}
        </div>
        {!done && (
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => { setCount((c) => Math.min(8, c + 1)); void audio.play([{ sfx: phrase === "clap-beats" ? "env:drum" : "tap" }]); }} className="tile h-28 w-28 rounded-full text-6xl" aria-label={`Add one ${unit}`} {...hook("target", n)}>
              <Emoji e={icon} label="" />
            </button>
            <div className="flex flex-col gap-2">
              <Button variant="soft" onClick={() => setCount((c) => Math.max(0, c - 1))} disabled={!count}>Undo</Button>
              <Button variant="mint" onClick={check} disabled={!count}>Done ✔</Button>
            </div>
          </div>
        )}
      </div>
      <div className="flex min-h-[64px] justify-center">
        {done && <Button className="anim-pop" onClick={() => (index + 1 < items.length ? setIndex(index + 1) : onDone({ correct: score.current, total: items.length }))}>Next ▶</Button>}
      </div>
    </ActivityFrame>
  );
}

export function CountSounds({ step, onDone }: ActivityProps<"countSounds">) {
  const items = useMemo(() => shuffle(step.words).map(word), [step]);
  return (
    <Counter items={items} target={(w) => phonemesOf(w).length} phrase="count-sounds" unit="sound" icon="👆" scoreLabel="count" onDone={onDone}
      reveal={(w) => phonemesOf(w).map((p) => K.phoneme(p))} />
  );
}

export function Syllables({ step, onDone }: ActivityProps<"syllables">) {
  const items = useMemo(() => shuffle(step.words).map(word), [step]);
  return (
    <Counter items={items} target={(w) => w.syllables} phrase="clap-beats" unit="beat" icon="🥁" scoreLabel="beats" onDone={onDone}
      reveal={(w) => Array.from({ length: w.syllables }, () => ({ sfx: "env:drum" as const }))} />
  );
}

// ── Word chains: change one letter ───────────────────────────────────

export function WordChain({ step, ctx, onDone }: ActivityProps<"wordChain">) {
  const { recordItem } = useProgress();
  const chain = step.chain.map(word);
  const [index, setIndex] = useState(1);
  const [letters, setLetters] = useState<string[]>(chain[0].tokens.map((t) => t.c));
  const [selected, setSelected] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);
  const score = useRef(0);
  const target = chain[Math.min(index, chain.length - 1)];
  const tiles = useMemo(() => {
    const need = [...new Set(chain.flatMap((w) => w.tokens.map((t) => t.c)))];
    const extra = ctx.taught.filter((c) => !need.includes(c) && CORR_BY_ID[c]?.grapheme.length === 1).slice(0, 3);
    return shuffle([...need, ...extra]);
  }, [step, ctx.taught]); // eslint-disable-line react-hooks/exhaustive-deps

  const prompt: Part[] = done ? [] : [K.phrase("change-to"), K.word(target.text)];
  useInstruction(prompt, [index]);

  const put = (corr: string, i: number) => {
    if (done) return;
    const next = [...letters];
    next[i] = corr;
    setLetters(next);
    setSelected(null);
    void audio.play([K.phoneme(CORR_BY_ID[corr].phoneme)]);
    if (next.join("|") === target.tokens.map((t) => t.c).join("|")) {
      if (misses === 0) score.current++;
      recordItem(`w:${target.id}`, misses === 0);
      void audio.play(praise([K.word(target.text)]));
      setMisses(0);
      if (index + 1 >= chain.length) setDone(true);
      else setTimeout(() => setIndex(index + 1), 1600);
    } else if (next.filter((c, j) => c !== target.tokens[j].c).length > 1 || next[i] !== target.tokens[i].c) {
      const m = misses + 1;
      setMisses(m);
      if (m === 1) recordItem(`w:${target.id}`, false);
      const changeAt = target.tokens.findIndex((t, j) => t.c !== letters[j]);
      void audio.play(encourage([K.word(target.text), ...(m >= 2 && changeAt >= 0 ? [K.phoneme(CORR_BY_ID[target.tokens[changeAt].c].phoneme)] : [])]));
      setTimeout(() => setLetters(letters), 700);
    }
  };

  const current = letters.map((c) => CORR_BY_ID[c].grapheme);
  return (
    <ActivityFrame instruction={prompt.length ? prompt : [K.phrase("lesson-done")]} total={chain.length - 1} done={index - 1 + (done ? 1 : 0)}>
      <div className="flex flex-wrap items-center justify-center gap-2 text-2xl">
        {chain.map((w, i) => (
          <span key={w.id} className={`rounded-full px-3 py-1 font-read font-bold ${i < index || done ? "bg-mint-soft" : i === index ? "bg-sun" : "bg-white/60 text-ink/30"}`}>
            {i <= index || done ? w.text : "?"}{i < chain.length - 1 && " →"}
          </span>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4">
        <Picture emoji={target.emoji} label={target.text} />
        <SpeakerButton parts={[K.word(target.text)]} label={`Hear ${target.text}`} size="md" />
        <div className="flex gap-2 sm:gap-3" {...(done ? {} : hook("next", (() => { const at = target.tokens.findIndex((t, j) => t.c !== letters[j]); return at >= 0 ? `${target.tokens[at].c},${at}` : ""; })()))}>
          {current.map((g, i) => (
            <button key={i} type="button" data-drop={String(i)} {...hook("box", i)} onClick={() => selected && put(selected, i)} className={`flex h-24 min-w-[4.5rem] items-center justify-center rounded-3xl border-4 bg-white px-2 font-read text-5xl font-bold sm:h-28 ${selected ? "border-dashed border-sky-dark" : "border-transparent"}`} aria-label={`letter ${i + 1}: ${g}${selected ? ", tap to change" : ""}`}>
              {g}
            </button>
          ))}
        </div>
        <p className="text-base text-ink/60">{selected ? "Now tap the letter to change." : "Pick a new letter, then tap the letter to change."}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {tiles.map((c) => (
            <DragTile key={c} id={c} data={hook("corr", c)} label={`letter ${CORR_BY_ID[c].grapheme}`} selected={selected === c} disabled={done} onTap={(id) => setSelected(selected === id ? null : id)} onDrop={(id, t) => put(id, Number(t))}>
              {CORR_BY_ID[c].grapheme}
            </DragTile>
          ))}
        </div>
      </div>
      <div className="flex min-h-[64px] justify-center">
        {done && <Button className="anim-pop" onClick={() => onDone({ correct: score.current, total: chain.length - 1 })}>Next ▶</Button>}
      </div>
    </ActivityFrame>
  );
}

// ── Word families: -at, -op ... ──────────────────────────────────────

export function WordFamily({ step, onDone }: ActivityProps<"wordFamily">) {
  const words = step.words.map(word);
  const [found, setFound] = useState<string[]>([]);
  const [current, setCurrent] = useState<Word | null>(null);
  const prompt: Part[] = [K.phrase("word-family")];
  useInstruction(prompt, [step.rime]);
  const onsets = useMemo(() => shuffle(words), [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = async (w: Word) => {
    setCurrent(w);
    const onset = w.tokens[0];
    await audio.play([K.phoneme(CORR_BY_ID[onset.c].phoneme), { pause: 150 }, K.word(w.text)]);
    if (!found.includes(w.id)) setFound((f) => [...f, w.id]);
  };
  const all = found.length === words.length;
  return (
    <ActivityFrame instruction={prompt} total={words.length} done={found.length} mood={all ? "cheer" : "happy"}>
      <div className="card flex flex-col items-center gap-4 p-6">
        <div className="flex items-end gap-2">
          <span className={`flex h-24 min-w-[4.5rem] items-center justify-center rounded-3xl border-4 border-dashed px-2 font-read text-6xl font-bold ${current ? "border-sky-dark bg-sky-soft" : "border-ink/25"}`}>{current?.tokens[0].g ?? "?"}</span>
          <span className="rounded-3xl bg-sun px-4 pb-1 font-read text-6xl font-bold">-{step.rime}</span>
        </div>
        {current?.emoji && <Picture emoji={current.emoji} label={current.text} />}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {onsets.map((w) => (
          <button key={w.id} type="button" onClick={() => void choose(w)} className={`tile h-20 w-20 text-5xl ${found.includes(w.id) ? "bg-mint-soft" : ""}`} aria-label={`start with ${w.tokens[0].g}`} {...hook("onset", found.includes(w.id) ? "done" : "todo")}>
            {w.tokens[0].g}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2" aria-label="words you made">
        {found.map((id) => (
          <span key={id} className="anim-pop rounded-full bg-white px-3 py-1 font-read text-2xl font-bold shadow-popsm">{id}</span>
        ))}
      </div>
      <div className="flex min-h-[64px] justify-center">
        {all && <Button className="anim-pop" onClick={() => { void audio.play(praise()); onDone({ correct: 0, total: 0 }); }}>Next ▶</Button>}
      </div>
    </ActivityFrame>
  );
}

// ── Sound safari: find everything with a sound ───────────────────────

export function SoundSafari({ step, onDone }: ActivityProps<"soundSafari">) {
  const { recordItem } = useProgress();
  const c = CORR_BY_ID[step.corr];
  const items = useMemo(() => shuffle([...new Set(step.words)].map(word).filter((w) => w.emoji)), [step]);
  const has = (w: Word) => phonemesOf(w).includes(c.phoneme);
  const targets = items.filter(has);
  const [found, setFound] = useState<string[]>([]);
  const [nope, setNope] = useState<string | null>(null);
  const misses = useRef(0);
  const prompt: Part[] = [K.phrase("find-all"), K.phoneme(c.phoneme)];
  useInstruction(prompt, [step.corr]);

  const tap = (w: Word) => {
    if (found.includes(w.id)) return void audio.play([K.word(w.text)]);
    if (has(w)) {
      const next = [...found, w.id];
      setFound(next);
      void audio.play(next.length === targets.length ? praise([K.word(w.text)]) : [{ sfx: "correct" }, K.word(w.text)]);
      if (next.length === targets.length) recordItem(`ph:${c.phoneme}`, misses.current === 0);
    } else {
      misses.current++;
      setNope(w.id);
      setTimeout(() => setNope(null), 500);
      void audio.play([{ sfx: "retry" }, K.word(w.text), { pause: 200 }, K.phrase("listen"), K.phoneme(c.phoneme)]);
    }
  };
  const all = found.length === targets.length;
  return (
    <ActivityFrame instruction={prompt} total={targets.length} done={found.length} mood={all ? "cheer" : "happy"}>
      <div className="relative grid grid-cols-3 gap-3 rounded-blob bg-gradient-to-b from-sky-soft via-mint-soft to-mint p-4 sm:grid-cols-5">
        <span className="emoji pointer-events-none absolute right-4 top-2 text-4xl" aria-hidden="true">☀️</span>
        {items.map((w) => (
          <button key={w.id} type="button" onClick={() => tap(w)} aria-label={w.text} {...hook("correct", has(w) && !found.includes(w.id))}
            className={`flex flex-col items-center rounded-3xl p-2 transition ${found.includes(w.id) ? "bg-white ring-4 ring-mint-dark" : "hover:bg-white/60"} ${nope === w.id ? "anim-shake" : ""}`}>
            <span className="emoji text-5xl sm:text-6xl">{w.emoji}</span>
            {found.includes(w.id) && <span className="font-read text-lg font-bold">{w.text}</span>}
          </button>
        ))}
      </div>
      <div className="flex min-h-[64px] justify-center">
        {all && <Button className="anim-pop" onClick={() => onDone({ correct: misses.current === 0 ? 1 : 0, total: 1 })}>Next ▶</Button>}
      </div>
    </ActivityFrame>
  );
}
