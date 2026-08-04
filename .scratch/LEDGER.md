# Project Ledger

The durable record for this repo. **Shipped** is append-only — what was built and why, so it never has to be rediscovered. **Open** is the live backlog.

Feature-sized work gets its own directory under `.scratch/<feature-slug>/` per `docs/agents/issue-tracker.md`. This file is the index over all of it.

This file is committed. Keep it accurate; it is the only durable record — `docs/` is gitignored except `docs/agents/`.

---

## Open

Known issues, not yet actioned. Oldest first.

### Sync failures are invisible in the admin UI

`src/globals/GuildDetails.ts:16-18` — the `afterChange` hook wraps both syncs in a `try/catch` that logs to `payload.logger.error` and swallows the error. The admin shows a successful save regardless. A failed progression sync looks identical to a successful one; the only evidence is in server logs.

**Why it matters:** the failure mode is silent and the data just goes stale. This is how the Rotmire bug stayed invisible for weeks.

**Fix direction:** surface the failure — store a `lastSyncError` field on the global, or let the hook throw so Payload reports it.

---

### `PRIMARY_RAID_SLUG` needs a manual bump each season

`src/lib/syncProgression.ts:10` — guild rankings can't be merged across raids, so one raid is pinned by slug as the rank source. Currently `tier-mn-1`. When Midnight Season 2 lands, this constant must be updated by hand or rankings freeze at their last known values.

**Why it matters:** it fails quietly. The preserve-on-null path at `syncProgression.ts:104-108` holds old ranks rather than erroring, so the site shows stale numbers indefinitely.

**Fix direction:** move it to a CMS field on the `progression` global so it's changeable without a deploy, or derive "current tier" from the API and document the rule.

---

### API fields are silently discarded

`src/lib/syncProgression.ts:104` spreads `mythicRanks` wholesale into `rankings`, but the schema only defines `world`, `region`, `realm`, `members`. Raider.IO also returns `subregion` (currently 54), which Payload strips without complaint.

**Why it matters:** low severity today, but the transform layer in `raiderio.ts` has no schema validation at all. Any upstream shape change fails at runtime, not at the boundary.

**Fix direction:** validate the API response at the fetch boundary rather than trusting its shape.

---

### No test framework

No runner, no test files, no `test` script. `src/lib/syncProgression.ts` and `src/lib/raiderio.ts` hold non-trivial data-transform logic that is currently only verifiable by running a live sync and looking at the site.

**Why it matters:** the Rotmire bug was a one-character defect (`[0]`) in exactly this kind of logic, and nothing would have caught it.

**Fix direction:** Vitest, plus extracting the boss-resolution logic out of `syncProgressionFromDetails` into a pure function that doesn't need a `Payload` instance.

---

## Shipped

Append-only. Newest first.

### 2026-08-04 — Rotmire / multi-raid progression sync

`eb43dec`, merged to main in `2834fb9`.

Progression sync read `details.raidProgress[0]` only, so any raid after the first never resolved. Rotmire — the single boss of the `sporefall` raid — sat permanently unkilled on the site despite Cutting Edge on 2026-06-17.

**Decisions:**

- **Kills aggregate across all raids, rankings do not.** The CMS boss list spans a whole season (10 bosses = 9 from `tier-mn-1` + Rotmire from `sporefall`), so kill data is collected from every raid in the response. Guild rankings are reported per-raid and can't be meaningfully merged, so one raid is the rank source.
- **Rank source pinned by slug, not array position.** `PRIMARY_RAID_SLUG = "tier-mn-1"`. Index order was never a contract — a Raider.IO reordering would have silently swapped which raid's rank the site displayed.
- **No schema change.** The merged season boss list was already the right model; only the sync was wrong. An earlier read of this as "two raids need two schemas" was incorrect — `sporefall` is a one-boss raid, not a parallel tier.
- **The kill lock is untouched.** `syncProgression.ts:66` (`if (boss.killed) return boss;`) still freezes kill dates and pull counts once set. Note it only protects bosses already marked killed; it is not a general "history is immutable" guarantee.

**Raid slugs, for reference:** `tier-mn-1` = Midnight Season 1, 9 mythic bosses. `sporefall` = one boss, Rotmire.

---

### 2026-08-04 — Engineering skills + agent config

`aee00d7`. Vendored the mattpocock skill set under `.agents/`, added `CLAUDE.md` and `docs/agents/` config. Issue tracker is local markdown under `.scratch/`; triage uses the five default label strings; domain docs single-context. Replaced the retired `docs/superpowers/` workflow.

---

### 2026-08-04 — Guild rename

`93e932f` (PR #18). Guild realigned from **Hakuna Muh Nagga** to **Potato Corner** (Barthilas, US). Relevant because pre-rename specs and any cached Raider.IO URLs reference the old name.

---

### 2026-04-01 — Guild roster sync

Raider.IO's roster endpoint returns ~25MB and takes ~4s. `character.items.items` (16 gear-slot objects) and `character.expansionData` (covenant/soulbind trees) are the bulk of it and are stripped server-side before storage — see `raiderio.ts:125-131`.

**Kept deliberately:** `raidProgress` and `keystoneScores` (frontend filtering), `itemLevelEquipped`, `race`/`class`/`spec`, `realm`/`region`.

**Note:** the original design specified a separate `roster` global and a `POST /api/sync-roster` route. Current code instead folds the roster into the `guild-details` global, fetched in parallel with details in `fetchAndTransformGuildDetails`. The design doc no longer matched the code.

---

### 2026-03-30 — Top M+ runners leaderboard

Second `px-card` below the raid progression card. Top 10 members by `keystoneScores.allScore`, from the same guild API call as progression — no extra endpoint.

**Decisions:** stacked layout, not side-by-side. Row shape is Rank · Name · Spec+Class badge (class-coloured) · Score. Full spec and class names, no abbreviations. Extended the existing sync rather than adding a second button. Class colours were extracted to `src/lib/wow-constants.ts` and shared with `Officers.tsx`.

---

### 2026-03-29 — Officers & Recruitment moved to globals

Officer and recruitment-role card data moved out of standalone Payload collections into two globals, `officers-section` and `recruitment-section`, each holding both the section headings and an array of card data. `page.tsx` fetches two globals instead of two collections.

**Why:** section copy and card data were edited together but lived apart.

---

### 2026-03-29 — Raid schedule & founded date removed

Removed the raid-schedule/founded block from the About section, and dropped both fields from `GuildSettings`. The original spec intended to keep the fields for future use; the implementation removed them.

---

### 2026-03-29 — About section configurable text

`eyebrow` and `heading` added to `GuildSettings` so About copy is CMS-editable. Fallbacks to `"About Us"` / `"The Guild"`. Slug kept as `guild-settings` — no migration.

---

### 2026-03-20 — 8-bit HD-2D redesign

Full visual reskin from glassmorphism to an HD-2D pixel RPG style (Octopath Traveler-inspired). **Approach A — restyle only:** layout, data structures, and the Void/Light theme toggle all preserved; only the visual layer changed.

**Design system, all in `globals.css`:**

- Fonts: **VT323** (headings, body) and **Press Start 2P** (UI labels, badges, buttons), replacing Bebas Neue / Rajdhani / EB Garamond
- Responsive scale via `clamp()` custom properties — `--px-xs/sm/md/lg` for pixel-font UI, `--vt-sm/md/lg/xl` for VT323 display text
- `glass-card` → `px-card` with `px-gem` corner accents

An alternative **Approach B (RPG World Zones)** was considered and deliberately deferred — a larger structural redesign, not a reskin.
