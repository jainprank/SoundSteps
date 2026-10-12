// In-session adaptive difficulty. Kept in memory only (never stored or sent).
// - After a run of first-try successes we offer more choices.
// - After a miss we offer fewer choices and revisit that item soon.

const streak = { right: 0, wrong: 0 };
const missed = new Map<string, number>();

export function noteResult(item: string, firstTry: boolean) {
  if (firstTry) {
    streak.right++;
    streak.wrong = 0;
    const m = missed.get(item);
    if (m) m > 1 ? missed.set(item, m - 1) : missed.delete(item);
  } else {
    streak.wrong++;
    streak.right = 0;
    missed.set(item, (missed.get(item) ?? 0) + 2);
  }
}

/** Number of answer choices to show, between min and max. */
export function choiceCount(base = 3, min = 2, max = 4) {
  if (streak.wrong >= 2) return min;
  if (streak.right >= 4) return max;
  return Math.max(min, Math.min(max, base));
}

/** Order items so recently missed ones come back first, the rest shuffled. */
export function prioritise<T>(items: T[], keyOf: (t: T) => string): T[] {
  const shuffled = shuffle(items);
  return shuffled.sort((a, b) => (missed.get(keyOf(b)) ?? 0) - (missed.get(keyOf(a)) ?? 0));
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
