# 02 — `themeSlug` becomes a dropdown

**What to build:** The Season row's `themeSlug` upgrades from free text to a select over the themes the manifest declares (`void`, `venom`). Picking a Season's look is a dropdown; a typo can no longer produce an unstyled page.

**This is the riskiest mechanical step in the feature.** Payload's postgres adapter stores a `select` as a pg **enum**, so this is a column type change on a table whose production row holds `'void'`. The generated migration must be hand-inspected — the `USING` cast in a drizzle-generated type conversion is exactly where generators get lossy. Ship **both** enum values in this one migration; every *future* theme costs an enum-value migration of its own (recorded in ADR `0007` — a future session should learn that there, not from a failed deploy).

**Blocked by:** 01 — Widen the seam: font tokens and the theme package convention

**Status:** ready-for-agent

- [ ] `themeSlug` is a `select` field whose options come from the theme manifest (`void`, `venom`) — one source of truth, not a second hand-typed list
- [ ] One committed migration converts the column, with the text→enum `USING` cast hand-verified (ADR `0004`: no auto-push, ever)
- [ ] Rehearsed both ways locally: `db:reset` from empty builds cleanly through the new migration, **and** the migration runs against a production-shaped copy with the existing Season 1 row reading `void` afterwards
- [ ] The admin edit screen shows a dropdown; the field description still explains what a theme is
- [ ] Verified: the site renders Season 1 unchanged after the migration
