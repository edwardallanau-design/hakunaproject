/**
 * One-shot: create the Season 2 row and make it current.
 *
 * This is `.scratch/season-rollover/issues/09`. From the moment the
 * `currentSeason` pointer moves, Season 1 is archived and unreachable by any
 * Sync — so the row is created and fully configured *first*, and the pointer
 * moves last, in that order, deliberately.
 *
 * ## Everything here came from a real upstream response
 *
 * The ticket's whole reason for existing is that Season 2's identity could not
 * be guessed. It was right. Captured live on 2026-08-25 from
 * `raider.io/api/guilds/details`:
 *
 *   - **The Rank Source guess was wrong.** The ticket carried `tier-mn-2` as a
 *     placeholder. That slug does not exist upstream. The real Season 2 raid is
 *     `the-venomous-abyss`. Had the row been created from the guess, every Sync
 *     would have thrown on the missing rank source — loudly, per ADR 0003/0006,
 *     which is the failure mode working, but still a failure.
 *   - **A fourth raid appeared that nobody anticipated**: `the-tidebound-grotto`,
 *     a one-boss raid (Nymrissa Wavecaller), AOTC 2026-08-24. The operator
 *     confirmed it belongs to Season 2, ordered after the Abyss — the same
 *     shape as Season 1's `tier-mn-1` + `sporefall`.
 *   - **The boss list is typed by hand**, per the ticket. The API omits
 *     un-pulled encounters, so nothing upstream can be trusted to generate it.
 *     The eight Abyss names below are the full roster in encounter order,
 *     confirmed against the normal-difficulty clear (all 8 present), plus
 *     Grotto's single boss last.
 *
 * Rank source is `the-venomous-abyss` (operator decision, 2026-08-25): ranks
 * cannot merge across raids per ADR 0003, and the main tier is what Season 1
 * used.
 *
 * ## Kill data is deliberately NOT seeded here
 *
 * Every boss is created unkilled with no dates. The Season is currently 0/9 on
 * *mythic*, which is what the site tracks — the 4/8 heroic and 8/8 normal
 * progress upstream is real but not what `deriveProgression` reads. The first
 * Sync after this script fills in mythic kills, pull counts and best-pull
 * percentages from the live API. Typing kill data by hand here would invent
 * history the Sync is about to derive correctly.
 *
 * Usage
 * -----
 *   node --import @swc-node/register/esm-register scripts/create-season-2.mjs
 *   node --import @swc-node/register/esm-register scripts/create-season-2.mjs --commit
 *
 * Verify-only by default: prints exactly what it would create and change.
 * Re-running after a successful commit reports the row already exists and exits
 * 0 without touching it, so the script is inert after first use.
 */

import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), true);

import { getPayload } from "payload";

const COMMIT = process.argv.includes("--commit");

const SEASON_2 = {
  name: "The Curse of Ula'tek",
  urlSlug: "season-2",
  themeSlug: "venom",
  // Patch 12.1 launch. The raid opened ~08-17; the guild's first normal kills
  // are timestamped 2026-08-20.
  startedAt: "2026-08-12T00:00:00.000Z",
  raidSlugs: [{ slug: "the-venomous-abyss" }, { slug: "the-tidebound-grotto" }],
  rankSourceRaidSlug: "the-venomous-abyss",
  mythicPlusSeasonSlug: "season-mn-2",
  difficulty: "Mythic",
};

// Encounter order within each raid, Abyss then Grotto. Hand-typed per the
// ticket — the upstream response cannot be trusted to enumerate un-pulled
// bosses.
const BOSSES = [
  "Nek'zali the Soulcoiler",
  "Entombed Sentinels",
  "The Lost Explorers",
  "Vashnik the Malignant",
  "Sszorak",
  "The Twin Fangs",
  "The Coiled Altar",
  "Ula'tek",
  "Nymrissa Wavecaller",
];

const dbUrl = process.env.DATABASE_URL ?? "";
const host = dbUrl ? new URL(dbUrl).hostname : "(unset)";
console.log(`Database host: ${host}`);
console.log(`Mode: ${COMMIT ? "COMMIT — will write" : "verify only (pass --commit to write)"}\n`);

