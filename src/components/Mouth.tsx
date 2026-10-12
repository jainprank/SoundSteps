import type { MouthShape } from "@/content/types";

// Simple front-on mouth pictures for articulation tips.

const LABEL: Record<MouthShape, string> = {
  "lips-closed": "Lips pressed together",
  "lip-teeth": "Top teeth on bottom lip",
  "tongue-teeth": "Tongue tip between teeth",
  "tongue-ridge": "Tongue tip up behind top teeth",
  open: "Mouth open wide",
  smile: "Wide smile",
  round: "Lips in a small circle",
  back: "Back of tongue lifted",
  breath: "Open mouth, breathing out",
  pout: "Lips pushed forward",
};

export function Mouth({ shape, size = 120 }: { shape: MouthShape; size?: number }) {
  const lips = "#e0607e";
  const inside = "#5a1f33";
  const teeth = "#ffffff";
  const tongue = "#ff9fb8";
  let body: JSX.Element;
  switch (shape) {
    case "lips-closed":
      body = <path d="M20 60 Q60 48 100 60 Q60 74 20 60 Z" fill={lips} />;
      break;
    case "lip-teeth":
      body = (
        <>
          <path d="M20 54 Q60 34 100 54 L100 58 Q60 50 20 58 Z" fill={lips} />
          <rect x="38" y="55" width="44" height="10" rx="3" fill={teeth} />
          <path d="M20 66 Q60 58 100 66 Q60 86 20 66 Z" fill={lips} />
        </>
      );
      break;
    case "tongue-teeth":
      body = (
        <>
          <path d="M20 56 Q60 36 100 56 Q60 92 20 56 Z" fill={inside} />
          <rect x="36" y="50" width="48" height="8" rx="3" fill={teeth} />
          <ellipse cx="60" cy="63" rx="20" ry="8" fill={tongue} />
          <rect x="36" y="68" width="48" height="6" rx="3" fill={teeth} />
          <path d="M20 56 Q60 36 100 56 Q60 46 20 56 Z M20 56 Q60 92 100 56 Q60 80 20 56 Z" fill={lips} />
        </>
      );
      break;
    case "tongue-ridge":
      body = (
        <>
          <path d="M22 56 Q60 38 98 56 Q60 86 22 56 Z" fill={inside} />
          <rect x="36" y="50" width="48" height="7" rx="3" fill={teeth} />
          <path d="M44 74 Q50 56 60 56 Q70 56 76 74 Z" fill={tongue} />
          <path d="M22 56 Q60 38 98 56 Q60 46 22 56 Z M22 56 Q60 86 98 56 Q60 76 22 56 Z" fill={lips} />
        </>
      );
      break;
    case "open":
      body = (
        <>
          <ellipse cx="60" cy="62" rx="32" ry="26" fill={inside} />
          <ellipse cx="60" cy="78" rx="18" ry="8" fill={tongue} />
          <ellipse cx="60" cy="62" rx="32" ry="26" fill="none" stroke={lips} strokeWidth="9" />
        </>
      );
      break;
    case "smile":
      body = (
        <>
          <path d="M14 54 Q60 52 106 54 Q60 84 14 54 Z" fill={inside} />
          <path d="M26 56 Q60 54 94 56 L92 62 Q60 60 28 62 Z" fill={teeth} />
          <path d="M14 54 Q60 52 106 54 Q60 84 14 54 Z" fill="none" stroke={lips} strokeWidth="8" strokeLinejoin="round" />
        </>
      );
      break;
    case "round":
      body = (
        <>
          <circle cx="60" cy="62" r="12" fill={inside} />
          <circle cx="60" cy="62" r="16" fill="none" stroke={lips} strokeWidth="12" />
        </>
      );
      break;
    case "back":
      body = (
        <>
          <ellipse cx="60" cy="62" rx="28" ry="18" fill={inside} />
          <path d="M36 72 Q60 50 84 72 Z" fill={tongue} />
          <ellipse cx="60" cy="62" rx="28" ry="18" fill="none" stroke={lips} strokeWidth="8" />
        </>
      );
      break;
    case "breath":
      body = (
        <>
          <ellipse cx="60" cy="62" rx="24" ry="18" fill={inside} />
          <ellipse cx="60" cy="62" rx="24" ry="18" fill="none" stroke={lips} strokeWidth="8" />
          <path d="M92 50 q8 -4 14 0 M94 62 q8 -4 16 0 M92 74 q8 -4 14 0" stroke="#7cc6fe" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
      break;
    case "pout":
      body = (
        <>
          <ellipse cx="60" cy="62" rx="18" ry="14" fill={inside} />
          <ellipse cx="60" cy="62" rx="22" ry="18" fill="none" stroke={lips} strokeWidth="12" />
        </>
      );
      break;
  }
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={LABEL[shape]}>
        <circle cx="60" cy="60" r="56" fill="#ffe3d6" />
        {body}
      </svg>
      <figcaption className="mt-1 text-center text-sm text-ink/70">{LABEL[shape]}</figcaption>
    </figure>
  );
}
