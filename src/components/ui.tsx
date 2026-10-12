import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { audio, type Part } from "@/lib/audio";
import { useProgress } from "@/lib/progress";

export function Emoji({ e, label, className = "" }: { e: string; label: string; className?: string }) {
  return (
    <span role="img" aria-label={label} className={`emoji ${className}`}>
      {e}
    </span>
  );
}

/** A picture in a soft circle. Pictures are emoji so they work offline everywhere. */
export function Picture({ emoji, label, size = "md" }: { emoji?: string; label: string; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-36 w-36 text-7xl" : size === "sm" ? "h-14 w-14 text-3xl" : "h-24 w-24 text-5xl sm:h-28 sm:w-28 sm:text-6xl";
  return (
    <span className={`flex items-center justify-center rounded-full bg-sun-soft ${box}`}>
      {emoji ? <Emoji e={emoji} label={label} /> : <span className="font-read text-2xl font-bold">{label}</span>}
    </span>
  );
}

/** Big round "hear it again" button. Never autoplays — the child taps. */
export function SpeakerButton({ parts, label = "Hear it again", size = "lg", slowButton = false, className = "" }: { parts: Part[]; label?: string; size?: "md" | "lg"; slowButton?: boolean; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const dims = size === "lg" ? "h-20 w-20 text-4xl" : "h-14 w-14 text-2xl";
  const play = async (slow?: boolean) => {
    setPlaying(true);
    await audio.play(parts, { slow });
    setPlaying(false);
  };
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button type="button" onClick={() => play()} aria-label={label} className={`flex items-center justify-center rounded-full bg-sky-dark text-white shadow-pop transition active:translate-y-1 ${dims} ${playing ? "anim-wiggle" : ""}`}>
        <Emoji e="🔊" label="" />
      </button>
      {slowButton && (
        <button type="button" onClick={() => play(true)} aria-label={`${label} slowly`} className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-soft text-2xl shadow-popsm">
          <Emoji e="🐢" label="" />
        </button>
      )}
    </span>
  );
}

export function Button({ variant = "primary", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "sky" | "mint" | "soft" }) {
  return <button type="button" className={`btn btn-${variant} ${className}`} {...rest} />;
}

export function ProgressDots({ total, done }: { total: number; done: number }) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={`${done} of ${total} done`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-3 w-3 rounded-full transition ${i < done ? "bg-mint-dark" : i === done ? "bg-coral" : "bg-ink/15"}`} />
      ))}
    </div>
  );
}

/** App top bar: home + mute toggle, always in the same place. */
export function TopBar({ title, back = "/", right }: { title?: string; back?: string; right?: ReactNode }) {
  const { settings, updateSettings } = useProgress();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-cream/90 px-4 py-3 backdrop-blur">
      <Link to={back} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-popsm" aria-label={back === "/" ? "Home" : "Back"}>
        <Emoji e={back === "/" ? "🏠" : "⬅️"} label="" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate font-display text-xl font-semibold sm:text-2xl">{title}</h1>
      {right}
      <button
        type="button"
        onClick={() => { audio.stop(); updateSettings({ muted: !settings.muted }); }}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-popsm"
        aria-label={settings.muted ? "Turn sound on" : "Turn sound off"}
        aria-pressed={settings.muted}
      >
        <Emoji e={settings.muted ? "🔇" : "🔊"} label="" />
      </button>
    </header>
  );
}

/** Keeps the engine's settings in sync with the user's settings. */
export function useAudioSettings() {
  const { settings } = useProgress();
  useEffect(() => {
    audio.settings = { accent: settings.accent, volume: settings.volume, muted: settings.muted, slow: settings.slow, soundEffects: settings.soundEffects };
  }, [settings]);
}
