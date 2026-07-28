"use client";

import * as React from "react";
import { cn } from "./utils";

interface TooltipProps {
  /** Si viene undefined/vacío, no envuelve nada — se renderiza tal cual children. */
  content?: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}

/**
 * Tooltip liviano sin dependencia externa: en escritorio se muestra con
 * hover, y como los dispositivos táctiles no tienen hover, también se abre
 * con un tap (y se cierra al tocar fuera o al tocar de nuevo).
 */
function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleOutside = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [open]);

  if (!content) return <>{children}</>;

  return (
    <span
      ref={wrapperRef}
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
      onTouchEnd={(e) => {
        // Sin esto, en mobile (sin hover) el toggle depende de que el
        // navegador sintetice un click a partir del touch — algunos
        // elementos deshabilitados o gestos lo evitan. Se maneja el tap
        // directamente y se frena la síntesis para no alternar dos veces.
        e.preventDefault();
        setOpen((o) => !o);
      }}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 w-max max-w-48 -translate-x-1/2 rounded-lg bg-blue-950 px-2.5 py-1.5 text-[11px] font-medium leading-snug text-white shadow-lg animate-in fade-in zoom-in-95 duration-150",
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {content}
          <span
            className={cn(
              "absolute left-1/2 -translate-x-1/2 border-4 border-transparent",
              side === "top" ? "top-full border-t-blue-950" : "bottom-full border-b-blue-950",
            )}
          />
        </span>
      )}
    </span>
  );
}

export { Tooltip };
