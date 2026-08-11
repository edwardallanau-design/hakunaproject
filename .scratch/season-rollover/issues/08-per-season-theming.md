# 08 — Per-Season theming

**What to build:** Switching to an archived Season shows the site as it looked during that Season. A Season's styling is part of its identity, not decoration applied on top of it.

**Blocked by:** 07 — Season switcher with archived notice

**Status:** ready-for-agent

- [ ] Each Season's theme slug selects a full palette — all thirteen colour tokens the site already uses
- [ ] Themes are defined as classes in the stylesheet, with the Season row storing only the slug. Operator-chosen colour values are deliberately **not** offered: contrast is doing real work in this design and a colour picker cannot guarantee a readable page
- [ ] Season 1's theme is the existing Void palette, so its appearance is unchanged
- [ ] Switching Seasons applies that Season's palette across the whole page
- [ ] The existing light palette is left exactly as it is and is season-neutral for now
- [ ] The light/dark toggle continues to work unchanged — this ticket must not remove a shipped feature
- [ ] Verified: switching between Seasons in both light and dark mode produces readable pages in every combination
