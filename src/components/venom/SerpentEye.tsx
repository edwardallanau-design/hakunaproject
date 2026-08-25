"use client";
import { useEffect, useRef } from "react";

/**
 * The Season 2 crest: a potato holding a serpent's eye, ringed by dashed orbits
 * and fang points. Ported from the design bundle's inline SVG
 * (.scratch/season-2-theming/design/), which is the source of every coordinate
 * and colour here.
 *
 * Three behaviours, each gated on something:
 * - a slow float and a periodic blink, both dropped under `prefers-reduced-motion`
 * - the pupil tracking the cursor, only on devices that have one
 */
export function SerpentEye({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pupilRef = useRef<SVGGElement>(null);

  useEffect(() => {
    // A touch device has no cursor to follow, and `pointer: fine` is the
    // capability check rather than a width guess.
    const finePointer = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reduced.matches) return;

    const onMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      const pupil = pupilRef.current;
      if (!svg || !pupil) return;
      const r = svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      // Saturates at 40px from centre; 9px horizontal, 0.6 of that vertically,
      // so the pupil stays inside the iris at the extremes.
      const m = Math.min(d / 40, 1) * 9;
      pupil.setAttribute("transform", `translate(${(dx / d) * m},${(dy / d) * m * 0.6})`);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      aria-hidden
      className={className}
      style={{ filter: "drop-shadow(0 0 40px rgba(132,204,22,0.25))" }}
    >
      <defs>
        <radialGradient id="venomOuter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1f4a0e" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#0a2408" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#050f08" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="venomIris" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d9f99d" />
          <stop offset="55%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#1f4a0e" />
        </radialGradient>
        <radialGradient id="venomPotato" cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#e3bc7f" />
          <stop offset="60%" stopColor="#b9854a" />
          <stop offset="100%" stopColor="#6e4a24" />
        </radialGradient>
        <filter id="venomGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Halo and orbit rings */}
      <circle cx="100" cy="100" r="92" fill="url(#venomOuter)" />
      <circle cx="100" cy="100" r="76" fill="none" stroke="#84cc16" strokeWidth="1.3" opacity="0.4" strokeDasharray="3 7" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#a3e635" strokeWidth="1.7" opacity="0.5" />
      <circle cx="100" cy="100" r="48" fill="none" stroke="#2dd4bf" strokeWidth="1.1" opacity="0.4" strokeDasharray="8 5" />

      {/* Fangs at the compass points */}
      <g fill="#a3e635" opacity="0.75">
        <polygon points="100,20 104,33 96,33" />
        <polygon points="180,100 167,104 167,96" />
        <polygon points="100,180 96,167 104,167" />
        <polygon points="20,100 33,96 33,104" />
      </g>

      {/* The potato, tilted, with its eyes */}
      <g transform="rotate(-16 100 100)">
        <ellipse cx="100" cy="100" rx="42" ry="31" fill="url(#venomPotato)" filter="url(#venomGlow)" />
        <circle cx="78" cy="88" r="3.5" fill="#5c3d1e" opacity="0.55" />
        <circle cx="124" cy="112" r="3" fill="#5c3d1e" opacity="0.5" />
        <circle cx="112" cy="80" r="2.5" fill="#5c3d1e" opacity="0.45" />
        <circle cx="84" cy="116" r="2.5" fill="#5c3d1e" opacity="0.45" />
      </g>

      {/* Venom sprouts */}
      <line x1="82" y1="72" x2="76" y2="60" stroke="#a3e635" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="75" cy="58" r="3" fill="#a3e635" />
      <line x1="120" y1="70" x2="126" y2="61" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" />
      <circle cx="127" cy="59" r="2.4" fill="#84cc16" />

      {/* The eye. The blink lives on this group so the pupil moves with it. */}
      <g className="venom-eye-blink" style={{ transformOrigin: "100px 100px" }}>
        <ellipse cx="100" cy="100" rx="21" ry="17" fill="#06120a" />
        <circle cx="100" cy="100" r="13" fill="url(#venomIris)" opacity="0.95" />
        <g ref={pupilRef}>
          <ellipse cx="100" cy="100" rx="3.4" ry="11.5" fill="#06120a" />
          <circle cx="96" cy="94" r="2.2" fill="#f0fdf4" opacity="0.85" />
        </g>
      </g>

      {/* Teal minor fangs */}
      <g fill="#2dd4bf" opacity="0.7">
        <polygon points="160,94 164,103 156,103" />
        <polygon points="118.5,151.1 122.5,160.1 114.5,160.1" />
        <polygon points="51.5,129.3 55.5,138.3 47.5,138.3" />
        <polygon points="51.5,58.7 55.5,67.7 47.5,67.7" />
        <polygon points="118.5,36.9 122.5,45.9 114.5,45.9" />
      </g>
    </svg>
  );
}
