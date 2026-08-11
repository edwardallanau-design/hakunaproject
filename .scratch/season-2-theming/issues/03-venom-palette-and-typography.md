# 03 — The venom theme: palette and typography

**What to build:** The venom theme's foundation — its 13-token dark palette and its font choices — designed, not defaulted. **The implementing session loads `/frontend-design:frontend-design` before choosing a single value.** Season flavour: venom/poison, the Curse of Ula'tek, Amani trolls, the Coiled Isle — but the output must read as a designed palette in the site's 8-bit HD-2D language, not "the void theme, but green."

This is the tracer bullet through ticket `01`'s machinery: the first real second theme, and the first real second font. The seam allows a full font swap (all three roles); the *design* may still choose restraint — override only what earns its place.

**Blocked by:** 01 — Widen the seam: font tokens and the theme package convention

**Status:** ready-for-agent

- [ ] `.theme-venom` defines all 13 colour tokens; font tokens overridden per the design's choice (any subset, full swap permitted)
- [ ] Fonts come from Google Fonts' licensed catalogue and load through ticket `01`'s mechanism
- [ ] Verified in the network tab: viewing Season 1 loads no venom font; viewing venom loads no unused font — the conditional-loading proof ticket `01` deferred here
- [ ] Contrast holds everywhere: body text, muted text, badges, buttons, the archived-Season notice — and **WoW class-coloured text stays readable on venom surfaces** (class colours are fixed constants; the surfaces under them are what changed)
- [ ] Light mode still renders the season-neutral light palette with venom selected — nothing venom leaks into light
- [ ] Verified: `void` untouched, in both modes
- [ ] The manifest's venom entry now carries a real theme; the dropdown from ticket `02` selects it end-to-end on a local Season row
