"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Season } from "@/payload-types";
import type { Difficulty } from "@/lib/syncProgression";
import { SectionHeader } from "./SectionHeader";
import {
  difficultyLabel,
  groupDifficulties,
  toRaidProgression,
  type BossAtDifficulty,
  type RaidGroup,
} from "@/lib/venomViewModel";

// Amber, used only for the in-progress state. Not a theme token: it means
// "partial" across every theme, and reads correctly on venom's dark greens.
const PROG = "#fbbf24";

function stateStyles(state: BossAtDifficulty["state"]) {
  if (state === "dead") {
    return {
      rowBg: "rgba(45,212,191,0.04)",
      rowBorder: "rgba(45,212,191,0.14)",
      node: "var(--accent2)",
      nodeGlow: "0 0 8px var(--accent2)",
      nodeBorder: "var(--accent2)",
      numColor: "var(--accent2)",
      nameColor: "var(--text)",
      nameOpacity: 1,
    };
  }
  if (state === "prog") {
    return {
      rowBg: "rgba(245,158,11,0.03)",
      rowBorder: "rgba(245,158,11,0.18)",
      node: PROG,
      nodeGlow: `0 0 8px ${PROG}`,
      nodeBorder: PROG,
      numColor: PROG,
      nameColor: "var(--text)",
      nameOpacity: 1,
    };
  }
  return {
    rowBg: "transparent",
    rowBorder: "color-mix(in srgb,var(--muted) 10%,transparent)",
    node: "var(--surface2)",
    nodeGlow: "none",
    nodeBorder: "color-mix(in srgb,var(--muted) 30%,transparent)",
    numColor: "var(--muted)",
    nameColor: "var(--muted)",
    nameOpacity: 0.5,
  };
}

/**
 * The raid section. A Season can contribute more than one raid — Season 2 is
 * the Abyss plus the Grotto's single lair boss — so each group renders as its
 * own sub-section with **its own difficulty toggle and its own default**.
 *
 * Independent rather than shared, because the raids progress independently:
 * the Grotto is heroic-cleared while the Abyss is mid-heroic, so one Season-wide
 * difficulty would misrepresent whichever raid is behind.
 */
export function RaidTimeline({
  season,
  groups,
}: {
  season: Season;
  groups: RaidGroup[];
}) {
  return (
    <section id="progression" style={{ padding: "clamp(80px,9vw,130px) clamp(20px,4vw,64px)" }}>
      <div style={{ maxWidth: "76rem", margin: "0 auto" }}>
        {groups.map((group, gi) => (
          <RaidGroupSection
            key={group.title}
            season={season}
            group={group}
            numeral={String(gi + 1).padStart(2, "0")}
            isFirst={gi === 0}
          />
        ))}
      </div>
    </section>
  );
}

