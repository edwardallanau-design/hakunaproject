# Void baselines — what Season 1 must keep looking like

Full-page captures of the site rendering `void`, taken 2026-08-25 at 1440px
against a local database holding the real Season 1 data (10/10 Mythic, 595
members, world 1375). These are the reference every change to the theming
machinery has been checked against.

- `void-dark-1440.png` — dark mode, the Season 1 look
- `void-light-1440.png` — light mode, the season-neutral palette

## Why these are committed

Season 1's *data* is frozen on its Season row and guarded by
`ProgressionState.isArchived`. Season 1's *look* is not data — it lives in
`src/components/*.tsx` and the `.theme-void` block in `globals.css`. Those
components **are** the Season 1 design.

That is what the theme fork protects: `venom` gets its own component tree, and
`void` keeps rendering the same files it renders today. Season 1's appearance
is preserved by not editing it, which is stronger than preserving a copy.

These images exist so that "unchanged" is checkable by someone who was not
there, rather than a claim in a commit message.

## How to use them

Capture the same view and compare. Note that a **pixel** diff on this site is
always noisy: the hero crystals, crest rings and recruitment pulse dot are
animated, and `next/font`'s metric-adjusted fallback shifts glyph antialiasing
by a fraction of a pixel. Both produce differences that mean nothing.

The reliable check is **layout**, not pixels: walk the DOM and compare each
element's position, size, font-size, colour, background and text content,
excluding the animated elements above. That method found all 270 non-animated
elements identical across the font-token refactor, where the pixel diff read
0.4% and looked alarming.

A same-build re-run is the control that keeps the exclusions honest: if
repeating the capture without changing anything churns the same elements, they
were animation, not regression.
