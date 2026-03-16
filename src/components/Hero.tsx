"use client";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const STARS = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.2 + 0.4,
  dur: Math.random() * 4 + 2,
  delay: Math.random() * 5,
}));

function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: s.id % 5 === 0 ? "#22d3ee" : s.id % 3 === 0 ? "#c084fc" : "#e2d9f3",
            opacity: 0.15,
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function LightRays() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 origin-top"
          style={{
            left: `${8 + i * 12}%`,
            width: "3px",
            height: "70%",
            background: "linear-gradient(to bottom, rgba(251,191,36,0.2), transparent)",
            transform: `rotate(${-20 + i * 5}deg)`,
            animation: `rayPulse ${3 + i * 0.6}s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function GuildCrest({ isVoid }: { isVoid: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40 sm:w-52 sm:h-52 animate-float" aria-hidden>
      <defs>
        <radialGradient id="crestOuter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isVoid ? "#4a1d8a" : "#fbbf24"} stopOpacity="0.9" />
          <stop offset="70%" stopColor={isVoid ? "#1a0030" : "#d97706"} stopOpacity="0.5" />
          <stop offset="100%" stopColor={isVoid ? "#030710" : "#faf8f2"} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="crestInner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isVoid ? "#c084fc" : "#fffde7"} />
          <stop offset="100%" stopColor={isVoid ? "#7c3aed" : "#fbbf24"} />
        </radialGradient>
        <filter id="crestGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer glow ring */}
      <circle cx="100" cy="100" r="90" fill="url(#crestOuter)" />

      {/* Orbit rings */}
      <circle cx="100" cy="100" r="74" fill="none" stroke={isVoid ? "#7c3aed" : "#f59e0b"} strokeWidth="0.8" opacity="0.4" />
      <circle cx="100" cy="100" r="60" fill="none" stroke={isVoid ? "#a855f7" : "#fbbf24"} strokeWidth="1.2" opacity="0.5" />
      <circle cx="100" cy="100" r="46" fill="none" stroke={isVoid ? "#22d3ee" : "#d97706"} strokeWidth="0.6" opacity="0.4" />

      {/* Rune ticks on outer ring */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const r1 = 68, r2 = 74;
        return (
          <line key={i}
            x1={100 + r1 * Math.cos(angle)} y1={100 + r1 * Math.sin(angle)}
            x2={100 + r2 * Math.cos(angle)} y2={100 + r2 * Math.sin(angle)}
            stroke={isVoid ? "#a855f7" : "#f59e0b"} strokeWidth="2" opacity="0.7"
          />
        );
      })}

      {/* Void/Light eye center */}
      {isVoid ? (
        <>
          <ellipse cx="100" cy="100" rx="18" ry="28" fill="#06000f" filter="url(#crestGlow)" />
          <ellipse cx="100" cy="100" rx="11" ry="20" fill="#7c3aed" opacity="0.5" />
          <ellipse cx="100" cy="100" rx="5" ry="12" fill="url(#crestInner)" />
          <circle cx="100" cy="100" r="5" fill="#22d3ee" opacity="0.9" />
          <circle cx="100" cy="100" r="2" fill="white" />
        </>
      ) : (
        <>
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i * 22.5 * Math.PI) / 180;
            return (
              <line key={i}
                x1={100 + 20 * Math.cos(a)} y1={100 + 20 * Math.sin(a)}
                x2={100 + 38 * Math.cos(a)} y2={100 + 38 * Math.sin(a)}
                stroke="#fbbf24" strokeWidth={i % 4 === 0 ? 3 : 1.2}
                opacity={i % 4 === 0 ? 0.9 : 0.4}
              />
            );
          })}
          <circle cx="100" cy="100" r="18" fill="url(#crestInner)" filter="url(#crestGlow)" />
          <circle cx="100" cy="100" r="10" fill="#fffde7" />
        </>
      )}

      {/* Orbiting crystals */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        return (
          <polygon key={i}
            points={`
              ${100 + 60 * Math.cos(a)},${100 + 60 * Math.sin(a) - 6}
              ${100 + 60 * Math.cos(a) + 4},${100 + 60 * Math.sin(a) + 3}
              ${100 + 60 * Math.cos(a) - 4},${100 + 60 * Math.sin(a) + 3}
            `}
            fill={isVoid ? "#a855f7" : "#fbbf24"} opacity="0.7"
          />
        );
      })}
    </svg>
  );
}

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.12 } } },
  item: { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } } },
};

export function Hero() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isVoid = resolvedTheme !== "light";

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: isVoid
          ? "radial-gradient(ellipse at 30% 20%, rgba(45,27,105,0.5) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.2) 0%, transparent 50%), #030710"
          : "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(245,158,11,0.15) 0%, transparent 50%), #faf8f2",
      }}
    >
      {mounted && (isVoid ? <StarField /> : <LightRays />)}

      {/* Decorative void tendrils / light aura */}
      {mounted && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isVoid
              ? "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)"
              : "radial-gradient(ellipse at 50% 30%, rgba(251,191,36,0.15) 0%, transparent 60%)",
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center text-center px-5 max-w-5xl mx-auto pt-20 pb-16">
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate={mounted ? "show" : "hidden"}
          className="flex flex-col items-center gap-6"
        >
          {/* Crest */}
          <motion.div variants={stagger.item}>
            {mounted && <GuildCrest isVoid={isVoid} />}
          </motion.div>

          {/* Guild name */}
          <motion.div variants={stagger.item} className="flex flex-col items-center gap-2">
            <h1
              className="tracking-widest leading-tight glow-text"
              style={{
                fontFamily: "'Pirata One', serif",
                fontSize: "clamp(2rem, 7vw, 5rem)",
                color: isVoid ? "#e2d9f3" : "#1e1b0f",
              }}
            >
              Hakuna Muh Nagga
            </h1>
            <p
              className="tracking-[0.3em] text-xs sm:text-sm"
              style={{
                fontFamily: "'Cinzel', serif",
                color: "var(--muted)",
              }}
            >
              Don&apos;t Worry, Be Raiding
            </p>
          </motion.div>

          {/* Badge row */}
          <motion.div variants={stagger.item} className="flex flex-wrap justify-center gap-2">
            {["Zul'jin · US", "Horde", "Mythic Progression", "5/8 Mythic"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs tracking-wider"
                style={{
                  fontFamily: "'Cinzel', serif",
                  background: isVoid ? "rgba(124,58,237,0.15)" : "rgba(245,158,11,0.12)",
                  border: "1px solid var(--border)",
                  color: isVoid ? "#c084fc" : "#b45309",
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div variants={stagger.item} className="flex flex-wrap gap-4 justify-center mt-2">
            <a
              href="#progression"
              className="px-7 py-3 rounded-lg text-sm tracking-widest font-medium transition-all duration-300"
              style={{
                fontFamily: "'Cinzel', serif",
                background: isVoid
                  ? "linear-gradient(135deg, #7c3aed, #4a1d8a)"
                  : "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                boxShadow: isVoid
                  ? "0 0 24px rgba(124,58,237,0.5)"
                  : "0 0 24px rgba(245,158,11,0.4)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = isVoid ? "0 0 40px rgba(124,58,237,0.7)" : "0 0 40px rgba(245,158,11,0.6)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = isVoid ? "0 0 24px rgba(124,58,237,0.5)" : "0 0 24px rgba(245,158,11,0.4)";
              }}
            >
              View Progression
            </a>
            <a
              href="#recruitment"
              className="px-7 py-3 rounded-lg text-sm tracking-widest font-medium transition-all duration-300"
              style={{
                fontFamily: "'Cinzel', serif",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-2px)";
                el.style.borderColor = "var(--accent)";
                el.style.boxShadow = "0 0 16px color-mix(in srgb, var(--accent) 30%, transparent)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.borderColor = "var(--border)";
                el.style.boxShadow = "none";
              }}
            >
              Apply Now
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <div
            className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
            style={{ borderColor: "var(--border)" }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="w-1 h-1.5 rounded-full"
              style={{ background: "var(--accent)" }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
