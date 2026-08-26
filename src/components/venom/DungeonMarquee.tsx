"use client";
import { useState, type CSSProperties } from "react";
import { CLASS_COLORS } from "@/lib/wow-constants";
import { CATEGORY_STYLE, type DungeonTile } from "@/lib/dungeonRotation";
import { SectionHeader } from "./SectionHeader";

/**
 * The dungeon rotation, as one continuous strip.
 *
 * Layout lives in `globals.css` rather than in inline styles, which is the
 * opposite of the other venom components. Two reasons, both particular to this
 * one: the track is CSS-animated, and framer-motion writes `transform` inline —
 * so a reveal animation on a tile would fight the marquee for the same
 * property. And the strip renders every tile twice, so inline style objects
 * would be duplicated across sixty-odd elements for no benefit.
 */

function Tile({ tile, copy }: { tile: DungeonTile; copy: boolean }) {
  const { label, color } = CATEGORY_STYLE[tile.category];
  return (
    <article
      // The second pass exists only to make the loop seamless. It says nothing
      // new, so it is hidden from assistive tech and dropped under reduced
      // motion, where there is no loop to make seamless.
      className={`venom-mq-tile venom-notch${copy ? " venom-mq-copy" : ""}`}
      aria-hidden={copy || undefined}
    >
      <span aria-hidden className="venom-notch-fill venom-mq-notch" style={{ background: color }} />
      <span className="venom-mq-badge" style={{ color, borderColor: color }}>
        {label}
      </span>
      <h3 className="venom-mq-name">{tile.dungeon}</h3>
      <div className="venom-mq-row">
        <span className="venom-mq-key">+{tile.mythicLevel}</span>
        <span className="venom-mq-stat">{tile.stat}</span>
        {/* `--miss` is venom-only, like `--warn`; the literal is its fallback so
            a palette-only theme still renders a legible over-time colour. */}
        <span className="venom-mq-outcome" style={{ color: tile.timed ? "var(--accent2)" : "var(--miss, #e07b5f)" }}>
          {tile.outcome}
        </span>
      </div>
      {/* Height is reserved whether or not anyone is listed, so a one-name tile
          and a four-name tile are the same size and the strip does not jitter
          as it scrolls. A keystone party is five, so five is the ceiling; the
          slice guards against upstream ever returning more for one run. */}
      <div className="venom-mq-party">
        {tile.members.slice(0, 5).map((m) => (
          <span
            key={m.name}
            // Spec and class ride along as a tooltip rather than visible text:
            // sixty tiles of spec labels is noise.
            title={m.spec && m.class ? `${m.spec} ${m.class}` : undefined}
            style={{ color: CLASS_COLORS[m.class] ?? "var(--muted)" }}
          >
            {m.name}
          </span>
        ))}
      </div>
    </article>
  );
}

/**
 * Tiles the track must carry before the loop is seamless.
 *
 * The strip animates by shifting exactly one copy, which only reads as
 * continuous while a copy is at least as wide as the viewport. At roughly 298px
 * per tile that needs 5 tiles at 1440px, 9 at 2560px and 12 at 3440px — so a
 * quiet week that thins the board to three dungeons would expose blank track on
 * a wide display. Repeating the list up to this many tiles covers 3440px twice
 * over, and at a full 32-tile board it changes nothing.
 */
const MIN_TRACK_TILES = 26;

