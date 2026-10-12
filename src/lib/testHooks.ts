// Development-only markers that let the end-to-end walker (e2e/walkthrough.spec.ts)
// play every lesson. They are stripped from production builds.

export const TEST_HOOKS = import.meta.env.DEV;

export function hook(name: string, value: string | number | boolean): Record<string, string> {
  return TEST_HOOKS ? { [`data-${name}`]: String(value) } : {};
}

/** Tests set window.__SOUNDSTEPS_FAST__ to skip audio waits. */
export function fastMode(): boolean {
  return TEST_HOOKS && typeof window !== "undefined" && !!(window as unknown as { __SOUNDSTEPS_FAST__?: boolean }).__SOUNDSTEPS_FAST__;
}
