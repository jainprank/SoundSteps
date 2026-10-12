import { useEffect } from "react";
import { audio } from "@/lib/audio";
import { K } from "@/content/audioKeys";
import type { PhraseId } from "@/content/phrases";
import { Guide } from "./Guide";
import { Button } from "./ui";
import { hook } from "@/lib/testHooks";

const COLORS = ["#ff8a5c", "#7cc6fe", "#7fd8be", "#ffd166", "#b8a1ff", "#ff9fb8"];

export function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: COLORS[i % COLORS.length],
            animation: `confetti-fall ${2.2 + (i % 5) * 0.4}s ${(i % 7) * 0.15}s ease-in forwards`,
            transform: "translateY(-10vh)",
          }}
        />
      ))}
    </div>
  );
}

export function Celebration({ title, phrase, stars, children, onNext, nextLabel = "Keep going", onAgain }: {
  title: string;
  phrase: PhraseId;
  stars?: number;
  children?: React.ReactNode;
  onNext: () => void;
  nextLabel?: string;
  onAgain?: () => void;
}) {
  useEffect(() => {
    void audio.play([{ sfx: "cheer" }, K.phrase(phrase)]);
  }, [phrase]);
  return (
    <section className="anim-pop mx-auto flex max-w-lg flex-col items-center gap-5 px-4 py-8 text-center" {...hook("celebration", phrase)}>
      <Confetti />
      <Guide mood="cheer" size={140} />
      <h2 className="font-display text-4xl font-semibold">{title}</h2>
      {stars !== undefined && (
        <p className="text-5xl" aria-label={`${stars} of 3 stars`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`emoji ${i < stars ? "" : "opacity-20 grayscale"}`} aria-hidden="true">⭐</span>
          ))}
        </p>
      )}
      {children}
      <div className="flex flex-wrap justify-center gap-3">
        {onAgain && <Button variant="soft" onClick={onAgain}>Play again</Button>}
        <Button onClick={onNext} autoFocus>{nextLabel} ▶</Button>
      </div>
    </section>
  );
}
