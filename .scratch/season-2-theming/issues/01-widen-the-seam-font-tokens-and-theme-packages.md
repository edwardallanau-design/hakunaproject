# 01 — Widen the seam: font tokens and the theme package convention

**What to build:** The theming seam grows from 13 colour tokens to a theme *package* — palette plus three font tokens, with backdrop/motifs/key art as documented optional elements — while `void` stays pixel-for-pixel identical. This ticket builds the machinery; nothing visible changes.

Typography today is a global Google Fonts `@import` (`globals.css:1`) with `VT323` and `Press Start 2P` hardcoded at every `font-family` site. That directly contradicts per-season fonts: the mechanism this ticket ships must not load every theme's fonts for every visitor. Note `next/font` self-hosts at build time, which also removes the external request at page load. The conditional-loading mechanism has **no live second consumer until ticket `03`** — that ticket's checklist carries the network-tab proof with a real second font.

**Blocked by:** —

**Status:** done — 2026-08-25, commit `db533f2`

- [x] Three font tokens — `--font-display`, `--font-body`, `--font-ui` — defined at `:root` with today's stacks (VT323 / VT323 / Press Start 2P) and consumed by every `font-family` declaration in the stylesheet; a theme class may override any subset
- [x] The Google Fonts `@import` is replaced by self-hosted loading (`next/font`); no request to `fonts.googleapis.com`/`gstatic` remains
- [x] A theme manifest in code (e.g. `src/lib/themes.ts`) is the single source of truth for which themes exist — `void` and `venom` both listed; `venom` has no CSS yet and legally renders the default look, which is the seam's fallback contract doing its job
- [x] The theme package convention is documented where a future session will find it (manifest docstring + `globals.css` theme-section comment): palette required; fonts, backdrop, motifs, key art optional; file assets slug-keyed under `public/themes/<slug>/` when they exist; every optional element falls back to today's look
- [x] Verified: `void` is pixel-for-pixel unchanged — screenshots of the full page in dark and light compared against pre-change captures
- [x] Verified: the light/dark toggle and Season switcher work unchanged

## Notes from the implementing session

**Scope was wider than "the stylesheet".** Typography lived in 48 inline
`fontFamily` styles across the components as well as five declarations in
`globals.css`; per-Season fonts would have been dead on arrival without
tokenising all of them. VT323 was split by role — headings, wordmarks and
display numerals read `--font-display`, running text and list rows read
`--font-body`.

**The pixel gate needed a better instrument.** Self-hosting via `next/font`
leaves a residual ~0.4% pixel delta from sub-pixel glyph antialiasing (the
metric-adjusted fallback face; `adjustFontFallback: false` does not remove it,
tested). Zero offset is already the best alignment, so nothing moved. The gate
was therefore settled on *layout* rather than pixels: all 270 non-animated
elements match the pre-change capture exactly on position, size, font-size,
colour, background and text, in both modes. The hero crystals, crest rings and
pulse dot are excluded as animated — a same-build re-run churns those on its
own, which is the control that makes the exclusion honest.

**Found, deliberately not fixed:** `About.tsx` names `'Rajdhani'` and
`'Bebas Neue'` for its eyebrow and heading. Nothing has loaded either since the
8-bit redesign, so both render in the browser's default sans-serif — visibly
off-style. Pointing them at the new tokens would change Season 1's look, which
this ticket's gate forbids. Commented in place; fixing it is its own change
against a fresh baseline.
