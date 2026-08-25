"use client";
import { useEffect, useState } from "react";
import { SerpentEye } from "./SerpentEye";

const DRIPS = [
  { left: "8%", streak: 64, color: "var(--glow)", opacity: 0.55, duration: "5.5s", delay: "0.6s" },
  { left: "44%", streak: 92, color: "var(--accent)", opacity: 0.4, duration: "7.5s", delay: "2.4s" },
  { left: "91%", streak: 52, color: "var(--accent2)", opacity: 0.5, duration: "6.2s", delay: "1.2s" },
];

function useCountUp(target: number, startAfterMs: number, durationMs = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Reduced motion gets the final number immediately rather than a slower
    // count — the animation is the thing objected to, not the value.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let frame = 0;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / durationMs, 1);
        setValue(Math.floor(target * p));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, startAfterMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, startAfterMs, durationMs]);

  return value;
}

function Stat({ value, label, delay }: { value: number; label: string; delay: number }) {
  const shown = useCountUp(value, delay);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "4px 20px" }}>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.8rem,3.4vw,2.6rem)",
          lineHeight: 1,
          color: "var(--text)",
          textShadow: "0 0 20px color-mix(in srgb,var(--glow) 40%,transparent)",
        }}
      >
        {shown.toLocaleString()}
      </span>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 600,
          fontSize: "var(--ui-xs)",
          letterSpacing: "0.18em",
          color: "var(--muted)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export type HeroStats = { members: number; world: number; region: number; realm: number };

