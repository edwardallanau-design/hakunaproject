"use client";
import { motion } from "framer-motion";
import { CLASS_COLORS } from "@/lib/wow-constants";
import { SectionHeader } from "./SectionHeader";

/** A guild member present on a run. */
export type RunMember = { name: string; class: string; spec: string; role: string };

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
  numeral = "02",
}: {
  dungeons: DungeonRun[];
  numeral?: string;
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
          numeral={numeral}
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
                className="venom-notch"
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                // Hover belongs to framer here, not CSS. The reveal animation
                // writes `transform` inline, and an inline style beats a class
                // — so a CSS `:hover { transform: … }` silently never applied.
                // Measured: the glow landed, the lift and border change did not.
                whileHover={{
                  y: -4,
                  borderColor: "var(--accent)",
                  boxShadow:
                    "0 12px 32px rgba(0,0,0,0.4), 0 0 20px color-mix(in srgb,var(--accent) 25%,transparent)",
                  // Hover needs its own timing. Without it the element-level
                  // `transition` below applies to every animation, so the lift
                  // inherited the reveal's 0.5s duration AND its stagger delay
                  // — up to 0.8s before the last card even started moving.
                  transition: { duration: 0.16, delay: 0, ease: "easeOut" },
                }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3) }}
                style={{
                  position: "relative",
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-dim)",
                  padding: "clamp(14px,1.3vw,22px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(10px,0.9vw,15px)",
                  // Reserve room for a full 5-man roster rising beside the key,
                  // so every card is tall enough for the worst case and none of
                  // them changes height when a big group lands. Without it a
                  // 4-name stack already clipped the dungeon name by 4px, and
                  // five would have by 19px.
                  minHeight: "clamp(178px,14vw,208px)",
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
                    // The roster rises into the card's right-hand column from
                    // below, so the name keeps clear of it horizontally. The
                    // vertical clearance is handled by the card's min-height
                    // above — this alone is not enough, because the two overlap
                    // in the y axis regardless of how much horizontal room each
                    // has.
                    paddingRight: "46%",
                  }}
                >
                  {d.name}
                </span>
                {/* Key, time, and the roster on the right of the same baseline.
                    Unlabelled on purpose: a bare list reads the same whether it
                    is one name or four, where a heading or a count would draw
                    attention to how sparse it usually is. */}
                <div
                  style={{
                    display: "flex",
                    // The roster column fills this row's height so it can
                    // bottom-align inside it.
                    alignItems: "flex-end",
                    gap: 10,
                    position: "relative",
                  }}
                >
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

                  {d.members.length > 0 && (
                    // Bottom-aligned in its own column beside the key, so the
                    // names grow upward from the key's baseline. Kept in flow
                    // and paired with the card's reserved min-height below, so
                    // every card is the same height whether it shows one name
                    // or five, and the list can never reach the dungeon name.
                    //
                    // Two earlier attempts got one half each: reversing the
                    // flex direction fixed the baseline but left the grid row
                    // ragged (155px against 172px), and positioning it
                    // absolutely fixed the heights but let the stack rise
                    // through the name — 4px of overlap at four names, 19px at
                    // five. Both were caught by measuring, not by looking.
                    <div
                      style={{
                        marginLeft: "auto",
                        alignSelf: "stretch",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "flex-end",
                        gap: 1,
                        minWidth: 0,
                        maxWidth: "52%",
                      }}
                    >
                      {/* A keystone party is five, so five is the ceiling. The
                          slice is a guard against upstream ever returning more
                          for one keystoneRunId, not an expected case. */}
                      {d.members.slice(0, 5).map((m) => (
                        <MemberName key={m.name} m={m} size="var(--ui-xs)" />
                      ))}
                    </div>
                  )}
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