export function DungeonMarquee({
  tiles,
  numeral,
  renderedAt,
}: {
  tiles: DungeonTile[];
  numeral: string;
  /**
   * Server render time, in ms. Passed in rather than read here: this is a
   * client component, so a Date.now() call would run on both sides and the two
   * values would disagree — a hydration mismatch on every load.
   */
  renderedAt: number;
}) {
  const [paused, setPaused] = useState(false);

  // Hold-to-pause, for touch. Separate from `paused` rather than folded into
  // it: they are different intents with different lifetimes. `paused` is a
  // decision that persists until undone; `held` lasts exactly as long as a
  // finger is down. Keeping them apart means a hold-and-release can never
  // clear a deliberate press of the Pause button — the OR below just resolves
  // to whichever is asking.
  const [held, setHeld] = useState(false);

  // Nothing to show is not an error state; the section simply does not exist,
  // matching how the M+ runners card behaves when a Season has no data yet.
  if (tiles.length === 0) return null;

  const copies = Math.max(2, Math.ceil(MIN_TRACK_TILES / tiles.length));
  const duration = tiles.length * 3.6;

  // Where in the loop this page load starts.
  //
  // The tile order is deterministic by design — same runs in, same strip out,
  // with no two neighbours sharing a dungeon or a category. Without an offset
  // the CSS animation also always began at tile 1, so every refresh showed the
  // same opening handful and the far end of a 32-tile strip sat ~100 seconds
  // away. Most visitors would never have seen it.
  //
  // Seeded from the wall clock rather than Math.random(): this renders on the
  // server and the value is handed to the client as markup, so a random number
  // would be a hydration mismatch. The clock is monotonic, so consecutive
  // refreshes genuinely differ, and it needs no state.
  const startOffset = -(renderedAt / 1000) % duration;

  return (
    <section
      id="dungeons"
      style={{
        padding: "clamp(80px,9vw,130px) clamp(20px,4vw,64px)",
        background:
          "linear-gradient(180deg, transparent, color-mix(in srgb,var(--surface2) 50%,transparent) 50%, transparent)",
        borderTop: "1px solid var(--border-dim)",
      }}
    >
      <div style={{ maxWidth: "76rem", margin: "0 auto" }}>
        <SectionHeader
          numeral={numeral}
          eyebrow="Mythic+ Season 2"
          // Not "Dungeon Rotation" any more: a rotation is the season's dungeon
          // *pool*, which is static and identical for every guild. This section
          // is the last 48 hours of this guild's keys, and the heading should
          // say which of those two things it is.
          heading="Recent Keys"
          meta={
            // Kept even though touch now has hold-to-pause, because the two
            // do different jobs: a hold pauses the strip under a finger that
            // is covering the tile you wanted to read. The button is how you
            // stop it and actually read. Hover-pause is desktop-only now.
            //
            // The activity count lives in the hero's stat line beside World /
            // Region / Realm, not here. It is derived from this section's data
            // but it is a fact about the guild, and the hero is where the page
            // already states those.
            <button
              type="button"
              className="venom-mq-toggle"
              aria-pressed={paused}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? "Resume" : "Pause"}
            </button>
          }
        />

        {/* The APG scrollable-region trio: role, tabindex, name. Under reduced
            motion this is a scrollable strip and nothing else can reach it from
            the keyboard. The role is not decoration — ARIA forbids a name on a
            generic element, so `aria-label` on a bare div is simply dropped.
            It stays a tab stop either way rather than being toggled on a media
            query, which the server cannot evaluate: a conditional tabindex is a
            hydration mismatch waiting to happen. */}
        {/* The handlers sit on the view, not the track: the track is what
            moves, so a finger resting on it would slide off its own target
            mid-hold. The view is stationary.

            pointercancel matters as much as pointerup. iOS fires cancel, not
            up, when a vertical scroll takes over from a touch that started
            here — handling only pointerup would strand `held` at true and
            leave the strip frozen with the button still reading Pause, which
            is the bug this change exists to remove. pointerleave covers a
            finger dragged out of the strip before release.

            No preventDefault: the page still has to scroll through this
            section while a finger is on it. */}
        <div
          className="venom-mq-view"
          role="region"
          tabIndex={0}
          aria-label="Recent keys"
          onPointerDown={(e) => { if (e.pointerType !== "mouse") setHeld(true); }}
          onPointerUp={() => setHeld(false)}
          onPointerCancel={() => setHeld(false)}
          onPointerLeave={() => setHeld(false)}
        >
          <div
            className="venom-mq-track"
            data-paused={paused || held ? "true" : undefined}
            style={
              {
                // Seconds per tile, not a fixed total: the strip reads at the
                // same speed whether the guild has run four dungeons or eight.
                // Independent of `copies` — the animation always traverses
                // exactly one copy, however many there are.
                "--venom-mq-duration": `${duration.toFixed(1)}s`,
                // Negative: starts the animation partway through, rather than
                // delaying it.
                "--venom-mq-start": `${startOffset.toFixed(2)}s`,
                "--venom-mq-copies": copies,
              } as CSSProperties
            }
          >
            {Array.from({ length: copies }, (_, c) =>
              tiles.map((tile) => (
                <Tile key={`${c}:${tile.category}:${tile.dungeon}`} tile={tile} copy={c > 0} />
              )),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
