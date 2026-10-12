import { useEffect, useState } from "react";
import { K } from "@/content/audioKeys";
import { CORR_BY_ID } from "@/content/correspondences";
import { PHONEME_BY_ID } from "@/content/phonemes";
import { TRICKY_BY_ID, TRICKY_SENTENCES } from "@/content/tricky";
import { WORD_BY_ID, word } from "@/content/words";
import { audio, type Part } from "@/lib/audio";
import { useProgress } from "@/lib/progress";
import { Mouth } from "@/components/Mouth";
import { Button, Emoji, Picture, SpeakerButton } from "@/components/ui";
import { WordTiles } from "@/components/WordTiles";
import { SentenceText } from "@/components/SentenceText";
import { ActivityFrame, praise, type ActivityProps } from "./framework";

/** Introduce one sound–spelling: name vs sound, mouth tip, example words, say it. */
export function Teach({ step, onDone }: ActivityProps<"teach">) {
  const { settings, practised } = useProgress();
  const c = CORR_BY_ID[step.corr];
  const ph = PHONEME_BY_ID[c.phoneme];
  const isSplit = c.grapheme.includes("-");
  const letters = c.grapheme.replace("-", "").length;
  const examples = c.examples.map((e) => WORD_BY_ID[e]).filter(Boolean).slice(0, 4);
  const [said, setSaid] = useState(false);

  const intro: Part[] = c.name
    ? [K.phrase("letter-called"), K.letterName(c.name), { pause: 200 }, K.phrase("but-it-says"), K.phoneme(ph.id), { pause: 400 }, K.phoneme(ph.id), K.phrase("as-in"), K.word(examples[0]?.text ?? "")]
    : [
        K.phrase(isSplit ? "split-digraph" : letters >= 3 ? "three-letters-one-sound" : "two-letters-one-sound"),
        { pause: 200 }, K.phrase("it-says"), K.phoneme(ph.id), { pause: 400 }, K.phoneme(ph.id), K.phrase("as-in"), K.word(examples[0]?.text ?? ""),
      ];

  useEffect(() => {
    practised([step.corr]);
    if (settings.voiceInstructions) void audio.play(intro);
    return () => audio.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.corr]);

  const big = isSplit ? c.grapheme.replace("-", "_") : c.grapheme;
  return (
    <ActivityFrame instruction={intro}>
      <div className="card flex flex-col items-center gap-4 p-6">
        <button type="button" onClick={() => void audio.play([K.phoneme(ph.id)])} className="anim-pop flex items-baseline gap-4 rounded-blob px-6 py-2 hover:bg-sun-soft" aria-label={`Hear the sound of ${c.grapheme}`}>
          <span className="font-read text-[7rem] font-bold leading-none text-coral-dark sm:text-[9rem]">{big}</span>
          {c.name && <span className="font-read text-6xl font-bold text-ink/50 sm:text-7xl">{c.name}</span>}
        </button>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {c.name && (
            <Button variant="soft" onClick={() => void audio.play([K.phrase("letter-called"), K.letterName(c.name!)])} aria-label="Hear the letter's name">
              <Emoji e="🏷️" label="" /> Name
            </Button>
          )}
          <Button variant="sky" onClick={() => void audio.play([K.phoneme(ph.id)])} aria-label="Hear the letter's sound">
            <Emoji e="🔊" label="" /> Sound /{ph.say}/
          </Button>
          <Button variant="soft" onClick={() => void audio.play([K.phoneme(ph.id)], { slow: true })} aria-label="Hear the sound slowly">
            <Emoji e="🐢" label="" /> Slow
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[auto,1fr]">
        <button type="button" className="card flex flex-col items-center gap-2 p-4" onClick={() => void audio.play([K.phrase("mouth-tip"), K.tip(ph.id)])} aria-label="How to make the sound">
          <Mouth shape={ph.mouth} size={110} />
          <span className="max-w-[14rem] text-center text-base">{ph.tip}</span>
        </button>
        <div className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          {examples.map((w) => (
            <button key={w.id} type="button" onClick={() => void audio.play([K.word(w.text)])} className="flex flex-col items-center gap-2 rounded-3xl p-2 hover:bg-sun-soft" aria-label={`Hear ${w.text}`}>
              <Picture emoji={w.emoji} label={w.text} size="sm" />
              <WordTiles word={w} size="sm" spaced={false} highlight={(i) => w.tokens[i].c === step.corr || (isSplit && w.tokens[i].c === "_")} />
            </button>
          ))}
        </div>
      </div>

      {c.note && (
        <details className="rounded-2xl bg-white/70 px-4 py-2 text-base text-ink/80">
          <summary className="cursor-pointer font-display">For grown-ups</summary>
          {c.note}
        </details>
      )}

      <div className="flex flex-col items-center gap-3">
        <Button variant="mint" onClick={() => { setSaid(false); void audio.play([K.phoneme(ph.id), { pause: 200 }, K.phrase("your-turn")]); setTimeout(() => setSaid(true), 1200); }}>
          <Emoji e="🗣️" label="" /> Your turn: say it!
        </Button>
        {said && (
          <Button className="anim-pop" onClick={() => { void audio.play(praise()); onDone({ correct: 0, total: 0 }); }}>
            I said it! ✔
          </Button>
        )}
        {!said && (
          <button type="button" className="text-base text-ink/60 underline" onClick={() => onDone({ correct: 0, total: 0 })}>
            Next ▶
          </button>
        )}
      </div>
    </ActivityFrame>
  );
}

