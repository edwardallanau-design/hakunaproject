# 07 — Venom complete: the gate for the Season 2 row

**What to build:** The full-theme QA pass and the explicit act of clearing the gate. Per the operator's sequencing decision (2026-08-11, recorded in the spec), `season-rollover` ticket `09` does not create the Season 2 row until this ticket is closed. **If ~2026-08-17 (raid opening) arrives and this ticket is not cleared, that is a new operator decision, not a wait** — the options at that point are launching palette-only or holding `09` while in-progress pull counts go unrecorded.

**Blocked by:** 02 — `themeSlug` becomes a dropdown, 04 — Venom backdrop, 05 — Venom motifs, 06 — Venom key art

**Status:** ready-for-agent

- [ ] Full matrix verified with screenshots: {void, venom} × {dark, light} × every page section, plus the switcher and archived-notice states
- [ ] Network check: no external font hosts; only the viewed Season's fonts load
- [ ] A local dummy Season row wearing venom end-to-end via the dropdown — doubling as the rehearsal of `09`'s row-creation flow
- [ ] The gate is cleared in writing: a dated comment on `season-rollover/issues/09` and the ledger's Open entry updated to show `09` waits only on the raid opening
