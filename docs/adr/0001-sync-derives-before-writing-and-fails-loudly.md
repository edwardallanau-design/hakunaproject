# 1. Sync derives before writing, and fails loudly

Date: 2026-08-04

## Status

Accepted

## Context

A Sync has two stages: **Fetch** (retrieve and reshape upstream guild data) and **Derivation** (compute Progression and Officers from it). Derivation is where the site's visible content comes from.

Derivation ran inside an `afterChange` hook on the `guild-details` global, wrapped in a `try/catch` that logged the error and swallowed it. The route therefore returned `200` whenever Fetch succeeded, regardless of whether Derivation had.

The consequences were that every failure signal reported success:

- The hourly GitHub Actions schedule checks only the HTTP status, so it printed "Sync completed successfully" and stayed green on a failed Derivation.
- The admin Sync button rendered its green success message for the same reason.
- The site continued serving stale Progression indefinitely.

This is the failure mode that let the Rotmire bug survive: the boss was killed on 2026-06-17 and the site showed it unkilled for weeks, with no signal that anything was wrong.

Two further properties of the old arrangement mattered:

- The hook fired on *any* write to `guild-details`, not just the route's — a context nobody designed for.
- Both derivation functions read `guild-details` back out of the database rather than receiving it as an argument, so neither could be exercised without a live `Payload` instance.

## Decision

**Derivation moves out of the `afterChange` hook and into the route** as explicit sequential steps. The route owns the whole operation.

**Derivation happens before any write.** The route fetches, derives Progression and Officers in memory, and only then writes. A derivation failure means nothing is written at all.

**A failed Sync returns a non-200 response carrying the stage that failed** — `{ error, stage: "fetch" | "derivation", message }`. Upstream being unavailable and our own logic being wrong are different problems with different responses, and the distinction should not require reading server logs.

**Failures surface in two independent places**, deliberately:

- The GitHub Actions run goes red, because the route now reports failure honestly. This signal is *push* — it arrives without being sought — and it originates outside the system, so it survives the app or database being down.
- A `lastSyncError` field on `guild-details`, written on the failure path and cleared on success. This signal is *pull* and durable; it answers "can I trust what the site is showing right now?" at the moment someone looks at the admin.

Writing `lastSyncError` is an explicit exception to the write-nothing-on-failure rule above. It is metadata describing the Sync attempt, not derived site data.

Derivation takes both the fetched data and the current CMS state as arguments, because the upstream API supplies only the update — the CMS supplies the list of things to update (the season boss list, the officer roster).

## Consequences

Both unattended and operator-triggered Syncs now report failure truthfully, and the two signals cover each other's blind spots: the sticky note is unreachable during a total outage, and the alarm scrolls away into history.

Derivation becomes a pure function of (fetched data, current CMS state) → new state, testable without a database. This is the seam the test-framework work needs, so that issue and this one are served by the same change.

A hand-edit of the hidden `guild-details` JSON field in the admin no longer re-derives Progression. Accepted: the field is `admin: { hidden: true }` and the route is its only real writer.

Atomicity is improved but not total. Derivation failures — logic bugs, upstream shape changes, a missing raid — now occur before any write, which covers the failures that actually happen. A database error partway through the three sequential `updateGlobal` calls could still leave them inconsistent. Not addressed; Payload offers no cross-global transaction here.

A derivation failure now also discards the fresh upstream snapshot that might have helped diagnose it. Accepted as the cost of having no partial-success state.

Alarm noise is a live risk: an hourly schedule means a bad night upstream could produce 24 red runs and train the alarm to be ignored. If that materialises, the response is to tune the alarm — lengthen the schedule interval, or fail only on `stage: "derivation"` so transient upstream failures stay quiet — not to remove it.

## Alternatives considered

**Keep derivation in the hook and let it throw.** Rejected. `afterChange` runs after the write commits, so a throw would report total failure for an operation that did persist fresh data — replacing one misreport with another. It also leaves derivation untestable and still firing on writes nobody intended.

**Return 207 or 200-with-warning on partial failure.** Rejected outright. The workflow's check is `if [ "$response" != "200" ]`, so any 2xx would restore exactly the silent-green blindness being fixed here.

**Sticky note only, no alarm.** Rejected. The alarm already exists in the workflow and fires correctly; suppressing it would mean deliberately keeping the route's 200-on-failure lie. It is also the only signal that survives the database or deployment being down, and the only one that arrives without being sought.
