import { Link, useParams } from "react-router-dom";
import { LEVELS, type Lesson } from "@/content/curriculum";
import { K } from "@/content/audioKeys";
import { audio } from "@/lib/audio";
import { levelState, nextLesson, useProgress } from "@/lib/progress";
import { Guide } from "@/components/Guide";
import { Emoji, TopBar } from "@/components/ui";
import { NotFound } from "./NotFound";

export function LevelPage() {
  const { id = "" } = useParams();
  const level = LEVELS[Number(id)];
  const { progress, settings } = useProgress();
  if (!level || !/^\d+$/.test(id)) return <NotFound />;
  const state = levelState(level.id, progress, settings);
  const next = nextLesson(progress, settings);

  const card = (l: Lesson) => {
    const res = progress.completed[l.id];
    const isNext = next?.id === l.id;
    const badge = res ? (l.kind === "lesson" || l.kind === "challenge" || res.passed ? "✅" : "🔁") : isNext ? "👉" : "";
    return (
      <li key={l.id}>
        <Link
          to={`/lesson/${l.id}`}
          className={`flex h-full flex-col items-center gap-2 rounded-blob p-4 text-center shadow-pop transition hover:-translate-y-0.5 ${isNext ? "bg-sun-soft ring-4 ring-sun" : res ? "bg-mint-soft" : "bg-white"}`}
          aria-label={`${l.title}${res ? ", done" : ""}${isNext ? ", next up" : ""}${l.optional ? ", optional challenge" : ""}`}
        >
          <span className={`flex h-16 min-w-[4rem] items-center justify-center rounded-2xl px-2 ${l.icon.length <= 3 && /^[a-z-]+$/.test(l.icon) ? "bg-cream font-read text-4xl font-bold" : "emoji text-4xl"}`}>{l.icon}</span>
          <span className="font-display text-lg leading-tight">{l.title}</span>
          <span className="text-sm">{badge} {l.kind === "check" ? "Review" : l.kind === "challenge" ? "Bonus" : ""}</span>
        </Link>
      </li>
    );
  };

  return (
    <>
      <TopBar title={`Level ${level.id}: ${level.title}`} />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-28">
        <section className="card flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
          <Guide size={96} onClick={() => void audio.play([K.levelIntro(level.id)])} label="Pip: hear about this level" />
          <div className="flex-1">
            <p className="font-display text-2xl">{level.intro}</p>
            <p className="mt-1 text-lg text-ink/70">Goal: {level.goal}</p>
          </div>
          <button type="button" onClick={() => void audio.play([K.levelIntro(level.id)])} className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-dark text-3xl text-white shadow-pop" aria-label="Hear about this level">
            <Emoji e="🔊" label="" />
          </button>
        </section>

        {state === "locked" ? (
          <section className="card flex flex-col items-center gap-3 p-8 text-center">
            <span className="emoji text-6xl">🔒</span>
            <p className="font-display text-2xl">Finish level {level.id - 1} to open this level.</p>
            <p className="text-lg">Already reading? A grown-up can open every level in <Link className="underline" to="/grown-ups#settings">settings</Link>.</p>
            <Link className="btn btn-primary" to={`/level/${level.id - 1}`}>Go to level {level.id - 1}</Link>
          </section>
        ) : (
          <>
            {level.units.map((u) => (
              <section key={u.title} aria-label={u.title}>
                <h2 className="mb-3 font-display text-2xl">{u.title}</h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">{u.lessons.map(card)}</ul>
              </section>
            ))}
            <section aria-label="Level check">
              <h2 className="mb-3 font-display text-2xl">Level check</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">{card(level.mastery)}</ul>
              <p className="mt-2 text-base text-ink/60">The level check is a friendly game, not a test. Passing it opens the next level.</p>
            </section>
          </>
        )}
      </main>
    </>
  );
}
