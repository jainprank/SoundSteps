import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { STORIES, STORY_BY_ID } from "@/content/reading";
import type { Step } from "@/content/curriculum";
import { GAMES, GAME_BY_ID, dailyChallenge } from "@/lib/games";
import { taughtCorrs, taughtTricky, useProgress } from "@/lib/progress";
import type { ActivityCtx } from "@/activities/framework";
import { Celebration } from "@/components/Celebration";
import { Button, TopBar } from "@/components/ui";
import { Guide } from "@/components/Guide";
import { CHILD_NAME } from "@/content/child";
import { K } from "@/content/audioKeys";
import type { PhraseId } from "@/content/phrases";
import { audio } from "@/lib/audio";
import { StepRunner } from "./LessonPage";
import { NotFound } from "./NotFound";

function useCtx(): ActivityCtx {
  const { progress } = useProgress();
  return useMemo(() => ({ taught: taughtCorrs(progress), tricky: taughtTricky(progress), mode: "game" }), [progress]);
}

export function Games() {
  const ctx = useCtx();
  return (
    <>
      <TopBar title="Play a Game" />
      <main className="mx-auto max-w-4xl px-4 pb-28">
        <p className="mb-4 text-lg">Games use the sounds you have already learned.</p>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {GAMES.map((g) => {
            const ready = !!g.build(ctx.taught, ctx.tricky);
            return (
              <li key={g.id}>
                {ready ? (
                  <Link to={`/games/${g.id}`} className="card flex h-full flex-col items-center gap-2 p-5 text-center transition hover:-translate-y-0.5">
                    <span className="emoji text-6xl">{g.emoji}</span>
                    <span className="font-display text-xl">{g.title}</span>
                    <span className="text-base text-ink/70">{g.blurb}</span>
                  </Link>
                ) : (
                  <div className="flex h-full flex-col items-center gap-2 rounded-blob bg-white/50 p-5 text-center text-ink/50" aria-label={`${g.title}: locked. ${g.needs}.`}>
                    <span className="emoji text-6xl grayscale">{g.emoji}</span>
                    <span className="font-display text-xl">{g.title}</span>
                    <span className="text-base">🔒 {g.needs}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}

/** A short hello from Pip before an activity starts. */
function Greeting({ phrase, text, onStart }: { phrase: PhraseId; text: string; onStart: () => void }) {
  useEffect(() => {
    void audio.play([K.phrase(phrase)]);
    return () => audio.stop();
  }, [phrase]);
  return (
    <main className="anim-pop mx-auto flex max-w-lg flex-col items-center gap-5 px-4 py-10 text-center">
      <Guide size={140} onClick={() => void audio.play([K.phrase(phrase)])} label="Pip: hear the greeting again" />
      <p className="font-display text-3xl">{text}</p>
      <Button onClick={onStart} autoFocus>Let's go! ▶</Button>
    </main>
  );
}

function Runner({ title, back, make, greeting }: { title: string; back: string; make: () => Step[] | null; greeting?: { phrase: PhraseId; text: string } }) {
  const ctx = useCtx();
  const navigate = useNavigate();
  const [run, setRun] = useState(0);
  const [started, setStarted] = useState(!greeting);
  const steps = useMemo(make, [run]); // eslint-disable-line react-hooks/exhaustive-deps
  const [score, setScore] = useState<number | null>(null);
  if (!steps) {
    return (
      <>
        <TopBar title={title} back={back} />
        <p className="p-8 text-center text-xl">This game opens after a few more lessons. <Link className="underline" to="/">Keep learning</Link></p>
      </>
    );
  }
  if (score !== null) {
    return (
      <>
        <TopBar title={title} back={back} />
        <Celebration title={`Great playing, ${CHILD_NAME}!`} phrase="lesson-done" stars={score >= 0.9 ? 3 : score >= 0.6 ? 2 : 1} onAgain={() => { setScore(null); setRun(run + 1); }} nextLabel="Done" onNext={() => navigate(back)} />
      </>
    );
  }
  if (!started && greeting) {
    return (
      <>
        <TopBar title={title} back={back} />
        <Greeting phrase={greeting.phrase} text={greeting.text} onStart={() => setStarted(true)} />
      </>
    );
  }
  return (
    <>
      <TopBar title={title} back={back} />
      <StepRunner key={run} steps={steps} ctx={ctx} onFinish={setScore} />
    </>
  );
}

export function GamePage() {
  const { id = "" } = useParams();
  const game = GAME_BY_ID[id];
  const { progress } = useProgress();
  if (!game) return <NotFound />;
  return (
    <Runner title={game.title} back="/games" make={() => {
      const s = game.build(taughtCorrs(progress), taughtTricky(progress));
      return s ? [s] : null;
    }} />
  );
}

export function Daily() {
  const { progress } = useProgress();
  return <Runner title="Daily Challenge" back="/" greeting={{ phrase: "daily-hello", text: `Hello ${CHILD_NAME}! Here's today's little challenge.` }} make={() => dailyChallenge(taughtCorrs(progress), taughtTricky(progress), progress.recent)} />;
}

export function Stories() {
  return (
    <>
      <TopBar title="Read a Story" />
      <main className="mx-auto max-w-4xl px-4 pb-28">
        <p className="mb-4 text-lg">Stories use sounds from the learning path. Look for the level badge to pick one that fits.</p>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STORIES.map((s) => (
            <li key={s.id}>
              <Link to={`/stories/${s.id}`} className="card flex h-full flex-col items-center gap-2 p-5 text-center transition hover:-translate-y-0.5">
                <span className="emoji text-6xl">{s.cover}</span>
                <span className="font-display text-xl leading-tight">{s.title}</span>
                <span className="rounded-full bg-sky-soft px-3 py-0.5 text-sm">Level {s.level} · {s.kind === "information" ? "Facts" : "Story"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

export function StoryPage() {
  const { id = "" } = useParams();
  const story = STORY_BY_ID[id];
  if (!story) return <NotFound />;
  return <Runner title={story.title} back="/stories" make={() => [{ type: "story", story: story.id, questions: true }]} />;
}

