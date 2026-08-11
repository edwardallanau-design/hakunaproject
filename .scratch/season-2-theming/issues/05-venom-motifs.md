# 05 — Venom motifs

**What to build:** The venom theme's card and UI decorations — themed `px-gem` corners, border treatment (scale/fang texture if the design earns it), and a section divider — so every card feels in-season, not just the top of the page.

**Blocked by:** 03 — The venom theme: palette and typography

**Status:** ready-for-agent

- [ ] Motifs are scoped under `.theme-venom` (CSS/inline SVG); `void`'s stock gems, borders and dividers are untouched
- [ ] Motifs decorate without degrading: card content readability and spacing are unchanged; nothing interactive is obscured
- [ ] Light mode keeps its season-neutral decorations — venom motifs render in dark only, explicitly handled as in ticket `04`
- [ ] Verified: `void` untouched in both modes; venom cards verified across every section of the page — screenshots