export function VenomHero({
  eyebrow,
  intro,
  stats,
}: {
  eyebrow: string;
  intro: string;
  stats: HeroStats;
}) {
  return (
    <section
      id="home"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background:
          "radial-gradient(ellipse at 70% 20%, rgba(20,50,10,0.7) 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(45,212,191,0.09) 0%, transparent 50%), var(--bg)",
      }}
    >
      {/* Scale texture */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.45,
          backgroundImage:
            "radial-gradient(circle at 6px 0px, rgba(132,204,22,0.10) 4px, transparent 5px),radial-gradient(circle at 18px 12px, rgba(45,212,191,0.07) 4px, transparent 5px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Venom drips */}
      {DRIPS.map((d, i) => (
        <div key={i} aria-hidden>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: d.left,
              width: 2,
              height: d.streak,
              background: `linear-gradient(to bottom, ${d.color}, transparent)`,
              opacity: d.opacity,
            }}
          />
          <div
            className="venom-drip"
            style={
              {
                position: "absolute",
                top: 0,
                left: d.left,
                width: 4,
                height: 10,
                borderRadius: "0 0 50% 50%",
                background: d.color,
                boxShadow: `0 0 8px ${d.color}`,
                "--drip-duration": d.duration,
                "--drip-delay": d.delay,
              } as React.CSSProperties
            }
          />
        </div>
      ))}

      {/* Floating spores and potato motes */}
      <div
        className="venom-spore"
        aria-hidden
        style={
          {
            position: "absolute",
            top: "26%",
            left: "6%",
            width: 11,
            height: 8,
            borderRadius: "52% 60% 55% 62%",
            background: "radial-gradient(circle at 40% 35%, #e3bc7f, #b9854a 65%)",
            transform: "rotate(-20deg)",
            boxShadow: "0 0 10px var(--glow)",
            "--spore-duration": "6s",
          } as React.CSSProperties
        }
      />
      <div
        className="venom-spore"
        aria-hidden
        style={
          {
            position: "absolute",
            top: "60%",
            right: "8%",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--accent2)",
            boxShadow: "0 0 8px var(--accent2)",
            "--spore-duration": "7s",
            "--spore-delay": "1.4s",
          } as React.CSSProperties
        }
      />
      <div
        className="venom-spore"
        aria-hidden
        style={
          {
            position: "absolute",
            bottom: "30%",
            left: "38%",
            width: 9,
            height: 7,
            borderRadius: "55% 58% 60% 52%",
            background: "radial-gradient(circle at 40% 35%, #e3bc7f, #a06e3a 65%)",
            transform: "rotate(14deg)",
            boxShadow: "0 0 9px var(--accent)",
            "--spore-duration": "5.5s",
            "--spore-delay": "0.8s",
          } as React.CSSProperties
        }
      />

      <span
        className="venom-side-label"
        aria-hidden
        style={{
          position: "absolute",
          left: "clamp(10px,1.6vw,30px)",
          top: "50%",
          transform: "translateY(-50%)",
          writingMode: "vertical-rl",
          fontFamily: "var(--font-ui)",
          fontWeight: 600,
          fontSize: "var(--ui-xs)",
          letterSpacing: "0.5em",
          color: "var(--muted)",
          opacity: 0.7,
        }}
      >
        BARTHILAS · OCE · HORDE · EST. LEGION
      </span>

      <div
        className="venom-hero-grid"
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          maxWidth: "88rem",
          margin: "0 auto",
          padding: "clamp(96px,12vh,150px) clamp(20px,4vw,64px) clamp(70px,9vh,110px)",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px,1.6vw,24px)" }}>
          <span
            className="venom-rise"
            style={{
              animationDelay: "0.1s",
              fontFamily: "var(--font-ui)",
              fontWeight: 600,
              fontSize: "var(--ui-lg)",
              color: "var(--accent2)",
              letterSpacing: "0.34em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              lineHeight: 0.92,
              letterSpacing: "0.02em",
            }}
          >
            <span
              className="venom-rise"
              style={{
                animationDelay: "0.25s",
                display: "block",
                fontSize: "clamp(58px,9.5vw,170px)",
                color: "var(--text)",
                textShadow: "0 0 30px color-mix(in srgb,var(--glow) 55%,transparent)",
              }}
            >
              Potato
            </span>
            <span
              className="venom-rise"
              style={{
                animationDelay: "0.4s",
                display: "block",
                fontSize: "clamp(58px,9.5vw,170px)",
                color: "transparent",
                WebkitTextStroke: "2px var(--accent)",
              }}
            >
              Corner
            </span>
          </h1>
          <p
            className="venom-rise"
            style={{
              animationDelay: "0.55s",
              margin: 0,
              fontFamily: "var(--font-body)",
              fontSize: "var(--bd-sm)",
              color: "var(--muted)",
              maxWidth: "34ch",
            }}
          >
            {intro}
          </p>
          <div
            className="venom-rise"
            style={{
              animationDelay: "0.7s",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 6,
              justifyContent: "inherit",
            }}
          >
            <a href="#progression" className="venom-btn">
              View Progression
            </a>
            <a href="#recruitment" className="venom-btn venom-btn-outline">
              Apply Now
            </a>
          </div>
        </div>

        <div className="venom-rise" style={{ animationDelay: "0.45s", display: "flex", justifyContent: "center" }}>
          <SerpentEye className="venom-crest venom-eye" />
        </div>
      </div>

      {/* Rankings bar, pinned to the bottom of the hero */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          borderTop: "1px solid var(--border-dim)",
          background: "rgba(8,24,16,0.7)",
          backdropFilter: "blur(8px)",
          padding: "clamp(20px,2vw,32px) 20px",
        }}
      >
        <div
          style={{
            maxWidth: "56rem",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
          }}
        >
          <Stat value={stats.members} label="Active Members" delay={900} />
          {/* Plain World/Region/Realm, operator decision 2026-08-25. The values
              still follow the difficulty being displayed — see VenomPage — but
              the difficulty is not named here. */}
          <Stat value={stats.world} label="World" delay={950} />
          <Stat value={stats.region} label="Region" delay={1000} />
          <Stat value={stats.realm} label="Realm" delay={1050} />
        </div>
      </div>
    </section>
  );
}
