"use client";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

type ProgressionData = { tier: string; season: string; mythicKills: number; totalBosses: number; bosses: { name: string; mythic: boolean }[] }

function ProgressBar({ pct, isVoid }: { pct: number; isVoid: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="px-progress-wrap">
      <motion.div
        className="px-progress-fill"
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
      />
      <div className="px-progress-shine" />
    </div>
  );
}

export function Progression({ progression }: { progression: ProgressionData }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isVoid = resolvedTheme !== "light";
  const pct = Math.round((progression.mythicKills / progression.totalBosses) * 100);
  const isFullClear = progression.mythicKills === progression.totalBosses;

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
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "var(--px-md)",
            color: "var(--muted)",
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            display: "block",
            marginBottom: 12,
          }}>◆ Current Tier ◆</span>
          <h2 style={{
            fontFamily: "'VT323', monospace",
            fontSize: "var(--vt-lg)",
            color: "var(--text)",
            textShadow: "0 0 20px color-mix(in srgb,var(--glow) 50%,transparent)",
            letterSpacing: "0.08em",
          }}>
            {progression.tier}
          </h2>
          <p style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "var(--px-sm)",
            color: "var(--muted)",
            marginTop: 8,
            letterSpacing: "0.1em",
          }}>
            {progression.season}
          </p>
        </motion.div>

        {/* Progress card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="px-card"
          style={{ padding: "clamp(18px,1.6vw,28px)" }}
        >
          <div className="px-gem tl" /><div className="px-gem tr" />
          <div className="px-gem bl" /><div className="px-gem br" />
          {/* Full clear banner */}
          {isFullClear && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                marginBottom: "clamp(14px,1.4vw,22px)",
                padding: "clamp(8px,0.8vw,14px)",
                border: "1px solid var(--accent)",
                background: "color-mix(in srgb,var(--accent2) 6%,transparent)",
                textAlign: "center",
              }}
            >
              <span style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "var(--px-lg)",
                letterSpacing: "0.2em",
                color: "var(--accent)",
              }}>
                ✦ &nbsp;FULL CLEAR&nbsp; ✦
              </span>
            </motion.div>
          )}

          {/* Kill count header */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <span style={{
                fontFamily: "'VT323', monospace",
                fontSize: "var(--vt-2xl)",
                color: "var(--text)",
                textShadow: "0 0 20px color-mix(in srgb,var(--glow) 60%,transparent)",
                lineHeight: 1,
              }}>
                {progression.mythicKills}/{progression.totalBosses}
              </span>
              <span style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "var(--px-md)",
                color: "var(--muted)",
                marginLeft: 10,
                verticalAlign: "middle",
              }}>
                Mythic
              </span>
            </div>
            <span style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "var(--px-md)",
              color: "var(--accent2)",
              border: "1px solid color-mix(in srgb,var(--accent2) 30%,transparent)",
              padding: "clamp(4px,0.4vw,7px) clamp(10px,1vw,16px)",
              background: "color-mix(in srgb,var(--accent2) 8%,transparent)",
            }}>
              {pct}% Complete
            </span>
          </div>

          {/* Bar */}
          <div className="mb-8">
            <ProgressBar pct={pct} isVoid={mounted ? isVoid : true} />
          </div>

          {/* Boss list — numbered badges replace icon+text-number */}
          <div className="grid sm:grid-cols-2 gap-1.5">
            {progression.bosses.map((boss, i) => (
              <motion.div
                key={boss.name}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "clamp(8px,0.7vw,12px)",
                  padding: "clamp(6px,0.55vw,10px) clamp(10px,0.9vw,16px)",
                  borderLeft: boss.mythic ? "2px solid var(--accent2)" : "2px solid transparent",
                  background: boss.mythic ? "color-mix(in srgb,var(--accent2) 4%,transparent)" : "transparent",
                }}
              >
                {/* Number badge */}
                <div style={{
                  width: "clamp(24px,2vw,34px)", height: "clamp(24px,2vw,34px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "var(--px-sm)",
                  border: `1px solid ${boss.mythic ? "color-mix(in srgb,var(--accent2) 50%,transparent)" : "color-mix(in srgb,var(--muted) 20%,transparent)"}`,
                  color: boss.mythic ? "var(--accent2)" : "var(--muted)",
                  background: boss.mythic ? "color-mix(in srgb,var(--accent2) 8%,transparent)" : "transparent",
                }}>
                  {i + 1}
                </div>
                {/* Boss name */}
                <span style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: "var(--vt-sm)",
                  flex: 1,
                  color: boss.mythic ? "var(--text)" : "var(--muted)",
                  opacity: boss.mythic ? 1 : 0.5,
                  letterSpacing: "0.04em",
                }}>
                  {boss.name}
                </span>
                {/* Mythic tag */}
                {boss.mythic && (
                  <span style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "var(--px-xs)",
                    color: "var(--accent2)",
                    background: "color-mix(in srgb,var(--accent2) 10%,transparent)",
                    border: "1px solid color-mix(in srgb,var(--accent2) 30%,transparent)",
                    padding: "clamp(2px,0.2vw,4px) clamp(6px,0.55vw,10px)",
                    flexShrink: 0,
                  }}>
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
