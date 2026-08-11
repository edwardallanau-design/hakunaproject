/**
 * Snapshot Season 1's `progression` global to a committed JSON file, shaped as
 * the Season row it will become (ticket 03).
 *
 * Per ADR 0005, this is the only faithful record of Season 1 that will ever
 * exist. Raider.IO stores M+ scores per Character, not per Guild — any
 * guild-scoped historical query is recomputed from *present* membership, so a
 * Participant who leaves the Guild silently vanishes from their own Season's
 * record, and a Guild rename (already happened once here) breaks the lookup
 * entirely. There is no second chance to capture this.
 *
 * Participants (every roster member with a score, not just the displayed top
 * ten) are derived from the `guild-details` global's stored `details` payload
 * — the same roster the last real Sync fetched — rather than from a fresh
 * Raider.IO request. That payload is Season-1-faithful and frozen; a live
 * fetch today would already reflect roster drift. No upstream request is made
 * by this script.
 *
 * Usage:
 *   npm run snapshot:season-1
 *
 * Deliberately targets production and does NOT carry the seed script's
 * refuse-if-not-localhost guard — the seed script must never touch a deployed
 * database, this script must only ever touch one. Do not add that guard here.
 */

// Same load-then-dynamic-import pattern as scripts/seed-local.mjs: @next/env
// populates DATABASE_URL before payload.config.ts (which reads it at module
// scope) is evaluated. A static import would hoist above the load and see an
// empty DATABASE_URL.
import nextEnv from '@next/env'
nextEnv.loadEnvConfig(process.cwd(), true)

import { getPayload } from 'payload'
import { writeFile } from 'fs/promises'
import path from 'path'

const OUTPUT_PATH = path.resolve(process.cwd(), '.scratch/season-rollover/season-1-snapshot.json')

const { default: config } = await import('../src/payload.config.ts')

const payload = await getPayload({ config: await config })

const [progression, guildDetails] = await Promise.all([
  payload.findGlobal({ slug: 'progression' }),
  payload.findGlobal({ slug: 'guild-details' }),
])

const details = guildDetails?.details
if (!details?.members) {
  console.error('Refusing to snapshot: guild-details.details has no members. Run a Sync first.')
  process.exit(1)
}

// Same "every member with a score" filter deriveProgression uses for the
// displayed top ten (syncProgression.ts), but unsliced — every Participant,
// not just the top ten.
const mythicPlusParticipants = details.members
  .filter((m) => m.keystoneScores?.allScore > 0)
  .sort((a, b) => b.keystoneScores.allScore - a.keystoneScores.allScore)
  .map((m) => ({
    name: m.character.name,
    class: m.character.class.name,
    spec: m.character.spec.name,
    score: m.keystoneScores.allScore,
  }))

// No authoritative Season 1 start date is recorded anywhere upstream or in the
// CMS. Shipped as a 2026-01-01 placeholder; the real date was operator-confirmed
// on 2026-08-11 and corrected everywhere by scripts/correct-season-1-started-at.mjs.
const SEASON_1_STARTED_AT = '2026-03-17T00:00:00.000Z'

const snapshot = {
  name: progression.tier,
  urlSlug: 'season-1',
  themeSlug: 'void',
  startedAt: SEASON_1_STARTED_AT,
  raidSlugs: ['tier-mn-1', 'sporefall'],
  rankSourceRaidSlug: 'tier-mn-1',
  mythicPlusSeasonSlug: 'season-mn-1',
  difficulty: progression.difficulty,
  summary: progression.summary,
  profileUrl: progression.profileUrl,
  lastSyncedAt: progression.lastSyncedAt,
  kills: progression.kills,
  totalBosses: progression.totalBosses,
  rankings: progression.rankings,
  bosses: progression.bosses ?? [],
  mythicPlusRunners: progression.mythicPlusRunners ?? [],
  mythicPlusParticipants,
}

await writeFile(OUTPUT_PATH, JSON.stringify(snapshot, null, 2) + '\n', 'utf-8')

console.log(`Snapshot written to ${OUTPUT_PATH}`)
console.log(
  `  ${snapshot.kills}/${snapshot.totalBosses} bosses, ` +
    `rankings ${JSON.stringify(snapshot.rankings)}, ` +
    `${mythicPlusParticipants.length} M+ participants (top 10 shown: ${snapshot.mythicPlusRunners.length})`,
)

process.exit(0)
