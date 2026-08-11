# 11 — Remove the `progression` global

**What to build:** The `progression` global is dropped. The Seasons collection is the sole home for Season data, and no future reader has to wonder which of two shapes is authoritative.

Held back to last on purpose. The global has been sitting untouched and unread since ticket 03 as the in-database copy of Season 1 — the one insurance policy that lives in the same place the app actually reads. It is only safe to drop once production has demonstrably run a full Sync cycle against the collection.

**Blocked by:** 10 — Re-enable the Sync

**Status:** ready-for-agent

- [ ] Production has been verified rendering and syncing from the Seasons collection through at least one full scheduled cycle
- [ ] The snapshot JSON from ticket 02 and the Neon branch both still exist as out-of-database records before anything is dropped
- [ ] A committed migration removes the `progression` global, per ADR `0004`
- [ ] The global's definition and any now-dead types are removed from the codebase
- [ ] Verified: the site and the Sync are unaffected
