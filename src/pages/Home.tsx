import { Link, useNavigate } from "react-router-dom";
import { LEVELS, levelLessons } from "@/content/curriculum";
import { K } from "@/content/audioKeys";
import { CHILD_NAME } from "@/content/child";
import { audio } from "@/lib/audio";
import { hasAnyProgress, levelState, nextLesson, useProgress } from "@/lib/progress";
import { Guide } from "@/components/Guide";
import { Emoji } from "@/components/ui";

const COLOR: Record<string, string> = {
  coral: "bg-coral-soft border-coral",
  sky: "bg-sky-soft border-sky",
  mint: "bg-mint-soft border-mint",
  sun: "bg-sun-soft border-sun",
  lilac: "bg-lilac-soft border-lilac",
  rose: "bg-rose-soft border-rose",
};

export function Home() {
  const { progress, settings, updateSettings } = useProgress();
  const navigate = useNavigate();
  const next = nextLesson(progress, settings);
  const started = hasAnyProgress(progress);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pb-28 pt-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex w-full items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => { audio.stop(); updateSettings({ muted: !settings.muted }); }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-popsm"
            aria-label={settings.muted ? "Turn sound on" : "Turn sound off"}
            aria-pressed={settings.muted}
          >
            <Emoji e={settings.muted ? "🔇" : "🔊"} label="" />
          </button>
          <Link to="/grown-ups" className="rounded-full bg-white px-4 py-3 font-display text-base shadow-popsm">For grown-ups</Link>
        </div>
        <Guide size={130} onClick={() => void audio.play([K.phrase("welcome")])} label="Pip the fox says hello. Tap to hear." />
        <p className="font-display text-3xl">Hi {CHILD_NAME}! 👋</p>
        <h1 className="font-display text-5xl font-semibold text-coral-dark sm:text-6xl">SoundSteps</h1>
        <p className="font-display text-xl sm:text-2xl">Hear it. Say it. Blend it. Read it!</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {started && next ? (
            <>
              <button type="button" className="btn btn-primary px-8 text-2xl" onClick={() => navigate(`/lesson/${next.id}`)}>
                <Emoji e="▶️" label="" /> Continue: {next.title}
              </button>
              <Link to="/level/0" className="btn btn-soft">Start from the beginning</Link>
            </>
          ) : (
            <button type="button" className="btn btn-primary px-10 text-2xl" onClick={() => navigate(next ? `/lesson/${next.id}` : "/level/0")}>
              <Emoji e="🚀" label="" /> Start Learning
            </button>
          )}
        </div>
      </header>

      <section aria-labelledby="path-title">
        <h2 id="path-title" className="mb-4 font-display text-3xl">My learning path</h2>
        <ol className="relative flex flex-col gap-4">
          {LEVELS.map((level, i) => {
            const state = levelState(level.id, progress, settings);
            const lessons = levelLessons(level);
            const done = lessons.filter((l) => progress.completed[l.id]).length;
            const offset = ["sm:ml-0", "sm:ml-16", "sm:ml-32", "sm:ml-16"][i % 4];
            return (
              <li key={level.id} className={offset}>
                <Link
                  to={`/level/${level.id}`}
                  className={`flex items-center gap-4 rounded-blob border-4 p-4 shadow-pop transition hover:-translate-y-0.5 sm:max-w-xl ${state === "locked" ? "border-ink/10 bg-white/50 text-ink/50" : COLOR[level.color]}`}
                  aria-label={`Level ${level.id}: ${level.title}. ${state === "locked" ? "Locked" : state === "completed" ? "Completed" : `${done} of ${lessons.length} lessons done`}`}
                >
                  <span className={`emoji flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-4xl ${state === "locked" ? "grayscale" : ""}`}>
                    {state === "locked" ? "🔒" : state === "completed" ? "🏆" : level.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm uppercase tracking-wide opacity-70">Level {level.id}</span>
                    <span className="block font-display text-2xl font-semibold">{level.title}</span>
                    {state !== "locked" && (
                      <span className="mt-1 block h-2 w-full overflow-hidden rounded-full bg-white">
                        <span className="block h-full rounded-full bg-mint-dark" style={{ width: `${(done / lessons.length) * 100}%` }} />
                      </span>
                    )}
                  </span>
                  {next?.level === level.id && <span className="emoji anim-bob text-3xl" aria-hidden="true">🦊</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link to="/games" className="card flex flex-col items-center gap-2 p-6 text-center transition hover:-translate-y-0.5">
          <span className="emoji text-6xl">🎮</span>
          <span className="font-display text-2xl">Play a Game</span>
        </Link>
        <Link to="/stories" className="card flex flex-col items-center gap-2 p-6 text-center transition hover:-translate-y-0.5">
          <span className="emoji text-6xl">📚</span>
          <span className="font-display text-2xl">Read a Story</span>
        </Link>
        <Link to="/daily" className="card flex flex-col items-center gap-2 p-6 text-center transition hover:-translate-y-0.5">
          <span className="emoji text-6xl">🌞</span>
          <span className="font-display text-2xl">Daily Challenge</span>
        </Link>
      </section>

      <section className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-center">
        <span className="emoji text-5xl">👨‍👩‍👧</span>
        <div className="flex-1">
          <h2 className="font-display text-2xl">Grown-ups: how SoundSteps works</h2>
          <p className="text-lg">Free, no sign-up, no ads. Progress stays on this device. Read the learning guide and change sound settings.</p>
        </div>
        <Link to="/grown-ups" className="btn btn-sky">Learning guide</Link>
      </section>
    </main>
  );
}
