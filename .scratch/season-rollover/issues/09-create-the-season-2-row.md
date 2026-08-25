# 09 — Create the Season 2 row

**What to build:** Season 2 exists as a row, fully configured, and is made current. From that instant Season 1 is archived and unreachable by any Sync.

**This is the only ticket gated on the outside world.** Season 2's boss list must be typed by hand — the upstream API omits un-pulled encounters and even some killed ones, so there is nothing reliable to generate it from. Verified on 2026-08-10: the attempts payload returned 8 encounters for a 9-boss Raid, with a Boss killed on 2026-04-09 absent entirely.

Season 2's Rank Source slug is a guess (`tier-mn-2`) until a real response confirms it. Raid and Mythic+ open around 2026-08-17.

> **Unblocked 2026-08-25.** The theming gate is lifted: the operator reversed the sequencing to **palette-first**, so this ticket no longer waits on `season-2-theming/issues/07`. Ticket `07` has itself narrowed to a QA matrix.
>
> **The guess in the paragraph above was wrong**, exactly as this ticket predicted it might be. Captured live 2026-08-25: `tier-mn-2` does not exist upstream. The real raid is **`the-venomous-abyss`**, and a fourth raid nobody anticipated — **`the-tidebound-grotto`**, one boss (Nymrissa Wavecaller) — also belongs to Season 2, ordered after the Abyss per operator decision. Rank Source is `the-venomous-abyss`.
>
> `scripts/create-season-2.mjs` implements this ticket: verify-first/`--commit`, inert after first use, rehearsed locally end to end. **It has not been run against production**, and the order matters — see the Open entry in `.scratch/LEDGER.md`: push first (the deploy runs both migrations), then the script, then clear `SYNC_DISABLED`.

**Blocked by:** 06 — Capture every M+ Participant

**Status:** ready-for-agent — script written and rehearsed, awaiting the production run

- [ ] A Season 2 row is created with display name, URL slug, theme slug and started-at date
- [ ] Contributing Raid slugs and Rank Source Raid slug are set from a **real** upstream response, not from the guessed value
- [ ] The M+ season slug is set — `season-mn-2` existed upstream and returned zero Characters as of 2026-08-10
- [ ] Season 2's boss list is entered by hand
- [ ] A theme palette exists for Season 2
- [ ] The `currentSeason` pointer is moved to Season 2 **after** the row is fully configured, so there is no window in which a half-built Season is current
- [ ] Verified: Season 1 renders correctly via the switcher and is no longer the Sync target

## Comments

**2026-08-11** — Operator decision: Season 2 does not launch until its full theme is complete, so this ticket gains the cross-feature edge `.scratch/season-2-theming/issues/07`. The theming seam is also widening (fonts, backdrop, motifs, key art — ADR `0007`), and `themeSlug` becomes a dropdown, so "a theme palette exists" above is superseded by: **venom is selectable in the dropdown and complete per the gate ticket**. The risk was accepted eyes-open: if theming slips past raid opening (~2026-08-17), in-progress pull counts go unrecorded until it lands — and that situation triggers a fresh operator decision, not a silent wait (see the gate ticket).
