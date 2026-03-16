"use client";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";

type ProgressionData = { tier: string; season: string; mythicKills: number; totalBosses: number; bosses: { name: string; mythic: boolean }[] }

function ProgressBar({ pct, isVoid }: { pct: number; isVoid: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="relative h-3 rounded-full overflow-hidden"
      style={{ background: isVoid ? "rgba(124,58,237,0.1)" : "rgba(245,158,11,0.1)" }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: isVoid
            ? "linear-gradient(90deg, #7c3aed, #22d3ee)"
            : "linear-gradient(90deg, #f59e0b, #d97706)",
        }}
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
      />
      {/* Shimmer */}
      <motion.div
        className="absolute inset-y-0 w-16 rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
        }}
        animate={inView ? { x: ["-100%", "600%"] } : {}}
        transition={{ duration: 1.8, ease: "easeInOut", delay: 0.8 }}
      />
    </div>
  );
}

export function Progression({ progression }: { progression: ProgressionData }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isVoid = resolvedTheme !== "light";
  const pct = Math.round((progression.mythicKills / progression.totalBosses) * 100);

  return (
    <section id="progression" className="py-24 px-5">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-3"
            style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--muted)" }}>
            Current Tier
          </p>
          <h2
            className="glow-text"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.5rem, 4vw, 2.4rem)",
              color: "var(--text)",
            }}
          >
            {progression.tier}
          </h2>
          <p className="text-sm mt-2" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--muted)" }}>
            {progression.season}
          </p>
        </motion.div>

        {/* Progress card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass-card rounded-2xl p-8"
        >
          {/* Kill count header */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <span
                className="glow-text"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  color: "var(--text)",
                }}
              >
                {progression.mythicKills}/{progression.totalBosses}
              </span>
              <span className="text-sm ml-3" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--muted)" }}>
                Mythic
              </span>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs tracking-wider"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                background: isVoid ? "rgba(34,211,238,0.1)" : "rgba(245,158,11,0.1)",
                border: "1px solid var(--border)",
                color: isVoid ? "#22d3ee" : "#b45309",
              }}
            >
              {pct}% Complete
            </span>
          </div>

          {/* Bar */}
          <div className="mb-8">
            <ProgressBar pct={pct} isVoid={mounted ? isVoid : true} />
          </div>

          {/* Boss list */}
          <div className="grid sm:grid-cols-2 gap-3">
            {progression.bosses.map((boss, i) => (
              <motion.div
                key={boss.name}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="flex items-center gap-3 py-2 px-3 rounded-lg transition-colors"
                style={{
                  background: boss.mythic
                    ? isVoid ? "rgba(124,58,237,0.08)" : "rgba(245,158,11,0.06)"
                    : "transparent",
                }}
              >
                {boss.mythic ? (
                  <CheckCircle2 size={16} style={{ color: isVoid ? "#22d3ee" : "#f59e0b", flexShrink: 0 }} />
                ) : (
                  <Circle size={16} style={{ color: "var(--muted)", opacity: 0.4, flexShrink: 0 }} />
                )}
                <span
                  className="text-sm"
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    color: boss.mythic ? "var(--text)" : "var(--muted)",
                    opacity: boss.mythic ? 1 : 0.5,
                  }}
                >
                  {i + 1}. {boss.name}
                </span>
                {boss.mythic && (
                  <span
                    className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      background: isVoid ? "rgba(34,211,238,0.12)" : "rgba(245,158,11,0.12)",
                      color: isVoid ? "#22d3ee" : "#b45309",
                      flexShrink: 0,
                    }}
                  >
                    Mythic
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
