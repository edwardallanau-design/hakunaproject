"use client";
import { motion } from "framer-motion";
import { CLASS_COLORS } from "@/lib/wow-constants";
import { SectionHeader } from "./SectionHeader";

/** A guild member present on a run. */
export type RunMember = { name: string; class: string; spec: string; role: string };

/**
 * Two ways of showing who ran the key, for the operator to choose between.
 *
 * - `row`    — one line under the key/time, tank → healer → dps, wrapping only
 *              if it must. Reads as a party.
 * - `stack`  — a column on the right of the key/time row, same baseline. Keeps
 *              the card compact when only one name is known, which is the
 *              common case.
 */
export type RosterLayout = "row" | "stack";

export type DungeonRun = {
  name: string;
  /** Which rotation the dungeon belongs to. */
  pool: "midnight" | "legacy";
  bestKey: number;
  timed: boolean;
  /** Pre-formatted mm:ss — the view model owns the arithmetic. */
  bestTime: string;
  /**
   * Guild members on the best run. Usually one: the key was run with people
   * outside the guild, and only members are visible to us. The card therefore
   * lists names plainly and claims nothing about party size.
   */
  members: RunMember[];
};

function MemberName({ m, size }: { m: RunMember; size: string }) {
  return (
    <span
      // Spec and class ride along as a tooltip rather than visible text: eight
      // cards of spec labels is noise.
      title={m.spec && m.class ? `${m.spec} ${m.class}` : undefined}
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        fontSize: size,
        color: CLASS_COLORS[m.class] ?? "var(--muted)",
        lineHeight: 1.3,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {m.name}
    </span>
  );
}

export function DungeonGrid({
  dungeons,
  rosterLayout = "row",
}: {
  dungeons: DungeonRun[];
  rosterLayout?: RosterLayout;
}) {
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
                {/* Key, time, and — in `stack` mode — the roster on the right
                    of the same baseline. Unlabelled on purpose: a bare list
                    reads the same whether it is one name or four, where a
                    heading or a count would draw attention to how sparse it
                    usually is. */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, position: "relative" }}>
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

                  {rosterLayout === "stack" && d.members.length > 0 && (
                    // Grows upward: the list is bottom-aligned so its LAST name
                    // sits level with the key, and extra names extend into the
                    // card's empty upper space rather than pushing the bottom
                    // edge down and making the grid row ragged.
                    //
                    // `alignSelf: flex-end` is the load-bearing part — the
                    // parent aligns children on their first baseline, which
                    // would otherwise pin the FIRST name to the key and send
                    // the rest downward. Party order still reads top-to-bottom.
                    // Absolutely positioned against the key/time row and pinned
                    // to its bottom, so the list contributes no height of its
                    // own and grows upward into the card's empty space.
                    //
                    // In flow it could not do both: bottom-aligning fixed the
                    // baseline but the tallest roster still stretched its grid
                    // row, measured at 155px against 172px. Taking it out of
                    // flow is what keeps every card the same height.
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 1,
                        minWidth: 0,
                        maxWidth: "55%",
                      }}
                    >
                      {d.members.map((m) => (
                        <MemberName key={m.name} m={m} size="var(--ui-xs)" />
                      ))}
                    </div>
                  )}
                </div>

                {rosterLayout === "row" && d.members.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "baseline",
                      gap: "0 10px",
                      borderTop: "1px solid var(--border-dim)",
                      paddingTop: "clamp(8px,0.7vw,12px)",
                      minWidth: 0,
                    }}
                  >
                    {d.members.map((m) => (
                      <MemberName key={m.name} m={m} size="var(--ui-sm)" />
                    ))}
                  </div>
                )}
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
