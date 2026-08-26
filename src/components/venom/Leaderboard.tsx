"use client";
import { motion } from "framer-motion";
import { CLASS_COLORS } from "@/lib/wow-constants";
import { SectionHeader } from "./SectionHeader";

export type Runner = { name: string; class: string; spec: string; score: number };

// Class colours are fixed WoW constants, not theme tokens — the surfaces under
// them changed for venom, the colours did not.
const classColor = (cls: string) => CLASS_COLORS[cls] ?? "#9ca3af";

export function Leaderboard({ runners, numeral = "03" }: { runners: Runner[]; numeral?: string }) {
  if (runners.length === 0) return null;

  const [champion, ...rest] = runners;
  const champColor = classColor(champion.class);

  return (
    <section
      id="leaderboard"
      style={{ padding: "clamp(80px,9vw,130px) clamp(20px,4vw,64px)", borderTop: "1px solid var(--border-dim)" }}
    >
      {/* 76rem, matching the raid, dungeon, about and officer sections. At 66rem
          this section's numeral sat 80px right of every other one, so the column
          of 01/02/03/… down the page had a single step in it. */}
      <div style={{ maxWidth: "76rem", margin: "0 auto" }}>
        <SectionHeader numeral={numeral} eyebrow="Leaderboard" heading="Top Mythic+ Runners" />

        {/* Champion spotlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "clamp(14px,1.6vw,26px)",
            padding: "clamp(18px,1.8vw,30px)",
            marginBottom: "clamp(10px,1vw,16px)",
            background:
              "linear-gradient(135deg, color-mix(in srgb,var(--accent) 14%,transparent), color-mix(in srgb,var(--surface) 90%,transparent) 60%)",
            border: "2px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          <div
            aria-hidden
            className="venom-border-run"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "linear-gradient(90deg,var(--accent),var(--accent2),var(--accent))",
              backgroundSize: "200% 100%",
            }}
          />
          <div
            style={{
              width: "clamp(52px,4.5vw,74px)",
              height: "clamp(52px,4.5vw,74px)",
              border: `2px solid ${champColor}`,
              background: `radial-gradient(circle, ${champColor}30, ${champColor}08)`,
              boxShadow: `0 0 20px ${champColor}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,2.4vw,44px)", color: champColor, lineHeight: 1 }}>
              {champion.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 150 }}>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
                fontSize: "var(--ui-xs)",
                color: "var(--glow)",
                letterSpacing: "0.24em",
              }}
            >
              ◆ SEASON CHAMPION
            </span>
            <p style={{ margin: "2px 0 0", fontFamily: "var(--font-display)", fontSize: "clamp(28px,2.6vw,46px)", color: "var(--text)", lineHeight: 1 }}>
              {champion.name}
            </p>
            <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "var(--ui-xs)", color: champColor, letterSpacing: "0.1em" }}>
              {champion.spec} {champion.class}
            </span>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(38px,3.6vw,66px)",
                lineHeight: 1,
                color: "var(--accent2)",
                textShadow: "0 0 20px rgba(45,212,191,0.5)",
              }}
            >
              {Math.round(champion.score).toLocaleString()}
            </span>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
                fontSize: "var(--ui-xs)",
                color: "var(--muted)",
                letterSpacing: "0.2em",
              }}
            >
              M+ RATING
            </span>
          </div>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {rest.map((r, i) => {
            const c = classColor(r.class);
            return (
              <motion.div
                key={`${r.name}-${i}`}
                className="venom-runner-row"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.25) }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "clamp(10px,1vw,16px)",
                  padding: "clamp(10px,0.9vw,14px) clamp(12px,1.2vw,20px)",
                  borderBottom: "1px solid var(--border-dim)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--bd-md)",
                    color: "var(--muted)",
                    opacity: 0.7,
                    width: "1.6em",
                    flexShrink: 0,
                  }}
                >
                  {String(i + 2).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: "var(--bd-sm)",
                    color: "var(--text)",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.name}
                </span>
                <span
                  className="venom-hide-520"
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontWeight: 600,
                    fontSize: "var(--ui-xs)",
                    padding: "2px 9px",
                    border: `1px solid ${c}44`,
                    background: `${c}18`,
                    color: c,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    letterSpacing: "0.06em",
                  }}
                >
                  {r.spec} {r.class}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontWeight: 700,
                    fontSize: "var(--ui-md)",
                    color: "var(--accent2)",
                    flexShrink: 0,
                  }}
                >
                  {Math.round(r.score).toLocaleString()}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
