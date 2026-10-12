import type { Word } from "@/content/types";

// Shows a word as its spelling units (sh-i-p), with optional highlighting.
// Letters that work together (sh, igh, a-e) share one tile, so children see
// "one sound, one tile". Silent letters are shown faded.

export function WordTiles({
  word,
  active = -1,
  highlight,
  spaced = true,
  size = "lg",
  onTileClick,
  together = false,
}: {
  word: Word;
  active?: number;
  highlight?: (tokenIndex: number) => boolean;
  spaced?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  onTileClick?: (i: number) => void;
  together?: boolean;
}) {
  const text = size === "xl" ? "text-6xl sm:text-7xl" : size === "lg" ? "text-5xl sm:text-6xl" : size === "md" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  return (
    <div className={`flex ${size === "sm" ? "flex-nowrap" : "flex-wrap"} items-end justify-center transition-all duration-700 ${together ? "gap-0" : spaced ? "gap-2 sm:gap-3" : "gap-0.5"}`} aria-label={word.text}>
      {word.tokens.map((t, i) => {
        const silent = t.c === "_";
        const on = i === active || highlight?.(i);
        const cls = `font-read font-bold ${text} rounded-2xl ${size === "sm" ? "px-0.5" : "px-2"} pb-1 transition ${
          on ? "bg-sun text-ink scale-110" : silent ? "text-ink/35" : "text-ink"
        } ${!together && spaced ? "bg-white shadow-popsm" : ""} ${on && !together ? "bg-sun" : ""}`;
        const content = <span aria-hidden="true">{t.g}</span>;
        return onTileClick && !silent ? (
          <button key={i} type="button" onClick={() => onTileClick(i)} className={`${cls} min-w-[3.5rem]`} aria-label={`sound ${i + 1}: ${t.g}`}>
            {content}
          </button>
        ) : (
          <span key={i} className={cls}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
