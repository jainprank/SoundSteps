import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";
import { useProgress } from "@/lib/progress";

/** Shows what is being said, for children who are hard of hearing and for grown-ups. */
export function Captions() {
  const { settings } = useProgress();
  const [state, setState] = useState<{ caption: string | null; playing: boolean }>({ caption: null, playing: false });
  useEffect(() => audio.subscribe(setState), []);
  if (!settings.captions || !state.caption) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-4" aria-live="polite">
      <p className={`max-w-xl rounded-2xl bg-ink/85 px-4 py-2 text-center text-lg text-white shadow-lg transition-opacity ${state.playing ? "opacity-100" : "opacity-60"}`}>
        {state.caption}
      </p>
    </div>
  );
}
