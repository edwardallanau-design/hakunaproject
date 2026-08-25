"use client";
import { motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";

export type DungeonRun = {
  name: string;
  /** Which rotation the dungeon belongs to. */
  pool: "midnight" | "legacy";
  bestKey: number;
  timed: boolean;
  /** Pre-formatted mm:ss — the view model owns the arithmetic. */
  bestTime: string;
};

export function DungeonGrid({ dungeons }: { dungeons: DungeonRun[] }) {
  // Nothing to show is not an error state; the section simply does not exist,
  // matching how the M+ runners card behaves when a Season has no data yet.
  if (dungeons.length === 0) return null;

  return (
    <section
      id="dungeons"
      style={{
        padding: "clamp(80px,9vw,130px) clamp(20px,4vw,64px)",
        background: "linear-gradient(180deg, transparent, color-mix(in srgb,var(--surface2) 50%,transparent) 50%, transparent)",
        borderTop: "1px solid var(--border-dim)",
      }}
    >
      <div style={{ maxWidth: "76rem", margin: "0 auto" }}>
        <SectionHeader
          numeral="02"
          eyebrow="Mythic+ Season 2"
          heading="Dungeon Rotation"
          meta={
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
                fontSize: "var(--ui-sm)",
                color: "var(--muted)",
                letterSpacing: "0.16em",
              }}
            >
              GUILD BEST KEYS
            </span>
          }
        />

        <div className="venom-dungeon-grid">
          {dungeons.map((d, i) => {
            const tagColor = d.pool === "midnight" ? "var(--glow)" : "var(--accent2)";
            return (
              <motion.div
                key={d.name}
                className="venom-notch venom-card-hover"
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3) }}
                style={{
                  position: "relative",
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-dim)",
                  padding: "clamp(14px,1.3vw,22px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(10px,0.9vw,15px)",
                }}
              >
                {/* The triangle filling the clipped corner. */}
                <div
                  aria-hidden
                  className="venom-notch-fill"
                  style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, background: tagColor, opacity: 0.8 }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 600,
                      fontSize: "var(--ui-xs)",
                      color: tagColor,
                      letterSpacing: "0.2em",
                    }}
                  >
                    {d.pool.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 700,
                      fontSize: "var(--ui-xs)",
                      color: d.timed ? "var(--accent2)" : "var(--muted)",
                      border: `1px solid ${d.timed ? "rgba(45,212,191,0.35)" : "color-mix(in srgb,var(--muted) 25%,transparent)"}`,
                      background: d.timed ? "rgba(45,212,191,0.08)" : "transparent",
                      padding: "2px 9px",
                      letterSpacing: "0.12em",
                    }}
                  >
                    {d.timed ? "TIMED" : "OVER"}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: "var(--bd-sm)",
                    color: "var(--text)",
                    lineHeight: 1.2,
                    flex: 1,
                  }}
                >
                  {d.name}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(36px,3vw,56px)",
                      lineHeight: 1,
                      color: "var(--glow)",
                      textShadow: "0 0 16px color-mix(in srgb,var(--glow) 55%,transparent)",
                    }}
                  >
                    +{d.bestKey}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 600,
                      fontSize: "var(--ui-xs)",
                      color: "var(--muted)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {d.bestTime}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "clamp(16px,2vw,32px)",
            marginTop: "clamp(20px,2vw,32px)",
            flexWrap: "wrap",
          }}
        >
          {(
            [
              ["midnight", "var(--glow)", "MIDNIGHT DUNGEONS"],
              ["legacy", "var(--accent2)", "LEGACY DUNGEONS"],
            ] as const
          ).map(([key, color, label]) => (
            <span
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
                fontSize: "var(--ui-xs)",
                color: "var(--muted)",
                letterSpacing: "0.16em",
              }}
            >
              <span style={{ width: 8, height: 8, background: color, transform: "rotate(45deg)", boxShadow: `0 0 5px ${color}` }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
