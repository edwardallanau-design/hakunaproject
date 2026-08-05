# 2. Validate the upstream response at the fetch boundary

Date: 2026-08-04

## Status

Accepted

## Context

`raiderio.ts` trusts the shape of the Raider.IO response completely. `GuildDetailsData` is a compile-time assertion — TypeScript believes it, but nothing verifies it at runtime.

The only runtime guards are three hand-written existence checks covering the "guild was renamed" case, added because that failure was actually encountered. Everything else is unchecked: the transform destructures `encountersDefeated` and iterates `Object.entries` over it, so an upstream key rename surfaces as `Cannot read properties of undefined` several layers inside a transform rather than at the boundary.

The immediate symptom recorded in the ledger — Raider.IO returns `subregion`, which Payload silently strips — is minor on its own. It is a signal of the larger absence.

This matters more under ADR 0001. Derivation failures now block all writes and turn the schedule red, so the quality of the error message is load-bearing: it is what an operator reads when a Sync fails unattended.

## Decision

Validate the upstream response with **Zod** at the fetch boundary, before any transform runs.

**Scope the schema to consumed fields only.** Do not attempt to model Raider.IO's full response. Fields the app does not read are not modelled, and Zod's default stripping of unknown keys is the desired behaviour — `subregion` is discarded deliberately rather than by accident two layers downstream.

**Derive the TypeScript types from the schema** rather than declaring them separately, so the runtime check and the compile-time type cannot drift apart.

**Be permissive where the app already tolerates absence.** `raidAttempt` is consumed as `raidAttempt?.encounters ?? {}`, so it is optional in the schema. Strictness should match what the code actually requires, not exceed it.

## Consequences

A malformed or changed upstream response fails at the boundary, with a message naming the exact path that failed, instead of throwing from inside a transform.

`GuildDetailsData` stops being a fiction. The type is inferred from the schema, so it describes what was actually verified.

The schema is the only thing that catches upstream contract drift. Tests run against frozen fixtures and verify our logic against a world that may no longer exist; only runtime validation notices when Raider.IO changes. These are different jobs and neither substitutes for the other.

Zod is a genuinely new dependency — it appears nowhere in the current lockfile. Server-only, so no client bundle impact.

Validation is stricter than before, so Syncs can now fail on responses the old code tolerated. Combined with ADR 0001's loud failures, this could produce noise before it produces safety. Mitigated by scoping the schema to consumed fields and keeping optionality aligned with actual usage.

## Alternatives considered

**More hand-written guards.** Rejected. This is what exists today, it is what failed to catch this class of problem, and every new field is another check someone must remember to write.

**Model the full upstream response.** Rejected. Large, and it creates an obligation to track fields the app never reads.
