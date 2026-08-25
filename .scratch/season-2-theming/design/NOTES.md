# Notes on this design bundle

Committed 2026-08-25 from the operator's handoff, so the design survives past the
conversation that delivered it. `README.md` and `Season 2 v2 - Curse of Ulatek.html`
are verbatim; the two reference prototypes are described below rather than stored,
and `support.js` (the Design Component runtime the prototypes load) was never part
of the handoff.

## What is here

- **`README.md`** — the handoff document. Every token value, clamp, breakpoint and
  interaction, plus the mapping onto this codebase. Verbatim.
- **`Season 2 v2 - Curse of Ulatek.html`** — **the chosen design, implement this.**
  Verbatim. Self-contained apart from `support.js`: every colour, size, animation
  and layout rule is inline, and the `<script type="text/x-dc">` block at the bottom
  carries the placeholder data and the client behaviour (scroll-spy, count-up,
  pupil tracking).

## What is not here, and why that is fine

- **`Season 1 - Void.html`** — a prototype recreation of the *current live site*.
  Reference only, for side-by-side comparison. The real Season 1 look is not this
  file, it is the shipped code in `src/components/*.tsx`, and `void` is frozen
  pixel-for-pixel (ADR 0007) — so the running site is a better reference than a
  recreation of it. One thing worth recording, since it is the only place the two
  disagree: the prototype renders About's eyebrow and heading in `sans-serif`,
  matching the real dead-stack bug documented in ticket 01. It reproduced the bug.
- **`Season 2 - Curse of Ulatek.html`** (v1) — an earlier iteration: Season 1's
  layout wearing the venom skin. Superseded by v2, which is the one with the
  editorial numbered sections, descent timeline and champion spotlight. Kept out
  deliberately: a superseded design in the repo is a thing a future session can
  mistake for current.
- **`support.js`** — the Design Component prototype runtime. Not shipped with the
  handoff and not needed: the prototypes cannot be rendered here, and the fidelity
  check is the README's values plus the inline styles, verified with the screenshot
  harness against the real site.
- **`assets/guild-logo.png`** — already in the repo at `public/guild-logo.png`,
  which is what the implementation uses.

## Reading the prototype markup

The v2 file is not React. It uses the Design Component templating dialect:

- `{{ expr }}` — an interpolation, resolved by `renderVals()` in the script block.
- `<sc-for list="{{ xs }}" as="x">` — a repeat; `hint-placeholder-count` is only a
  design-time hint for how many to draw.
- `<sc-if value="{{ cond }}">` — a conditional.
- `style-hover="..."` — hover styles, since the prototype has no stylesheet.

So `{{ b.nodeGlow }}` and friends are computed in `renderVals()`, not CSS. When
porting, the computation moves into the React component and the placeholder arrays
(`bossData`, `dungeonData`, `runnersRaw`, `officersRaw`) are replaced by Season data.

**Every name and number in the prototype is placeholder** — bosses, dungeons,
runners, officers, "5/8", the ranks. The README says so explicitly. None of it may
reach a real Season row.
