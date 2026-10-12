import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";

// Pip the fox: the friendly guide. Moods change her face; her mouth moves
// while audio is playing so children connect the voice with the guide.

export type Mood = "happy" | "cheer" | "think";

export function Guide({ mood = "happy", size = 96, className = "", onClick, label = "Pip the fox" }: { mood?: Mood; size?: number; className?: string; onClick?: () => void; label?: string }) {
  const [talking, setTalking] = useState(false);
  useEffect(() => audio.subscribe((s) => setTalking(s.playing)), []);
  const svg = (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true" className="anim-bob">
      {/* ears */}
      <path d="M22 18 L44 46 L18 54 Z" fill="#ff8a5c" stroke="#2b2340" strokeWidth="3" strokeLinejoin="round" />
      <path d="M98 18 L76 46 L102 54 Z" fill="#ff8a5c" stroke="#2b2340" strokeWidth="3" strokeLinejoin="round" />
      <path d="M26 27 L38 44 L24 49 Z" fill="#ffd9c7" />
      <path d="M94 27 L82 44 L96 49 Z" fill="#ffd9c7" />
      {/* head */}
      <path d="M14 52 Q60 22 106 52 Q104 92 60 106 Q16 92 14 52 Z" fill="#ff8a5c" stroke="#2b2340" strokeWidth="3" strokeLinejoin="round" />
      {/* white cheeks */}
      <path d="M22 66 Q40 70 52 86 Q60 100 60 104 Q30 96 22 66 Z" fill="#fff8ef" />
      <path d="M98 66 Q80 70 68 86 Q60 100 60 104 Q90 96 98 66 Z" fill="#fff8ef" />
      {/* eyes */}
      {mood === "cheer" ? (
        <>
          <path d="M38 62 Q44 54 50 62" fill="none" stroke="#2b2340" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 62 Q76 54 82 62" fill="none" stroke="#2b2340" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="44" cy="62" rx="5" ry={mood === "think" ? 4 : 6} fill="#2b2340" />
          <ellipse cx="76" cy="62" rx="5" ry={mood === "think" ? 4 : 6} fill="#2b2340" />
          <circle cx="46" cy="60" r="1.6" fill="#fff" />
          <circle cx="78" cy="60" r="1.6" fill="#fff" />
        </>
      )}
      {/* nose */}
      <ellipse cx="60" cy="80" rx="6" ry="4.5" fill="#2b2340" />
      {/* mouth */}
      <g className={talking ? "anim-talk" : ""}>
        {mood === "think" && !talking ? (
          <path d="M53 92 L67 91" stroke="#2b2340" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <path d="M50 89 Q60 99 70 89 Q60 94 50 89 Z" fill="#a8264b" stroke="#2b2340" strokeWidth="2.5" strokeLinejoin="round" />
        )}
      </g>
      {/* rosy cheeks */}
      <circle cx="34" cy="76" r="5" fill="#ff9fb8" opacity="0.7" />
      <circle cx="86" cy="76" r="5" fill="#ff9fb8" opacity="0.7" />
    </svg>
  );
  if (!onClick) return <span className={className} role="img" aria-label={label}>{svg}</span>;
  return (
    <button type="button" onClick={onClick} className={`rounded-full ${className}`} aria-label={label}>
      {svg}
    </button>
  );
}
