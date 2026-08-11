# 01 — Widen the seam: font tokens and the theme package convention

**What to build:** The theming seam grows from 13 colour tokens to a theme *package* — palette plus three font tokens, with backdrop/motifs/key art as documented optional elements — while `void` stays pixel-for-pixel identical. This ticket builds the machinery; nothing visible changes.

Typography today is a global Google Fonts `@import` (`globals.css:1`) with `VT323` and `Press Start 2P` hardcoded at every `font-family` site. That directly contradicts per-season fonts: the mechanism this ticket ships must not load every theme's fonts for every visitor. Note `next/font` self-hosts at build time, which also removes the external request at page load. The conditional-loading mechanism has **no live second consumer until ticket `03`** — that ticket's checklist carries the network-tab proof with a real second font.

**Blocked by:** —

**Status:** ready-for-agent

- [ ] Three font tokens — `--font-display`, `--font-body`, `--font-ui` — defined at `:root` with today's stacks (VT323 / VT323 / Press Start 2P) and consumed by every `font-family` declaration in the stylesheet; a theme class may override any subset
- [ ] The Google Fonts `@import` is replaced by self-hosted loading (`next/font`); no request to `fonts.googleapis.com`/`gstatic` remains
- [ ] A theme manifest in code (e.g. `src/lib/themes.ts`) is the single source of truth for which themes exist — `void` and `venom` both listed; `venom` has no CSS yet and legally renders the default look, which is the seam's fallback contract doing its job
- [ ] The theme package convention is documented where a future session will find it (manifest docstring + `globals.css` theme-section comment): palette required; fonts, backdrop, motifs, key art optional; file assets slug-keyed under `public/themes/<slug>/` when they exist; every optional element falls back to today's look
- [ ] Verified: `void` is pixel-for-pixel unchanged — screenshots of the full page in dark and light compared against pre-change captures
- [ ] Verified: the light/dark toggle and Season switcher work unchanged
