# 04 — The site renders the current Season from the collection

**What to build:** The home page shows exactly what it shows today — same bosses, same kills, same ranks, same Leaderboard — but sourced from the current Season row instead of the `progression` global.

This is the cutover. It is isolated in its own ticket precisely so that if anything on the front page changes visually, the cause is unambiguous.

**Blocked by:** 03 — Seasons collection and the Season 1 row

**Status:** ready-for-agent

- [ ] The home page resolves the current Season via the pointer and renders from that row
- [ ] The `progression` global is no longer read by the page, but remains in place untouched
- [ ] The stats bar and progression card are visually identical to before — this ticket changes the source, not the output
- [ ] Progression view-model mapping is factored so the switcher in ticket 07 can reuse it for an archived Season rather than duplicating it
- [ ] Verified: home page before and after the change are indistinguishable, checked against the snapshot JSON
