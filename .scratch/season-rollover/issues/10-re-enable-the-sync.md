# 10 — Re-enable the Sync

**What to build:** The hourly Sync resumes, writing to Season 2. The site is live and self-updating again.

Deliberately a separate, reviewed change. Turning the Sync back on is the moment the freeze protecting Season 1 is lifted, and it should be a conscious act performed against a model that has proven itself — not something that resumes as a side effect of another ticket.

**Blocked by:** 09 — Create the Season 2 row

**Status:** ready-for-agent

- [ ] `SYNC_DISABLED` is cleared in the production environment
- [ ] The scheduled trigger is restored to the Sync workflow
- [ ] A first scheduled run completes green and writes to the Season 2 row
- [ ] Season 1's row is confirmed byte-for-byte unchanged after that run — compare against the snapshot JSON from ticket 02
- [ ] The last-sync-error field is clear and the admin button reports success