function RaidGroupSection({
  season,
  group,
  numeral,
  isFirst,
}: {
  season: Season;
  group: RaidGroup;
  numeral: string;
  isFirst: boolean;
}) {
  const { initial, available } = groupDifficulties(season, group);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial);
  const difficulties = available;
  const onDifficultyChange = setDifficulty;
  const prog = toRaidProgression(season, group, difficulty);

  return (
    <div style={{ marginTop: isFirst ? 0 : "clamp(56px,6vw,96px)" }}>
        <SectionHeader
          numeral={numeral}
          eyebrow={group.eyebrow}
          heading={group.title}
          meta={
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(40px,4.2vw,76px)",
                  lineHeight: 1,
                  color: "var(--glow)",
                  textShadow: "0 0 24px color-mix(in srgb,var(--glow) 60%,transparent)",
                }}
              >
                {prog.kills}/{prog.totalBosses}
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 600,
                  fontSize: "var(--ui-sm)",
                  color: "var(--muted)",
                  letterSpacing: "0.2em",
                }}
              >
                {difficultyLabel(difficulty)} · {prog.pct}%
              </span>
            </div>
          }
        />

        {/* Each raid gets its own toggle, offering only the difficulties it has
            actually killed something on. */}
        {difficulties.length > 1 && (
          <div
            role="group"
            aria-label="Raid difficulty"
            style={{
              display: "flex",
              gap: 0,
              marginBottom: "clamp(24px,2.6vw,40px)",
              border: "1px solid var(--border-dim)",
              width: "fit-content",
            }}
          >
            {difficulties.map((d) => {
              const isActive = d === difficulty;
              return (
                <button
                  key={d}
                  onClick={() => onDifficultyChange(d)}
                  aria-pressed={isActive}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontWeight: 700,
                    fontSize: "var(--ui-xs)",
                    letterSpacing: "0.18em",
                    padding: "clamp(7px,0.7vw,11px) clamp(14px,1.4vw,24px)",
                    cursor: "pointer",
                    border: "none",
                    background: isActive ? "color-mix(in srgb,var(--accent) 16%,transparent)" : "transparent",
                    color: isActive ? "var(--glow)" : "var(--muted)",
                    transition: "background 150ms ease, color 150ms ease",
                  }}
                >
                  {difficultyLabel(d)}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ position: "relative", paddingLeft: "clamp(30px,3.4vw,54px)" }}>
          {/* Spine: a dim full-height track with a gradient fill over the cleared share. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "clamp(11px,1.25vw,20px)",
              top: 8,
              bottom: 8,
              width: 2,
              background: "color-mix(in srgb,var(--accent) 15%,transparent)",
            }}
          />
          <motion.div
            aria-hidden
            initial={{ height: 0 }}
            whileInView={{ height: `${prog.pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: "clamp(11px,1.25vw,20px)",
              top: 8,
              width: 2,
              background: "linear-gradient(to bottom,var(--accent),var(--accent2))",
              boxShadow: "0 0 10px color-mix(in srgb,var(--accent) 60%,transparent)",
            }}
          />

          {/* Keyed on the difficulty so switching re-mounts the list and it
              fades rather than hard-swapping under the cursor. */}
          <motion.div
            key={difficulty}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            style={{ display: "flex", flexDirection: "column", gap: "clamp(6px,0.7vw,12px)" }}
          >
            {prog.bosses.map((boss, i) => {
              const s = stateStyles(boss.state);
              return (
                <motion.div
                  key={boss.name}
                  initial={{ opacity: 0, x: -36 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  // The row's border colour is set inline per state, so a CSS
                  // hover rule loses to it — framer has to own this too.
                  // Deliberately no movement: a row that lifts would drift off
                  // the diamond node pinned to the spine beside it.
                  whileHover={{ borderColor: "color-mix(in srgb,var(--accent) 45%,transparent)" }}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.3) }}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: "clamp(12px,1.2vw,20px)",
                    padding: "clamp(10px,1vw,16px) clamp(12px,1.3vw,22px)",
                    background: s.rowBg,
                    border: `1px solid ${s.rowBorder}`,
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: "calc(clamp(11px,1.25vw,20px) - clamp(30px,3.4vw,54px) - 5px)",
                      width: 12,
                      height: 12,
                      transform: "rotate(45deg)",
                      background: s.node,
                      boxShadow: s.nodeGlow,
                      border: `1px solid ${s.nodeBorder}`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 700,
                      fontSize: "var(--ui-xs)",
                      color: s.numColor,
                      letterSpacing: "0.1em",
                      width: "2.2em",
                      flexShrink: 0,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      fontSize: "var(--bd-md)",
                      flex: 1,
                      color: s.nameColor,
                      opacity: s.nameOpacity,
                      lineHeight: 1.2,
                    }}
                  >
                    {boss.name}
                  </span>

                  {boss.state === "dead" && (
                    <span
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontWeight: 700,
                        fontSize: "var(--ui-xs)",
                        color: "var(--accent2)",
                        background: "rgba(45,212,191,0.1)",
                        border: "1px solid rgba(45,212,191,0.3)",
                        padding: "3px 12px",
                        letterSpacing: "0.16em",
                        flexShrink: 0,
                      }}
                    >
                      DEAD
                    </span>
                  )}

                  {boss.state === "prog" && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontFamily: "var(--font-ui)",
                        fontWeight: 700,
                        fontSize: "var(--ui-xs)",
                        color: PROG,
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.35)",
                        padding: "3px 12px",
                        letterSpacing: "0.12em",
                        flexShrink: 0,
                      }}
                    >
                      <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: PROG }} />
                      {/* A best-pull percentage only when upstream reported a
                          real one; otherwise the pull count carries the row. */}
                      {boss.bestPull != null
                        ? `BEST ${boss.bestPull.toFixed(1)}%`
                        : `${boss.pulls} PULL${boss.pulls === 1 ? "" : "S"}`}
                    </span>
                  )}

                  {boss.state === "sealed" && (
                    <span
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontWeight: 600,
                        fontSize: "var(--ui-xs)",
                        color: "var(--muted)",
                        opacity: 0.6,
                        border: "1px solid color-mix(in srgb,var(--muted) 20%,transparent)",
                        padding: "3px 12px",
                        letterSpacing: "0.16em",
                        flexShrink: 0,
                      }}
                    >
                      SEALED
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
    </div>
  );
}
