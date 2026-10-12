import { useEffect, useMemo, useRef, useState } from "react";
import { K } from "@/content/audioKeys";
import { CORR_BY_ID } from "@/content/correspondences";
import { NAMEABLE } from "@/content/pictures";
import { WORDS, word } from "@/content/words";
import type { Word } from "@/content/types";
import { choiceCount, shuffle } from "@/lib/adaptive";
import { audio, wait } from "@/lib/audio";
import { useProgress } from "@/lib/progress";
import { Button, Emoji, Picture } from "@/components/ui";
import { WordTiles } from "@/components/WordTiles";
import { ChoiceRounds, type ActivityProps, type ChoiceRound } from "./framework";

// Blending: say each sound while its letters light up, slide the letters
// together, say the whole word. Then the child blends on their own.

/** Index of the split-digraph partner (the silent e) for a token, if any. */
function partnerOf(w: Word, i: number): number {
  if (!w.tokens[i].c.endsWith("_e") || w.tokens[i].c === "_") return -1;
  return w.tokens.findIndex((t, j) => j > i && t.c === "_");
}

function BlendPanel({ w, demo, onBlended }: { w: Word; demo: boolean; onBlended: () => void }) {
  const [active, setActive] = useState(-1);
  const [together, setTogether] = useState(false);
  const [busy, setBusy] = useState(false);
  const { settings } = useProgress();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; audio.stop(); };
  }, []);

  const runBlend = async (withIntro: boolean, slow = false) => {
    setBusy(true);
    setTogether(false);
    const interrupted = () => {
      if (alive.current) { setBusy(false); setActive(-1); }
    };
    if (withIntro && !(await audio.play([K.phrase("blend-watch")]))) return interrupted();
    for (let i = 0; i < w.tokens.length; i++) {
      if (w.tokens[i].c === "_" || w.tokens[i].c === "*") continue;
      if (!alive.current) return;
      setActive(i);
      const ok = await audio.play([K.phoneme(CORR_BY_ID[w.tokens[i].c].phoneme)], { slow });
      if (!ok || !alive.current) return interrupted();
      await wait(slow ? 350 : 200);
    }
    setActive(-1);
    setTogether(true);
    await wait(500);
    if (!alive.current) return;
    await audio.play([K.word(w.text)], { slow });
    if (!alive.current) return;
    setBusy(false);
    onBlended();
  };

  useEffect(() => {
    setTogether(false);
    if (demo) void runBlend(true);
    else if (settings.voiceInstructions) void audio.play([K.phrase("blend-your-turn")]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.id]);

  const tapTile = (i: number) => {
    if (busy) return;
    setTogether(false);
    setActive(i);
    void audio.play([K.phoneme(CORR_BY_ID[w.tokens[i].c].phoneme)]).then(() => setActive(-1));
  };

  const partner = active >= 0 ? partnerOf(w, active) : -1;
  return (
    <div className="card flex w-full flex-col items-center gap-4 p-5">
      <WordTiles word={w} active={active} highlight={(i) => i === partner} together={together} size="xl" onTileClick={tapTile} />
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="sky" disabled={busy} onClick={() => void runBlend(false)}>
          <Emoji e="🔗" label="" /> Blend!
        </Button>
        <Button variant="soft" disabled={busy} onClick={() => void runBlend(false, true)} aria-label="Blend slowly">
          <Emoji e="🐢" label="" />
        </Button>
      </div>
    </div>
  );
}

export function Blend({ step, onDone }: ActivityProps<"blend">) {
  const rounds = useMemo<ChoiceRound[]>(() => {
    return step.words.map((id, n) => {
      const w = word(id);
      const demo = step.demo && n < 2;
      const base = { id: `w:${w.id}`, prompt: [K.phrase(demo ? "blend-watch" : "blend-your-turn")], autoplay: false, after: [K.word(w.text)] };
      if (step.check === "self" || !w.emoji) {
        return {
          ...base,
          visual: <BlendPanel key={w.id} w={w} demo={demo} onBlended={() => {}} />,
          options: [{ id: "ok", label: "I read it", content: <span className="flex items-center gap-2 font-display text-2xl"><Emoji e="✅" label="" /> I read it!</span> }],
          correct: "ok",
          open: true,
        };
      }
      // distractor pictures: other picture words, ideally sharing a sound so the child must read the whole word
      const pool = NAMEABLE.concat(WORDS.filter((x) => step.words.includes(x.id) && x.emoji)).filter((x) => x.id !== w.id && x.emoji !== w.emoji);
      const near = pool.filter((x) => x.tokens.some((t, i) => w.tokens[i]?.c === t.c));
      const seen = new Set<string | undefined>([w.emoji]);
      const others: Word[] = [];
      for (const x of [...shuffle(near), ...shuffle(pool)]) {
        if (others.length >= choiceCount(3) - 1) break;
        if (!seen.has(x.emoji)) { seen.add(x.emoji); others.push(x); }
      }
      return {
        ...base,
        visual: <BlendPanel key={w.id} w={w} demo={demo} onBlended={() => {}} />,
        options: shuffle([w, ...others]).map((x) => ({ id: x.id, label: x.text, content: <Picture emoji={x.emoji} label={x.text} /> })),
        correct: w.id,
        hint: [K.word(w.text)],
      };
    });
  }, [step]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} />;
}

/** Tap the letters that make the sound, inside real words. */
export function SpotGrapheme({ step, onDone }: ActivityProps<"spotGrapheme">) {
  const c = CORR_BY_ID[step.corr];
  const rounds = useMemo<ChoiceRound[]>(() =>
    step.words.map((id) => {
      const w = word(id);
      const idx = w.tokens.findIndex((t) => t.c === step.corr);
      return {
        id: `ph:${c.phoneme}`,
        prompt: [K.phrase("spot-the-sound"), K.phoneme(c.phoneme)],
        visual: <Picture emoji={w.emoji} label={w.text} />,
        options: w.tokens.map((t, i) => ({ id: String(i), label: t.g, content: <span className="font-read font-bold">{t.g}</span> })),
        correct: String(idx),
        hint: [K.phoneme(c.phoneme), K.phrase("as-in"), K.word(w.text)],
        after: [K.phoneme(c.phoneme), K.word(w.text)],
      };
    }), [step, c]);
  return <ChoiceRounds rounds={rounds} onDone={onDone} variant="row" />;
}
