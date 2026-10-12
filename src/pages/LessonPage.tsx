import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LESSON_BY_ID, LEVELS, levelLessons, type Step } from "@/content/curriculum";
import { K } from "@/content/audioKeys";
import { Activity } from "@/activities";
import type { ActivityCtx, ActivityResult } from "@/activities/framework";
import { audio } from "@/lib/audio";
import { MASTERY_PASS, levelState, taughtCorrs, taughtTricky, useProgress } from "@/lib/progress";
import { Celebration } from "@/components/Celebration";
import { Button, TopBar } from "@/components/ui";
import { NotFound } from "./NotFound";

/** Runs a list of activity steps, then celebrates. Used by lessons, games and the daily challenge. */
export function StepRunner({ steps, ctx, onFinish }: { steps: Step[]; ctx: ActivityCtx; onFinish: (score: number) => void }) {
  const [i, setI] = useState(0);
  const total = useRef<ActivityResult>({ correct: 0, total: 0 });
  useEffect(() => { window.scrollTo({ top: 0 }); }, [i]);
  const done = (r: ActivityResult) => {
    total.current = { correct: total.current.correct + r.correct, total: total.current.total + r.total };
    audio.stop();
    if (i + 1 < steps.length) setI(i + 1);
    else onFinish(total.current.total ? total.current.correct / total.current.total : 1);
  };
  return (
    <div className="flex flex-col gap-2">
      {steps.length > 1 && (
        <div className="mx-auto flex w-full max-w-3xl gap-1.5 px-4" aria-label={`Part ${i + 1} of ${steps.length}`}>
          {steps.map((_, k) => <span key={k} className={`h-2 flex-1 rounded-full ${k < i ? "bg-mint-dark" : k === i ? "bg-coral" : "bg-ink/10"}`} />)}
        </div>
      )}
      <Activity key={i} step={steps[i]} ctx={ctx} onDone={done} />
    </div>
  );
}

export function LessonPage() {
  const { id = "" } = useParams();
  const lesson = LESSON_BY_ID[id];
  const navigate = useNavigate();
  const { progress, settings, recordLesson } = useProgress();
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [run, setRun] = useState(0);
  const ctx = useMemo<ActivityCtx>(() => ({
    taught: lesson ? lesson.taught : taughtCorrs(progress),
    tricky: lesson ? lesson.trickyTaught : taughtTricky(progress),
    mode: lesson?.kind === "mastery" || lesson?.kind === "check" ? "check" : "lesson",
  }), [lesson]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lesson) return <NotFound />;
  const level = LEVELS[lesson.level];
  if (levelState(level.id, progress, settings) === "locked") {
    return (
      <>
        <TopBar title={lesson.title} back={`/level/${level.id}`} />
        <p className="p-8 text-center text-xl">This lesson opens after the level before it. <Link className="underline" to="/">Go home</Link></p>
      </>
    );
  }

  const lessons = levelLessons(level);
  const next = lessons[lessons.indexOf(lesson) + 1];
  const isCheck = lesson.kind === "mastery" || lesson.kind === "check";

  const finish = (score: number) => {
    const r = recordLesson(lesson.id, score);
    setResult({ score, passed: isCheck ? score >= MASTERY_PASS : r.passed });
  };

  if (result) {
    const stars = result.score >= 0.9 ? 3 : result.score >= 0.6 ? 2 : 1;
    const levelDone = lesson.kind === "mastery" && result.passed;
    if (isCheck && !result.passed) {
      return (
        <>
          <TopBar title={lesson.title} back={`/level/${level.id}`} />
          <Celebration title="Good work!" phrase="check-practise" onAgain={() => { setResult(null); setRun(run + 1); }} nextLabel="Back to the level" onNext={() => navigate(`/level/${level.id}`)}>
            <p className="max-w-sm text-lg">Practising makes sounds stronger. Try the activities again, then have another go!</p>
          </Celebration>
        </>
      );
    }
    return (
      <>
        <TopBar title={lesson.title} back={`/level/${level.id}`} />
        <Celebration
          title={levelDone ? `${level.title} complete!` : "You did it!"}
          phrase={levelDone ? "level-done" : isCheck ? "check-pass" : "lesson-done"}
          stars={stars}
          onAgain={() => { setResult(null); setRun(run + 1); }}
          nextLabel={levelDone ? (LEVELS[level.id + 1] ? "Next level" : "Home") : next ? "Next lesson" : "Back to the level"}
          onNext={() => navigate(levelDone ? (LEVELS[level.id + 1] ? `/level/${level.id + 1}` : "/") : next ? `/lesson/${next.id}` : `/level/${level.id}`)}
        />
      </>
    );
  }

  return (
    <>
      <TopBar title={lesson.title} back={`/level/${level.id}`} />
      <StepRunner key={`${lesson.id}-${run}`} steps={lesson.steps} ctx={ctx} onFinish={finish} />
    </>
  );
}

export function LevelIntroButton({ level }: { level: number }) {
  return (
    <Button variant="soft" onClick={() => void audio.play([K.levelIntro(level)])}>
      🔊 Hear about this level
    </Button>
  );
}
