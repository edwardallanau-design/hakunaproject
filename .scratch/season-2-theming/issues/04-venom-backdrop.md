# 04 — Venom backdrop

**What to build:** A code-drawn (SVG/CSS) pixel-art environmental backdrop for the venom theme — Coiled Isle mood: serpentine depths, poison haze — applied under `.theme-venom` and fading into `--bg` so content floats above it the way the design intends.

**Blocked by:** 03 — The venom theme: palette and typography

**Status:** ready-for-agent

- [ ] The backdrop is authored in-repo (inline SVG/CSS; any file asset lands slug-keyed under `public/themes/venom/`) and applied purely via theme CSS — no component changes
- [ ] Content stays readable over it everywhere it shows; the design decides where it fades out rather than letting it fight every section
- [ ] No layout shift and no meaningful payload cost — pixel art should be tiny; `image-rendering: pixelated` where raster scaling is involved
- [ ] Light mode shows no venom backdrop — the season-neutral light look is preserved, which requires explicitly handling the `.light` case since a background declared under `.theme-venom` would otherwise leak through the token override
- [ ] Verified: `void` untouched in both modes; venom with backdrop verified in dark, neutral in light — screenshots
