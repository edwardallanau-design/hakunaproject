# 06 — Capture every M+ Participant

**What to build:** Every ongoing Sync records every Character with a Mythic+ score on the current Season row, not just the ten shown on the site. The card still displays a top ten — this changes what is *kept*, not what is *shown*.

This is the point of the whole feature. Roughly 575 Participants outside the top ten are currently discarded at Derivation time, and per ADR `0005` they are exactly the records that roster drift destroys and nothing can reconstruct.

Costs no extra upstream request: the roster fetch already returns every member with their scores, which is how the top ten is computed in the first place.

**Scope note:** the Participants *field* and **Season 1's** Participant data both land in ticket 03, sourced from the snapshot. This ticket makes the Sync keep them populated from Season 2 onward. Season 1 cannot be filled in here — by design the Sync only ever writes to the current Season.

**Blocked by:** 05 — The Sync writes to the current Season

**Status:** ready-for-agent

- [ ] Derivation populates the Participants field on the current Season with every Character holding a score
- [ ] Participants are derived from the roster the Sync already fetches — no new upstream request
- [ ] The displayed Leaderboard remains capped at ten and its existing card and row-label components are unchanged
- [ ] Tests cover: every Participant with a score is captured while the Leaderboard stays capped at ten; a member with no score is excluded
- [ ] Verified: a real Sync run populates Participants with a count in the expected range — 585 ranked Characters were returned for `season-mn-1` on 2026-08-10
