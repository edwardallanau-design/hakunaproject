# Context

The domain glossary for this project. Terms only — no implementation detail, no decisions. Decisions live in `docs/adr/`.

## Guild

**Potato Corner**, on realm **Barthilas**, region **us**. Renamed from "Hakuna Muh Nagga". Identified to the upstream API by the `GUILD_NAME` / `GUILD_REALM` / `GUILD_REGION` environment triple.

## Raid

A single raid instance, identified by a **raid slug** (e.g. `tier-mn-1`, `sporefall`). Not the same as a Season — a Season spans several Raids.

## Season

The current content period. The **boss list** shown on the site spans a whole Season, so it can draw bosses from more than one Raid. Midnight Season 1 = 9 bosses from `tier-mn-1` plus Rotmire from `sporefall`.

Exactly one Season is **current** — the one the front page shows and the one a Sync writes to. Past Seasons are **archived**: their data is final and no longer synced, but remains viewable on its own screen.

Every Season has the same *shape* — bosses, kills, rankings, M+ leaderboard. Seasons differ in their **data** and their **styling**, not in their structure.

## Boss

An encounter within a Raid. Referred to by **name** in the CMS and by **slug** in the upstream API; the two are reconciled by lowercasing the name and matching against slugs seen in the API response.

A Boss is **killed** once defeated on Mythic. Kill data is **final**: once killed, its first-defeated date and pull count are never overwritten by a later Sync.

## Rank Source

The one Raid whose guild rankings represent the guild as a whole. Rankings are reported per-Raid and cannot be merged across Raids, so exactly one Raid is nominated. Kills, by contrast, are aggregated across every Raid.

## Sync

One end-to-end refresh of site data from the upstream API. Two stages:

- **Fetch** — retrieve and reshape the upstream guild details and roster.
- **Derivation** — compute Progression (bosses, kills, rankings, M+ runners) and Officers from what Fetch returned.

A Sync is triggered either by an **operator** (a human pressing the admin button) or by the **schedule** (an hourly unattended run). The schedule is the normal case; the operator is the exception.

## Stale

The site is Stale when its displayed data no longer reflects the upstream API because a Sync stage failed. Stale is distinct from **out of date** — the latter is the expected gap between hourly Syncs.
