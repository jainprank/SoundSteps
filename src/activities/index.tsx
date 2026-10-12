import { useState, type ComponentType } from "react";
import type { Step } from "@/content/curriculum";
import { K } from "@/content/audioKeys";
import { CHILD_NAME } from "@/content/child";
import { audio } from "@/lib/audio";
import { Confetti } from "@/components/Celebration";
import { Button } from "@/components/ui";
import { AnimalSounds, BlendSort, EnvSounds, FeedWords, FirstSound, FirstSoundMatch, HearSound, ListenSelect, MissingSound, MissingWord, RealOrSilly, SameDifferent, SentencePicture, SoundSort, YesNo } from "./choices";
import { Blend, SpotGrapheme } from "./blend";
import { BuildWord, CountSounds, SoundSafari, Syllables, WordChain, WordFamily } from "./build";
import { PatternHunt, ReadingTrain, Retell, Sequence, Story, Vocab } from "./reading";
import { MagicE, Suffix, Teach, TeachTricky } from "./teach";
import { ActivityFrame, useInstruction, type ActivityCtx, type ActivityProps, type ActivityResult } from "./framework";

// Step type → component. Every activity is reusable at any level.

type AnyActivity = ComponentType<{ step: Step; ctx: ActivityCtx; onDone: (r: ActivityResult) => void }>;

const REGISTRY: { [T in Step["type"]]: ComponentType<ActivityProps<T>> } = {
  teach: Teach,
  firstSound: FirstSound,
  yesNo: YesNo,
  hearSound: HearSound,
  blend: Blend,
  buildWord: BuildWord,
  countSounds: CountSounds,
  missingSound: MissingSound,
  wordChain: WordChain,
  wordFamily: WordFamily,
  soundSafari: SoundSafari,
  spotGrapheme: SpotGrapheme,
  feedWords: FeedWords,
  realOrSilly: RealOrSilly,
  blendSort: BlendSort,
  syllables: Syllables,
  magicE: MagicE,
  suffix: Suffix,
  soundSort: SoundSort,
  teachTricky: TeachTricky,
  listenSelect: ListenSelect,
  missingWord: MissingWord,
  sentencePicture: SentencePicture,
  readingTrain: ReadingTrain,
  envSounds: EnvSounds,
  animalSounds: AnimalSounds,
  sameDifferent: SameDifferent,
  firstSoundMatch: FirstSoundMatch,
  story: Story,
  vocab: Vocab,
  sequence: Sequence,
  patternHunt: PatternHunt,
  retell: Retell,
  treasureHunt: TreasureHunt,
};

export function Activity({ step, ctx, onDone }: { step: Step; ctx: ActivityCtx; onDone: (r: ActivityResult) => void }) {
  const C = REGISTRY[step.type] as unknown as AnyActivity;
  return <C step={step} ctx={ctx} onDone={onDone} />;
}

/** Solve a few clues (each one an activity) to move along the map to the treasure. */
function TreasureHunt({ step, ctx, onDone }: ActivityProps<"treasureHunt">) {
  const [clue, setClue] = useState(-1);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const intro = [K.phrase("treasure-start")];
  useInstruction(intro, []);
  const map = (
    <div className="flex items-center justify-center gap-1 sm:gap-2" aria-label={`Clue ${Math.max(clue, 0) + 1} of ${step.clues.length}`}>
      {step.clues.map((_, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={`emoji flex h-12 w-12 items-center justify-center rounded-full text-2xl ${i < clue ? "bg-mint-soft" : i === clue ? "bg-sun" : "bg-white/70"}`}>{i < clue ? "✅" : i === clue ? "🦊" : "❓"}</span>
          <span className="text-ink/30">•••</span>
        </span>
      ))}
      <span className="emoji text-4xl">{clue >= step.clues.length ? "💰" : "🧰"}</span>
    </div>
  );
  if (clue < 0) {
    return (
      <ActivityFrame instruction={intro}>
        {map}
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <span className="emoji text-8xl">🗺️</span>
          <p className="font-display text-2xl">Solve {step.clues.length} sound clues to open the treasure chest!</p>
          <Button onClick={() => setClue(0)}>Start the hunt ▶</Button>
        </div>
      </ActivityFrame>
    );
  }
  if (clue >= step.clues.length) {
    return (
      <ActivityFrame instruction={[K.phrase("treasure-found")]}>
        <Confetti />
        {map}
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <span className="emoji anim-pop text-9xl">💰</span>
          <p className="font-display text-3xl">You found the treasure, {CHILD_NAME}!</p>
          <Button onClick={() => onDone(score)}>Hooray! ▶</Button>
        </div>
      </ActivityFrame>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="px-4">{map}</div>
      <Activity
        key={clue}
        step={step.clues[clue]}
        ctx={ctx}
        onDone={(r) => {
          setScore((s) => ({ correct: s.correct + r.correct, total: s.total + r.total }));
          if (clue + 1 >= step.clues.length) void audio.play([{ sfx: "cheer" }, K.phrase("treasure-found")]);
          setClue(clue + 1);
        }}
      />
    </div>
  );
}

