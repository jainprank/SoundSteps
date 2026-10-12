import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LESSON_BY_ID, LEVELS, levelLessons, type Lesson } from "@/content/curriculum";
import { GROUPS } from "@/content/correspondences";
import type { Accent } from "@/content/types";
import { readJSON, remove, writeJSON } from "./storage";

// Progress lives only on this device (localStorage). Nothing is ever sent anywhere.

export interface Settings {
  accent: Accent;
  volume: number;
  muted: boolean;
  slow: boolean;
  captions: boolean;
  voiceInstructions: boolean;
  soundEffects: boolean;
  motion: "system" | "reduce" | "full";
  saveProgress: boolean;
  unlockAll: boolean;
}

export interface LessonResult {
  /** best first-try score 0..1 */
  best: number;
  at: number;
  passed: boolean;
}

export interface Progress {
  completed: Record<string, LessonResult>;
  /** recently practised correspondences, newest first */
  recent: string[];
  /** per item (e.g. "ph:s", "w:cat") counts, for review games */
  items: Record<string, [right: number, wrong: number]>;
  lastLesson?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  accent: "in",
  volume: 0.9,
  muted: false,
  slow: false,
  captions: true,
  voiceInstructions: true,
  soundEffects: true,
  motion: "system",
  saveProgress: true,
  unlockAll: false,
};

const EMPTY: Progress = { completed: {}, recent: [], items: {} };
const SETTINGS_KEY = "soundsteps:v1:settings";
const PROGRESS_KEY = "soundsteps:v1:progress";

export const MASTERY_PASS = 0.7;

interface Ctx {
  settings: Settings;
  progress: Progress;
  updateSettings: (patch: Partial<Settings>) => void;
  recordLesson: (lessonId: string, score: number) => LessonResult;
  recordItem: (item: string, correct: boolean) => void;
  practised: (corrs: string[]) => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => readJSON(SETTINGS_KEY, DEFAULT_SETTINGS));
  const [progress, setProgress] = useState<Progress>(() =>
    readJSON<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS).saveProgress ? readJSON(PROGRESS_KEY, EMPTY) : EMPTY,
  );

  useEffect(() => writeJSON(SETTINGS_KEY, settings), [settings]);
  useEffect(() => {
    if (settings.saveProgress) writeJSON(PROGRESS_KEY, progress);
    else remove(PROGRESS_KEY);
  }, [progress, settings.saveProgress]);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const recordLesson = useCallback((lessonId: string, score: number) => {
    const lesson = LESSON_BY_ID[lessonId];
    const passed = lesson?.kind === "mastery" || lesson?.kind === "check" ? score >= MASTERY_PASS : true;
    let result: LessonResult = { best: score, at: Date.now(), passed };
    setProgress((p) => {
      const prev = p.completed[lessonId];
      result = { best: Math.max(prev?.best ?? 0, score), at: Date.now(), passed: passed || !!prev?.passed };
      return { ...p, completed: { ...p.completed, [lessonId]: result }, lastLesson: lessonId };
    });
    return result;
  }, []);

  const recordItem = useCallback((item: string, correct: boolean) => {
    setProgress((p) => {
      const [r, w] = p.items[item] ?? [0, 0];
      return { ...p, items: { ...p.items, [item]: correct ? [r + 1, w] : [r, w + 1] } };
    });
  }, []);

  const practised = useCallback((corrs: string[]) => {
    setProgress((p) => ({ ...p, recent: [...new Set([...corrs, ...p.recent])].slice(0, 24) }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(EMPTY);
    remove(PROGRESS_KEY);
  }, []);

  const value = useMemo(
    () => ({ settings, progress, updateSettings, recordLesson, recordItem, practised, resetProgress }),
    [settings, progress, updateSettings, recordLesson, recordItem, practised, resetProgress],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress outside provider");
  return ctx;
}

// ── derived state ────────────────────────────────────────────────────

export type LevelState = "locked" | "available" | "completed";

export function levelState(levelId: number, progress: Progress, settings: Settings): LevelState {
  const level = LEVELS[levelId];
  if (progress.completed[level.mastery.id]?.passed) return "completed";
  if (levelId <= 1 || settings.unlockAll) return "available";
  const prev = LEVELS[levelId - 1];
  return progress.completed[prev.mastery.id]?.passed ? "available" : "locked";
}

export function lessonDone(lesson: Lesson, progress: Progress) {
  return !!progress.completed[lesson.id];
}

/** The next lesson to suggest: first unfinished, non-optional lesson in an open level. */
export function nextLesson(progress: Progress, settings: Settings): Lesson | null {
  for (const level of LEVELS) {
    const state = levelState(level.id, progress, settings);
    if (state === "locked") continue;
    if (state === "completed") continue;
    const todo = levelLessons(level).find((l) => !l.optional && !(progress.completed[l.id]?.passed));
    if (todo) return todo;
  }
  return null;
}

/** Correspondences the child has met, for games and review. Falls back to the first group. */
export function taughtCorrs(progress: Progress): string[] {
  const set = new Set<string>();
  for (const id of Object.keys(progress.completed)) LESSON_BY_ID[id]?.taught.forEach((c) => set.add(c));
  return set.size >= 4 ? [...set] : GROUPS[0].corrs;
}

export function taughtTricky(progress: Progress): string[] {
  const set = new Set<string>();
  for (const id of Object.keys(progress.completed)) LESSON_BY_ID[id]?.trickyTaught.forEach((c) => set.add(c));
  return [...set];
}

export function hasAnyProgress(progress: Progress) {
  return Object.keys(progress.completed).length > 0;
}
