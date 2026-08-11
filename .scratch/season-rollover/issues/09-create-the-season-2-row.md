# 09 — Create the Season 2 row

**What to build:** Season 2 exists as a row, fully configured, and is made current. From that instant Season 1 is archived and unreachable by any Sync.

**This is the only ticket gated on the outside world.** Season 2's boss list must be typed by hand — the upstream API omits un-pulled encounters and even some killed ones, so there is nothing reliable to generate it from. Verified on 2026-08-10: the attempts payload returned 8 encounters for a 9-boss Raid, with a Boss killed on 2026-04-09 absent entirely.

Season 2's Rank Source slug is a guess (`tier-mn-2`) until a real response confirms it. Raid and Mythic+ open around 2026-08-17.

**Blocked by:** 06 — Capture every M+ Participant

**Status:** ready-for-agent

- [ ] A Season 2 row is created with display name, URL slug, theme slug and started-at date
- [ ] Contributing Raid slugs and Rank Source Raid slug are set from a **real** upstream response, not from the guessed value
- [ ] The M+ season slug is set — `season-mn-2` existed upstream and returned zero Characters as of 2026-08-10
- [ ] Season 2's boss list is entered by hand
- [ ] A theme palette exists for Season 2
- [ ] The `currentSeason` pointer is moved to Season 2 **after** the row is fully configured, so there is no window in which a half-built Season is current
- [ ] Verified: Season 1 renders correctly via the switcher and is no longer the Sync target
