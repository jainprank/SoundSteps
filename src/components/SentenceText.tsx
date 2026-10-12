import { K } from "@/content/audioKeys";
import { splitWords } from "@/content/reading";
import { audio } from "@/lib/audio";

/** A sentence where every word can be tapped to hear it. `active` highlights a word during narration. */
export function SentenceText({ text, active = -1, size = "lg", tappable = true, highlight }: {
  text: string;
  active?: number;
  size?: "md" | "lg";
  tappable?: boolean;
  highlight?: (bare: string, i: number) => boolean;
}) {
  const words = splitWords(text);
  const cls = size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  return (
    <p className={`flex flex-wrap justify-center gap-x-3 gap-y-2 font-read font-bold leading-snug ${cls}`}>
      {words.map((w, i) => {
        const on = i === active;
        const marked = highlight?.(w.bare, i);
        const style = `rounded-xl px-1.5 transition ${on ? "bg-sun" : marked ? "bg-lilac-soft ring-4 ring-lilac" : ""}`;
        return tappable ? (
          <button key={i} type="button" className={`${style} hover:bg-sun-soft`} onClick={() => void audio.play([K.word(w.bare)])} aria-label={`hear ${w.bare}`}>
            {w.display}
          </button>
        ) : (
          <span key={i} className={style}>{w.display}</span>
        );
      })}
    </p>
  );
}
