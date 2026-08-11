# 02 — Snapshot Season 1

**What to build:** A permanent, reviewable record of Season 1 exists outside the live database — a committed JSON file the operator can read line by line, plus a whole-database branch as insurance.

Per ADR `0005`, this Snapshot is the **only** faithful record of Season 1 that will ever exist. Raider.IO stores M+ scores per Character and rebuilds guild-scoped historical queries from *present* membership, so a Participant who leaves the Guild silently vanishes from any later query, and a Guild rename breaks the lookup entirely. There is no second chance to capture this.

Runs after the freeze so it captures a state nothing is still writing to.

**Blocked by:** 01 — Freeze the Sync

**Status:** ready-for-agent

- [ ] A snapshot script exports the `progression` global to a JSON file, committed to the repo
- [ ] **The snapshot also derives Season 1's M+ Participants** — every member with a score, with name, class, spec and score. The `progression` global holds only the displayed top ten; the full roster with scores lives in the `guild-details` global's stored payload, which the script can read directly. **No upstream request is needed and none should be made** — the stored payload is Season 1-faithful and frozen, whereas a live fetch is subject to roster drift
- [ ] The exported JSON is shaped as the Season row it will become — **including Participants** — so the later migration inserts reviewed data rather than transforming live data
- [ ] This is the only opportunity to capture Season 1's Participants. Sync writes only to the current Season, so once Season 2 is current there is no code path that can ever populate them
- [ ] The script follows the established pattern used by the existing scripts in this repo: explicit env loading, then a dynamic import of the Payload config **after** the environment is populated
- [ ] The script deliberately targets production and does **not** carry the refuse-if-not-localhost guard used by the seeding script — it needs the inverse posture, and this is called out in a comment so nobody "fixes" it later
- [ ] A Neon branch is cut as whole-database insurance. **If branching is unavailable on the current plan, fall back to a local database dump kept out of the repo** — it contains the full roster. Do not skip this step: if branching is unavailable, the dump is the only whole-database copy of the stored payload the Participants are derived from
- [ ] Verified by inspection against values captured live on 2026-08-10: 10/10 Mythic, last kill Midnight Falls 2026-07-17, Rotmire 2026-06-17, `tier-mn-1` ranks world 1375 / region 450 / realm 6