const { default: config } = await import("../src/payload.config.ts");
const payload = await getPayload({ config: await config });

// ── Verify: is there already a Season 2? ────────────────────────────────────
const existing = await payload.find({
  collection: "seasons",
  where: { urlSlug: { equals: SEASON_2.urlSlug } },
  limit: 1,
});

if (existing.docs.length > 0) {
  const row = existing.docs[0];
  console.log(`Season "${SEASON_2.urlSlug}" already exists (id ${row.id}, "${row.name}").`);
  console.log("Nothing to do — this script is a one-shot and is inert after first use.");
  process.exit(0);
}

// ── Verify: what is current now? ────────────────────────────────────────────
const settings = await payload.findGlobal({ slug: "guild-settings" });
const currentRef = settings.currentSeason;
const currentId =
  currentRef && typeof currentRef === "object" ? currentRef.id : (currentRef ?? null);
const currentRow = currentId
  ? await payload.findByID({ collection: "seasons", id: currentId })
  : null;

console.log(
  currentRow
    ? `Current Season is id ${currentRow.id} — "${currentRow.name}" (${currentRow.urlSlug}, theme ${currentRow.themeSlug})`
    : "Current Season pointer is EMPTY.",
);

console.log("\nWould create:");
console.log(`  name                 ${SEASON_2.name}`);
console.log(`  urlSlug              ${SEASON_2.urlSlug}`);
console.log(`  themeSlug            ${SEASON_2.themeSlug}`);
console.log(`  startedAt            ${SEASON_2.startedAt}`);
console.log(`  raidSlugs            ${SEASON_2.raidSlugs.map((r) => r.slug).join(", ")}`);
console.log(`  rankSourceRaidSlug   ${SEASON_2.rankSourceRaidSlug}`);
console.log(`  mythicPlusSeasonSlug ${SEASON_2.mythicPlusSeasonSlug}`);
console.log(`  difficulty           ${SEASON_2.difficulty}`);
console.log(`  bosses               ${BOSSES.length}, all unkilled:`);
for (const [i, b] of BOSSES.entries()) console.log(`      ${String(i + 1).padStart(2)}  ${b}`);
console.log(`\nWould then move guild-settings.currentSeason to the new row.`);

if (!COMMIT) {
  console.log("\nVerify only — nothing written. Re-run with --commit to apply.");
  process.exit(0);
}

// ── Commit: create fully configured, THEN move the pointer ──────────────────
// Order matters. A half-built Season must never be current, so the row is
// complete before anything points at it.
const created = await payload.create({
  collection: "seasons",
  data: {
    ...SEASON_2,
    bosses: BOSSES.map((name) => ({
      name,
      killed: false,
      firstDefeated: null,
      pulls: null,
      bestPull: null,
    })),
    kills: 0,
    totalBosses: BOSSES.length,
    rankings: { members: 0, world: 0, region: 0, realm: 0 },
    mythicPlusRunners: [],
    mythicPlusParticipants: [],
  },
});
console.log(`\nCreated Season 2 as id ${created.id} with ${created.bosses?.length ?? 0} bosses.`);

await payload.updateGlobal({
  slug: "guild-settings",
  data: { currentSeason: created.id },
});
console.log(`Moved guild-settings.currentSeason to id ${created.id}.`);

// ── Re-verify independently ─────────────────────────────────────────────────
const after = await payload.findGlobal({ slug: "guild-settings" });
const afterRef = after.currentSeason;
const afterId = afterRef && typeof afterRef === "object" ? afterRef.id : afterRef;
const afterRow = await payload.findByID({ collection: "seasons", id: afterId });
console.log(
  `\nVerified: current Season is now id ${afterRow.id} — "${afterRow.name}" ` +
    `(${afterRow.urlSlug}, theme ${afterRow.themeSlug}, ${afterRow.kills}/${afterRow.totalBosses}).`,
);
console.log("Season 1 is now archived and no longer a Sync target.");

process.exit(0);
