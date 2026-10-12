import { useEffect, type ReactElement } from "react";
import { HashRouter, Route, Routes, useLocation, useParams } from "react-router-dom";
import { ProgressProvider, useProgress } from "@/lib/progress";
import { audio } from "@/lib/audio";
import { Captions } from "@/components/Captions";
import { useAudioSettings } from "@/components/ui";
import { Home } from "@/pages/Home";
import { LevelPage } from "@/pages/LevelPage";
import { LessonPage } from "@/pages/LessonPage";
import { Daily, GamePage, Games, StoryPage, Stories } from "@/pages/Play";
import { GrownUps, SoundCheck } from "@/pages/GrownUps";
import { NotFound } from "@/pages/NotFound";

/**
 * Moving from one lesson straight to the next keeps the same route, so React would
 * reuse the screen (and its "finished" state). Keying by id gives every lesson,
 * game and story a fresh start.
 */
function Fresh({ children }: { children: ReactElement }) {
  const { id = "" } = useParams();
  return <div key={id}>{children}</div>;
}

function Shell() {
  useAudioSettings();
  const { settings } = useProgress();
  const location = useLocation();

  // stop speaking when the child leaves a screen
  useEffect(() => () => audio.stop(), [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const reduce = settings.motion === "reduce" || (settings.motion === "system" && !!mq?.matches);
      document.documentElement.dataset.motion = reduce ? "reduce" : "full";
    };
    apply();
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, [settings.motion]);

  useEffect(() => { void audio.loadManifest(); }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/level/:id" element={<LevelPage />} />
        <Route path="/lesson/:id" element={<Fresh><LessonPage /></Fresh>} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/:id" element={<Fresh><GamePage /></Fresh>} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/stories/:id" element={<Fresh><StoryPage /></Fresh>} />
        <Route path="/daily" element={<Daily />} />
        <Route path="/grown-ups" element={<GrownUps />} />
        <Route path="/grown-ups/sounds" element={<SoundCheck />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Captions />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ProgressProvider>
        <Shell />
      </ProgressProvider>
    </HashRouter>
  );
}
