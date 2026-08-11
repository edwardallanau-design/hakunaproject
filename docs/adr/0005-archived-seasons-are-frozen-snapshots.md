# 5. Archived Seasons are frozen Snapshots, never re-fetched

Date: 2026-08-10

## Status

Accepted

## Context

Raider.IO exposes historical Mythic+ data by season slug. `.../mythic-plus/rankings/characters?...&season=season-tww-3` returns real data for a season that ended long ago, which makes re-fetching an archived Season look like a free, self-healing alternative to storing one.

It is not. **Raider.IO preserves scores per Character, not per Guild.** A guild-scoped historical query is recomputed on every request: take the guild's roster *as it is now*, look up each of those Characters' scores for that season, rank them. Verified against the live API — `season-tww-3` returned 322 ranked Characters, which is "the tww-3 scores of people in Potato Corner today", not a stored 2024 leaderboard.

Two things therefore corrupt any re-fetch, and neither is detectable in the response:

- **Roster drift.** A Participant who leaves the Guild silently disappears from their own Season's record. Their score is not zeroed or flagged — the row is simply absent.
- **Guild rename.** The lookup is by Guild name. This Guild has already been renamed once (Hakuna Muh Nagga → Potato Corner). A future rename orphans every historical query at once.

A re-fetch is a question about *today's* Guild wearing the costume of a fact about a past Season.

The same reasoning applies to pinning the season slug on the *live* Sync. Pinning prevents the current Season's row from being contaminated by the next Season's scores, but does nothing about roster drift — and the measure that fixes roster drift, capturing the data while the roster is intact, fixes season drift too. Pinning is therefore dominated, and worse, it invites the operator to defer archiving because the data "looks safe".

## Decision

**An archived Season's data is a Snapshot, captured while that Season was current, and is never re-fetched.**

The Sync writes only to the current Season. Archived Seasons are not addressable by any Sync — this is a property of the model, not a guard bolted onto it.

**Snapshots record every M+ Participant, not just the displayed Leaderboard.** The site shows a top ten; the Snapshot keeps everyone with a score. Storage and display are decoupled, because the ~575 Participants outside the top ten are exactly the records that roster drift destroys and nothing can reconstruct.

## Consequences

The moment a Season's data is captured is the moment it becomes permanent. There is no later opportunity to improve it and no recovery path if it is captured wrong — the Snapshot is not a cache of something retrievable, it is the original.

This raises the stakes on rollover timing. A Season must be archived before its Participants disperse, and lateness is not recoverable by any amount of subsequent effort.

Boss kill data is unaffected by this risk: it is locked once set (`syncProgression.ts:72`) and Raider.IO reports kills against the Guild, not reconstructed from present membership.

## Alternatives considered

**Re-fetch archived Seasons on demand, store nothing.** Rejected for the reasons above. Recorded explicitly because the seasoned endpoint is discoverable and looks authoritative — a future reader will find it and reasonably propose exactly this. It appears to work, and its failure mode is silent omission rather than an error.

**Pin the M+ season slug on the live Sync as a safety net.** Rejected as insufficient and misleading, per the reasoning above. Not unreasonable as an addition later; never as a substitute for capturing the Snapshot promptly.
