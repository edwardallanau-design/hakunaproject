/**
 * Seed a local development database to a usable state.
 *
 * A freshly migrated database has the right schema and no data, which is not
 * enough to actually run the site: Payload has no admin user to log in with,
 * and there is no Season for guild-settings.currentSeason to point at — several
 * Season fields are `required: true` but are operator-set, never written by the
 * Sync. A brand-new database therefore fails its first Sync at the derivation
 * stage, which is the fresh-database gotcha recorded in LEDGER.md.
 *
 * This script fixes both, then optionally pulls real data from Raider.IO so the
 * site renders something recognisable.
 *
 * Usage:
 *   npm run seed              schema-minimum: admin user + required fields
 *   npm run seed -- --sync    also fetch live guild data from Raider.IO
 *
 * Refuses to run against anything that is not localhost. Seeding is destructive
 * in intent (it creates an admin user with a known password) and must never be
 * pointed at a deployed database by accident.
 */

// Load .env.local then .env, the same precedence Next.js and the Payload CLI
// use. A plain `node` script gets none of this for free, so without it
// DATABASE_URL is simply unset and the guard below reports "(unset)".
//
// @next/env is CommonJS, so it is imported via its default export. The env must
// be loaded before payload.config.ts is evaluated — static imports hoist above
// statements, so the config is pulled in dynamically further down instead.
import nextEnv from '@next/env'
nextEnv.loadEnvConfig(process.cwd(), true)

import { getPayload } from 'payload'

// Must be a valid address shape — Payload validates it even for a local user.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'dev@example.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'devpassword'
const WITH_SYNC = process.argv.includes('--sync')

// --- Guard: localhost only ---------------------------------------------------
const dbUrl = process.env.DATABASE_URL ?? ''
const host = dbUrl ? new URL(dbUrl).hostname : ''
if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
  console.error(
    `Refusing to seed: DATABASE_URL host is "${host || '(unset)'}", not localhost.\n` +
      `This script creates an admin user with a known password and must only run locally.`,
  )
  process.exit(1)
}

// Imported dynamically so it is evaluated after the env is loaded and after the
// localhost guard has passed — the config reads DATABASE_URL at module scope.
const { default: config } = await import('../src/payload.config.ts')

const payload = await getPayload({ config: await config })
console.log(`Seeding ${host}...\n`)

// --- Admin user --------------------------------------------------------------
const { totalDocs: userCount } = await payload.count({ collection: 'users' })
if (userCount === 0) {
  await payload.create({
    collection: 'users',
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })
  console.log(`  admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
} else {
  console.log(`  admin user: ${userCount} already exist(s), left alone`)
}

// --- Guild settings ----------------------------------------------------------
// `name` is required, so the global cannot be saved without it.
const settings = await payload.findGlobal({ slug: 'guild-settings' })
if (!settings?.name) {
  await payload.updateGlobal({
    slug: 'guild-settings',
    data: {
      name: process.env.GUILD_NAME ?? 'Potato Corner',
      server: process.env.GUILD_REALM ?? 'Barthilas',
      region: (process.env.GUILD_REGION ?? 'us').toUpperCase(),
      faction: 'Horde',
      tagline: 'Local development',
    },
  })
  console.log('  guild-settings: seeded')
} else {
  console.log(`  guild-settings: already set ("${settings.name}"), left alone`)
}

// --- Season ------------------------------------------------------------------
// The site renders from the current Season (via guild-settings.currentSeason),
// not the retired `progression` global. A fresh database has neither, so the
// first Sync would fail at the derivation stage with no Season to write to.
//
// The migration that adds the Seasons collection also inserts a Season 1 row
// from the committed snapshot — but on a bare database it cannot also point
// guild-settings at it, because that row does not exist until Payload writes
// it for the first time (which this script does, just above). So: reuse an
// existing Season if one is already there (from the migration) rather than
// creating a second one, which would collide on the unique urlSlug.
let currentSeasonId = settings?.currentSeason
if (typeof currentSeasonId === 'object' && currentSeasonId !== null) {
  currentSeasonId = currentSeasonId.id
}
if (!currentSeasonId) {
  const { docs: existingSeasons } = await payload.find({ collection: 'seasons', limit: 1 })
  const season =
    existingSeasons[0] ??
    (await payload.create({
      collection: 'seasons',
      data: {
        name: 'Midnight Season 1',
        urlSlug: 'season-1',
        themeSlug: 'void',
        startedAt: new Date('2026-01-01').toISOString(),
        raidSlugs: [{ slug: 'tier-mn-1' }, { slug: 'sporefall' }],
        rankSourceRaidSlug: 'tier-mn-1',
        mythicPlusSeasonSlug: 'season-mn-1',
        difficulty: 'Mythic',
      },
    }))
  await payload.updateGlobal({ slug: 'guild-settings', data: { currentSeason: season.id } })
  currentSeasonId = season.id
  console.log(
    existingSeasons[0]
      ? `  seasons: pointed current Season at existing "${season.name}" (migration had already created it)`
      : `  seasons: seeded "${season.name}" and set as current (required, and not sync-derived)`,
  )
} else {
  console.log(`  seasons: current Season already set (id ${currentSeasonId}), left alone`)
}

// --- Optional: real data from Raider.IO ---------------------------------------
if (WITH_SYNC) {
  console.log('\n  syncing from Raider.IO...')
  const { fetchAndTransformGuildDetails } = await import('../src/lib/raiderio.ts')
  const { deriveProgression } = await import('../src/lib/syncProgression.ts')
  const { deriveOfficers } = await import('../src/lib/syncOfficers.ts')

  const details = await fetchAndTransformGuildDetails()

  const currentSeason = await payload.findByID({ collection: 'seasons', id: currentSeasonId })
  const derivedProgression = deriveProgression(details, {
    bosses: currentSeason.bosses ?? [],
    kills: currentSeason.kills ?? 0,
    totalBosses: currentSeason.totalBosses ?? 0,
    rankings: currentSeason.rankings,
    mythicPlusRunners: currentSeason.mythicPlusRunners ?? [],
    mythicPlusParticipants: currentSeason.mythicPlusParticipants ?? [],
    raidSlugs: (currentSeason.raidSlugs ?? []).map((r) => r.slug),
    rankSourceRaidSlug: currentSeason.rankSourceRaidSlug,
  })

  const officersGlobal = await payload.findGlobal({ slug: 'officers-section' })
  const derivedOfficers = deriveOfficers(details, officersGlobal.officers ?? [])

  await payload.updateGlobal({
    slug: 'guild-details',
    data: { details, lastSyncedAt: new Date().toISOString(), lastSyncError: null },
  })
  await payload.update({ collection: 'seasons', id: currentSeasonId, data: derivedProgression })
  await payload.updateGlobal({
    slug: 'officers-section',
    data: { officers: derivedOfficers },
  })

  console.log(
    `  synced: ${derivedProgression.kills}/${derivedProgression.totalBosses} bosses, ` +
      `${derivedOfficers.length} officers, ` +
      `${derivedProgression.mythicPlusRunners?.length ?? 0} M+ runners, ` +
      `${derivedProgression.mythicPlusParticipants?.length ?? 0} M+ participants`,
  )
}

console.log('\nDone. Start the site with `npm run dev` and log in at /admin.')
process.exit(0)
