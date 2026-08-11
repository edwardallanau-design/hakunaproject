# 01 — Freeze the Sync

**What to build:** No automated or manual Sync can write to Season 1 any more. The scheduled hourly run stops entirely, and an operator who presses the admin Sync button gets an explicit, honest "sync is disabled" response rather than something that looks like success.

This is the deadline-removing ticket. Season 2 begins 2026-08-12 and the hourly Sync at `:17` is the thing that will overwrite Season 1's M+ Leaderboard — one member finishing one Season 2 key is enough to replace the stored ten-entry list with a one-entry list. Nothing else in this feature is urgent once this lands.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The scheduled trigger is removed from the Sync workflow, so no hourly run occurs
- [ ] The manual-dispatch trigger is retained, so the workflow can still be run deliberately
- [ ] The Sync route is gated on a `SYNC_DISABLED` environment flag
- [ ] When disabled, the route returns a non-200 using the **existing** failure contract — the same `stage` / `message` shape the admin button and the workflow already understand — with its own distinct stage value
- [ ] The admin Sync button surfaces the disabled state to the operator rather than appearing to succeed
- [ ] `SYNC_DISABLED` is set in the production environment and documented in the committed env template
- [ ] Verified: triggering the workflow manually and pressing the admin button both leave Season 1 data untouched
