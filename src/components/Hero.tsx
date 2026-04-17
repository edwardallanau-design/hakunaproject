"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Crystal coordinates: [top%, right%, bottom%, left%, size, colorVar, delay]
const VOID_CRYSTALS = [
  { top: "13%", right: "11%", size: 11, color: "var(--glow)",    delay: 0   },
  { top: "29%", right: "21%", size: 6,  color: "var(--accent2)", delay: 0.5 },
  { bottom: "19%", left: "9%",  size: 9,  color: "var(--accent)",  delay: 1   },
  { bottom: "34%", left: "19%", size: 5,  color: "var(--accent2)", delay: 1.5 },
  { top: "19%",  left: "7%",  size: 8,  color: "var(--glow)",    delay: 2   },
] as const;

function VoidCrystals() {
  return (
    <>
      {VOID_CRYSTALS.map((c, i) => (
        <div
          key={i}
          className="crystal"
          style={{
            ...("top" in c    ? { top: c.top }       : {}),
            ...("bottom" in c ? { bottom: c.bottom }  : {}),
            ...("right" in c  ? { right: c.right }    : {}),
            ...("left" in c   ? { left: c.left }      : {}),
            width: c.size, height: c.size,
            background: c.color,
            boxShadow: `0 0 ${c.size}px ${c.color}`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </>
  );
}

const RAY_ANGLES = [-15, -8, -2, 3, 9, 14];
const SHARD_POSITIONS = [
  { top: "14%",    right: "12%",  size: 10, color: "#fbbf24", delay: 0   },
  { top: "28%",    right: "22%",  size: 6,  color: "#f59e0b", delay: 1.2 },
  { bottom: "22%", left: "10%",   size: 8,  color: "#d97706", delay: 0.6 },
  { bottom: "36%", left: "20%",   size: 5,  color: "#fbbf24", delay: 1.8 },
  { top: "22%",    left: "8%",    size: 7,  color: "#f59e0b", delay: 0.3 },
] as const;

function LightDecorations() {
  return (
    <>
      {RAY_ANGLES.map((angle, i) => (
        <div
          key={i}
          style={{
            position: "absolute", top: 0,
            left: `${10 + i * 13}%`,
            width: 2,
            height: `${55 + i * 3}%`,
            background: "linear-gradient(to bottom, rgba(251,191,36,0.35), transparent)",
            transformOrigin: "top center",
            transform: `rotate(${angle}deg)`,
            animation: `rayPulse ${3 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
      {SHARD_POSITIONS.map((s, i) => (
        <div
          key={i}
          className="crystal"
          style={{
            ...("top" in s    ? { top: s.top }       : {}),
            ...("bottom" in s ? { bottom: s.bottom }  : {}),
            ...("right" in s  ? { right: s.right }    : {}),
            ...("left" in s   ? { left: s.left }      : {}),
            width: s.size, height: s.size,
            background: s.color,
            boxShadow: `0 0 ${s.size}px ${s.color}`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function GuildCrest({ isVoid }: { isVoid: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40 sm:w-52 sm:h-52 animate-crest" aria-hidden>
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
      <circle cx="100" cy="100" r="74" fill="none" stroke={isVoid ? "#7c3aed" : "#f59e0b"} strokeWidth="1.3" opacity="0.4" />
      <circle cx="100" cy="100" r="60" fill="none" stroke={isVoid ? "#a855f7" : "#fbbf24"} strokeWidth="1.7" opacity="0.5" />
      <circle cx="100" cy="100" r="46" fill="none" stroke={isVoid ? "#22d3ee" : "#d97706"} strokeWidth="1.1" opacity="0.4" />

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

  const isVoid = mounted ? resolvedTheme !== "light" : false;

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
      {mounted && (isVoid ? <VoidCrystals /> : <LightDecorations />)}

      {mounted && <div className="px-grid" />}
      {mounted && <div className="px-bokeh" />}
      <div className="px-scanlines" />

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
              style={{
                fontFamily: "'VT323', monospace",
                fontSize: "var(--vt-xl)",
                color: isVoid ? "#e2d9f3" : "#1e1b0f",
                letterSpacing: "0.1em",
                lineHeight: 1,
                textShadow: "0 0 20px color-mix(in srgb,var(--glow) 80%,transparent), 0 0 60px color-mix(in srgb,var(--accent) 40%,transparent)",
              }}
            >
              Potato Corner
            </h1>
            <p style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "var(--px-md)",
              color: "var(--muted)",
              letterSpacing: "0.2em",
            }}>
              Don&apos;t Worry, Be Raiding
            </p>
          </motion.div>

          {/* Badge row */}
          <motion.div variants={stagger.item} className="flex flex-wrap justify-center gap-2">
            {["Barthilas · OCE", "Horde"].map((tag) => (
              <span
                key={tag}
                className="px-badge"
              >
                {tag}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div variants={stagger.item} className="flex flex-wrap gap-4 justify-center mt-2">
            <a href="#progression" className="px-btn">View Progression</a>
            <a href="#recruitment" className="px-btn outline">Apply Now</a>
          </motion.div>
        </motion.div>

      </div>

      {/* Scroll hint — cascading chevrons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.15, 0.7, 0.15] }}
            transition={{ duration: 1.8, delay: i * 0.25, repeat: Infinity }}
            style={{
              width: 8,
              height: 8,
              borderRight: "1.5px solid var(--accent)",
              borderBottom: "1.5px solid var(--accent)",
              transform: "rotate(45deg)",
            }}
          />
        ))}
      </motion.div>
    </section>
  );
}
