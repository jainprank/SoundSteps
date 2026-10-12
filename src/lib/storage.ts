// localStorage that never throws. Private windows, blocked cookies and
// embedded previews can make storage unavailable; the app then keeps
// everything in memory for the visit and works exactly the same.

const memory = new Map<string, string>();

function store(): Storage | null {
  try {
    const s = window.localStorage;
    const probe = "__soundsteps_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

let cached: Storage | null | undefined;
function get(): Storage | null {
  if (cached === undefined) cached = typeof window === "undefined" ? null : store();
  return cached;
}

export const storageAvailable = () => get() !== null;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = get()?.getItem(key) ?? memory.get(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    get()?.setItem(key, raw);
  } catch {
    /* quota or blocked: memory copy is enough */
  }
}

export function remove(key: string) {
  memory.delete(key);
  try {
    get()?.removeItem(key);
  } catch {
    /* ignore */
  }
}
