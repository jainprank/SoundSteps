import { useRef, useState, type ReactNode } from "react";

// A tile that works three ways: tap it (then tap a box), drag it onto a box,
// or use the keyboard (Tab to it, Enter). Drop targets mark themselves with
// data-drop="<id>".

export function DragTile({ id, children, onTap, onDrop, selected, disabled, label, className = "", data }: {
  id: string;
  children: ReactNode;
  onTap: (id: string) => void;
  onDrop: (id: string, target: string) => void;
  selected?: boolean;
  disabled?: boolean;
  label: string;
  className?: string;
  data?: Record<string, string>;
}) {
  const start = useRef<{ x: number; y: number; pid: number } | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={selected}
      {...data}
      className={`tile relative h-20 min-w-[4.5rem] touch-none px-3 text-5xl sm:h-24 ${selected ? "border-sky-dark bg-sky-soft" : ""} ${disabled ? "opacity-30" : ""} ${offset ? "z-50 shadow-xl" : ""} ${className}`}
      style={offset ? { transform: `translate(${offset.x}px, ${offset.y}px) scale(1.08)` } : undefined}
      onPointerDown={(e) => {
        if (disabled) return;
        start.current = { x: e.clientX, y: e.clientY, pid: e.pointerId };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        if (offset || Math.hypot(dx, dy) > 10) setOffset({ x: dx, y: dy });
      }}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        if (offset) {
          setOffset(null);
          const under = document.elementsFromPoint(e.clientX, e.clientY).find((el) => (el as HTMLElement).dataset?.drop);
          if (under) onDrop(id, (under as HTMLElement).dataset.drop!);
        } else {
          onTap(id);
        }
      }}
      onPointerCancel={() => { start.current = null; setOffset(null); }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap(id);
        }
      }}
    >
      {children}
    </button>
  );
}
