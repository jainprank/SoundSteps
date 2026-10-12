import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Step } from "@/content/curriculum";
import { K } from "@/content/audioKeys";
import { CORRECT_PHRASES, RETRY_PHRASES } from "@/content/phrases";
import { noteResult, pick } from "@/lib/adaptive";
import { audio, type Part } from "@/lib/audio";
import { useProgress } from "@/lib/progress";
import { Guide } from "@/components/Guide";
import { Button, ProgressDots, SpeakerButton } from "@/components/ui";
import { hook } from "@/lib/testHooks";

export interface ActivityCtx {
  taught: string[];
  tricky: string[];
  mode: "lesson" | "game" | "check";
}

export interface ActivityResult {
  correct: number;
  total: number;
}

export interface ActivityProps<T extends Step["type"]> {
  step: Extract<Step, { type: T }>;
  ctx: ActivityCtx;
  onDone: (r: ActivityResult) => void;
}

/** Plays instructions when an activity or round starts (if the grown-up allows it). */
export function useInstruction(parts: Part[], deps: unknown[]) {
  const { settings } = useProgress();
  useEffect(() => {
    if (settings.voiceInstructions) void audio.play(parts);
    return () => audio.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function praise(after: Part[] = []): Part[] {
  return [{ sfx: "correct" }, K.phrase(pick(CORRECT_PHRASES)), ...after];
}

export function encourage(then: Part[] = []): Part[] {
  return [{ sfx: "retry" }, K.phrase(pick(RETRY_PHRASES)), { pause: 150 }, ...then];
}

/** Common layout: progress, instruction replay, content, and a "move on" button. */
export function ActivityFrame({
  instruction,
  total,
  done,
  children,
  onSkip,
  mood = "happy",
}: {
  instruction: Part[];
  total?: number;
  done?: number;
  children: ReactNode;
  onSkip?: () => void;
  mood?: "happy" | "cheer" | "think";
}) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-28">
      <div className="flex items-center gap-3">
        <Guide size={64} mood={mood} onClick={() => void audio.play(instruction)} label="Pip: hear the instructions again" />
        <SpeakerButton parts={instruction} label="Hear the instructions" size="md" slowButton />
        <div className="ml-auto">{total !== undefined && <ProgressDots total={total} done={done ?? 0} />}</div>
      </div>
      {children}
      {onSkip && (
        <div className="flex justify-center pt-2">
          <button type="button" onClick={onSkip} className="rounded-full px-4 py-2 text-base text-ink/60 underline-offset-4 hover:underline">
            Skip this activity ⏭
          </button>
        </div>
      )}
    </section>
  );
}

// ── Choice engine ────────────────────────────────────────────────────

export interface ChoiceOption {
  id: string;
  label: string;
  content: ReactNode;
}

export interface ChoiceRound {
  id: string;
  prompt: Part[];
  visual?: ReactNode;
  options: ChoiceOption[];
  correct: string;
  /** extra help after a miss (e.g. "s, as in sun") */
  hint?: Part[];
  /** said after the right answer (e.g. the whole word) */
  after?: Part[];
  /** no wrong answers (predictions) */
  open?: boolean;
  /** set false when the visual plays its own audio on arrival (e.g. blending demo) */
  autoplay?: boolean;
  /** the sound or word to listen for; shown as a big replay button */
  listen?: Part[];
}

export type ChoiceVariant = "grid" | "thumbs" | "bubbles" | "monster" | "drum" | "list" | "row";

export function ChoiceRounds({ rounds, onDone, variant = "grid", item = (r) => r.id, onSkip }: {
  rounds: ChoiceRound[];
  onDone: (r: ActivityResult) => void;
  variant?: ChoiceVariant;
  item?: (r: ChoiceRound) => string;
  onSkip?: () => void;
}) {
  const { settings, recordItem } = useProgress();
  const [index, setIndex] = useState(0);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState<string | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [chomp, setChomp] = useState(0);
  const score = useRef(0);
  const round = rounds[index];

  useEffect(() => {
    if (settings.voiceInstructions && round && round.autoplay !== false && round.prompt.length) void audio.play(round.prompt);
    return () => audio.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const choose = useCallback((opt: ChoiceOption) => {
    if (!round || solved) return;
    if (round.open || opt.id === round.correct) {
      const firstTry = attempts === 0 && !revealed;
      if (firstTry) score.current++;
      recordItem(item(round), firstTry);
      noteResult(item(round), firstTry);
      setSolved(opt.id);
      setChomp((c) => c + 1);
      void audio.play(round.open ? [{ sfx: "correct" }, K.phrase("your-ideas")] : praise(round.after));
      return;
    }
    if (attempts === 0) recordItem(item(round), false);
    setShake(opt.id);
    setTimeout(() => setShake(null), 400);
    const next = attempts + 1;
    setAttempts(next);
    if (next === 1) {
      const visible = round.options.filter((o) => !removed.has(o.id));
      if (visible.length > 2) setRemoved((r) => new Set([...r, opt.id]));
      void audio.play(encourage([...(round.hint ?? []), ...round.prompt]));
    } else {
      setRevealed(true);
      void audio.play([{ sfx: "retry" }, K.phrase("show-me"), ...round.prompt]);
    }
  }, [round, solved, attempts, revealed, removed, recordItem, item]);

  const next = () => {
    if (index + 1 >= rounds.length) return onDone({ correct: score.current, total: rounds.length });
    // reset round state in the same update as the new index (no stale frame)
    setRemoved(new Set());
    setAttempts(0);
    setRevealed(false);
    setSolved(null);
    setIndex(index + 1);
  };

  if (!round) return null;
  const options = round.options.filter((o) => !removed.has(o.id));

  const optionClass = (o: ChoiceOption) => {
    const isSolved = solved === o.id;
    const glow = revealed && !solved && o.id === round.correct;
    return `${isSolved ? "border-mint-dark bg-mint-soft" : ""} ${glow ? "anim-glow border-sun" : ""} ${shake === o.id ? "anim-shake" : ""} ${solved && !isSolved ? "opacity-40" : ""}`;
  };

  return (
    <ActivityFrame instruction={round.prompt} total={rounds.length} done={index + (solved ? 1 : 0)} onSkip={onSkip} mood={solved ? "cheer" : attempts ? "think" : "happy"}>
      {round.visual && <div className="flex justify-center">{round.visual}</div>}

      {variant === "monster" ? (
        <div className="flex items-center justify-center gap-3">
          <span key={chomp} className={`emoji text-8xl ${chomp ? "anim-chomp" : ""}`} aria-hidden="true">{solved ? "😋" : "👾"}</span>
          {round.listen && (
            <div className="relative rounded-blob bg-white px-4 py-3 shadow-popsm">
              <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-white" aria-hidden="true" />
              <SpeakerButton parts={round.listen} label="Hear what the monster wants again" slowButton />
            </div>
          )}
        </div>
      ) : (
        round.listen && !round.visual && (
          <div className="flex justify-center">
            <SpeakerButton parts={round.listen} label="Hear it again" slowButton />
          </div>
        )
      )}

      {variant === "bubbles" ? (
        <div className="relative mx-auto h-72 w-full max-w-xl overflow-hidden rounded-blob bg-sky-soft sm:h-80">
          {options.map((o, i) => (
            <button
              key={o.id}
              type="button"
              onClick={() => choose(o)}
              aria-label={o.label}
              {...hook("correct", !!round.open || o.id === round.correct)}
              className={`tile anim-float absolute h-24 w-24 rounded-full border-4 border-white/80 bg-white/70 text-4xl sm:h-28 sm:w-28 ${optionClass(o)}`}
              style={{ left: `${8 + ((i * 29) % 70)}%`, top: `${12 + ((i * 41) % 55)}%`, animationDelay: `${i * 0.6}s` }}
            >
              {solved === o.id ? <span className="emoji">✨</span> : o.content}
            </button>
          ))}
        </div>
      ) : (
        <div
          className={
            variant === "thumbs" || variant === "drum"
              ? "flex flex-wrap justify-center gap-6"
              : variant === "row"
                ? "flex flex-nowrap justify-center gap-2 sm:gap-3"
              : variant === "list"
                ? "flex flex-col gap-3"
                : `grid gap-3 sm:gap-4 ${options.length <= 2 ? "grid-cols-2" : options.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`
          }
        >
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => choose(o)}
              aria-label={o.label}
              {...hook("correct", !!round.open || o.id === round.correct)}
              className={`tile ${variant === "row" ? "h-24 min-w-[4.5rem] px-3 text-5xl sm:h-28" : variant === "list" ? "justify-start px-5 py-4 text-2xl" : variant === "thumbs" || variant === "drum" ? "h-36 w-36 text-6xl sm:h-40 sm:w-40" : "min-h-[8rem] p-3 text-5xl"} ${optionClass(o)}`}
            >
              {o.content}
            </button>
          ))}
        </div>
      )}

      <div className="flex min-h-[64px] items-center justify-center">
        {solved && (
          <Button onClick={next} className="anim-pop" autoFocus>
            {index + 1 < rounds.length ? "Next" : "Done"} ▶
          </Button>
        )}
      </div>
    </ActivityFrame>
  );
}
