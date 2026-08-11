# 07 — Season switcher with archived notice

**What to build:** A visitor can switch between Seasons from the home page and see an archived Season's progression. The page states plainly that they are viewing an archived Season, so nobody mistakes historical standings for current ones.

Only the stats bar and progression card change. About, officers and recruitment stay current — those are not archived per Season, and the notice is what stops that being misleading.

Can run in parallel with tickets 05 and 06; it does not care how the Sync writes.

**Blocked by:** 04 — The site renders the current Season from the collection

**Status:** ready-for-agent

- [ ] A Season switcher appears on the home page, listing Seasons ordered by their started-at date — explicitly, not by row order
- [ ] The selected Season is carried in a query parameter, so an archived Season has a shareable URL
- [ ] With no parameter, the current Season renders exactly as it does today
- [ ] Switching swaps the stats bar and progression card to the selected Season
- [ ] About, officers and recruitment always show current information regardless of the Season selected
- [ ] A visible notice states that an archived Season is being viewed; it does not appear for the current Season
- [ ] A new pure function `resolveRequestedSeason` — `(all Seasons, current Season id, requested slug) → Season` — is the seam for this behaviour
- [ ] An unrecognised slug falls back to the current Season rather than erroring, so a stale link still shows the site
- [ ] Tests cover: no slug requested; an unrecognised slug; a slug naming the current Season; a slug naming an archived Season; an empty pointer