/** A tricky word: decodable parts look normal, the tricky bit is highlighted and explained. */
export function TeachTricky({ step, onDone }: ActivityProps<"teachTricky">) {
  const { settings } = useProgress();
  const t = TRICKY_BY_ID[step.word.toLowerCase()];
  const sentence = TRICKY_SENTENCES[t.id];
  const intro: Part[] = [K.phrase("tricky-word"), K.word(t.text), { pause: 300 }, K.trickyExplain(t.id)];
  useEffect(() => {
    if (settings.voiceInstructions) void audio.play(intro);
    return () => audio.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.word]);
  return (
    <ActivityFrame instruction={intro}>
      <div className="card flex flex-col items-center gap-4 p-6">
        <div className="flex items-end gap-1" aria-label={t.text}>
          {t.parts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => void audio.play(p.c ? [K.phoneme(CORR_BY_ID[p.c]?.phoneme ?? p.c)] : [K.trickyExplain(t.id)])}
              className={`rounded-2xl px-2 font-read text-7xl font-bold sm:text-8xl ${p.says ? "bg-lilac-soft text-lilac-dark ring-4 ring-lilac" : ""}`}
              aria-label={p.says ? `tricky bit: ${p.g} says ${p.says}` : `${p.g}`}
            >
              {p.g}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-base">
          {t.parts.filter((p) => p.says).map((p, i) => (
            <span key={i} className="rounded-full bg-lilac-soft px-3 py-1">
              <Emoji e="⚡" label="tricky" /> <b>{p.g}</b> {p.says === "silent" ? "is silent" : `says “${p.says}”`}
            </span>
          ))}
        </div>
        <div className="flex gap-3">
          <SpeakerButton parts={[K.word(t.text)]} label={`Hear ${t.text}`} slowButton />
          <Button variant="soft" onClick={() => void audio.play([K.trickyExplain(t.id)])}>
            <Emoji e="💡" label="" /> Why tricky?
          </Button>
        </div>
      </div>
      {sentence && (
        <div className="card flex flex-col items-center gap-3 p-5">
          <Picture emoji={sentence.emoji} label="" size="sm" />
          <SentenceText text={capital(sentence.sentence) + "."} highlight={(bare) => bare.toLowerCase() === t.id.toLowerCase()} />
          <SpeakerButton parts={[K.trickySentence(t.id)]} label="Hear the sentence" size="md" />
        </div>
      )}
      <div className="flex justify-center">
        <Button onClick={() => onDone({ correct: 0, total: 0 })}>Next ▶</Button>
      </div>
    </ActivityFrame>
  );
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Magic e: tap the e to turn cap into cape and hear the vowel change. */
export function MagicE({ step, onDone }: ActivityProps<"magicE">) {
  const [index, setIndex] = useState(0);
  const [on, setOn] = useState(false);
  const [tried, setTried] = useState(false);
  const [short, long] = step.pairs[index];
  const shown = word(on ? long : short);
  const instruction: Part[] = [K.phrase("magic-e")];
  useEffect(() => {
    setOn(false);
    setTried(false);
    void audio.play([K.phrase("magic-e"), { pause: 200 }, K.word(short)]);
    return () => audio.stop();
  }, [index, short]);
  const toggle = () => {
    const next = !on;
    setOn(next);
    setTried(true);
    void audio.play([{ sfx: "pop" }, K.word(next ? long : short)]);
  };
  return (
    <ActivityFrame instruction={instruction} total={step.pairs.length} done={index + (tried ? 1 : 0)}>
      <div className="card flex flex-col items-center gap-5 p-6">
        <Picture emoji={shown.emoji} label={shown.text} size="lg" />
        <div className="flex items-center gap-3">
          <WordTiles word={shown} size="xl" highlight={(i) => on && (shown.tokens[i].c.endsWith("_e") || shown.tokens[i].c === "_")} />
          {!on && (
            <button type="button" onClick={toggle} className="tile anim-glow h-24 w-20 border-dashed border-sun text-6xl" aria-label="Add the magic e">
              e<span className="emoji text-2xl">✨</span>
            </button>
          )}
        </div>
        {on && (
          <p className="anim-pop text-center text-lg">
            The magic <b>e</b> makes the <b>{shown.tokens.find((t) => t.c.endsWith("_e"))?.g}</b> say its name!
          </p>
        )}
        <div className="flex gap-3">
          <SpeakerButton parts={[K.word(shown.text)]} label={`Hear ${shown.text}`} size="md" />
          {on && <Button variant="soft" onClick={toggle}>Take the e away</Button>}
        </div>
      </div>
      <div className="flex min-h-[64px] justify-center">
        {tried && (
          <Button className="anim-pop" onClick={() => (index + 1 < step.pairs.length ? setIndex(index + 1) : onDone({ correct: 0, total: 0 }))}>
            Next ▶
          </Button>
        )}
      </div>
    </ActivityFrame>
  );
}

/** Add -s, -ed or -ing and hear the new word. */
export function Suffix({ step, onDone }: ActivityProps<"suffix">) {
  const [index, setIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const it = step.items[index];
  const base = word(it.base);
  const result = word(it.result);
  useEffect(() => {
    setAdded(false);
    void audio.play([K.phrase("add-ending"), { pause: 200 }, K.word(it.base)]);
    return () => audio.stop();
  }, [index, it.base]);
  const endingSound = (() => {
    const last = result.tokens[result.tokens.length - 1];
    if (it.ending === "ing") return "ing";
    if (last.c === "ed_t") return "it sounds like /t/";
    if (last.c === "ed_d") return "it sounds like /d/";
    if (it.ending === "ed") return "it sounds like /id/";
    if (last.c === "s_z") return "it sounds like /z/";
    return "it sounds like /s/";
  })();
  return (
    <ActivityFrame instruction={[K.phrase("add-ending")]} total={step.items.length} done={index + (added ? 1 : 0)}>
      <div className="card flex flex-col items-center gap-5 p-6">
        <Picture emoji={(added ? result : base).emoji ?? base.emoji} label={added ? result.text : base.text} />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="font-read text-6xl font-bold">{base.text}</span>
          {added ? (
            <span className="anim-pop rounded-2xl bg-sun px-3 font-read text-6xl font-bold">{it.result.slice(base.text.length)}</span>
          ) : (
            <button type="button" className="tile anim-glow h-20 px-4 text-5xl" onClick={() => { setAdded(true); void audio.play([{ sfx: "pop" }, K.word(it.result)]); }} aria-label={`Add ${it.ending}`}>
              +{it.ending}
            </button>
          )}
        </div>
        {added && <p className="text-lg"><b>-{it.ending}</b>: {endingSound}</p>}
        <SpeakerButton parts={[K.word(added ? it.result : it.base)]} label="Hear the word" size="md" />
      </div>
      <div className="flex min-h-[64px] justify-center">
        {added && <Button className="anim-pop" onClick={() => (index + 1 < step.items.length ? setIndex(index + 1) : onDone({ correct: 0, total: 0 }))}>Next ▶</Button>}
      </div>
    </ActivityFrame>
  );
}
