/**
 * Seed a local development database to a usable state.
 *
 * A freshly migrated database has the right schema and no data, which is not
 * enough to actually run the site: Payload has no admin user to log in with,
 * and `Progression.tier` is `required: true` but is never set by the Sync — it
 * is operator-set. A brand-new database therefore fails its first Sync at the
 * write stage, which is the fresh-database gotcha recorded in LEDGER.md.
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

// --- Progression -------------------------------------------------------------
// `tier` is required but operator-set, never written by the Sync. Without it the
// first Sync fails at the write stage on an otherwise healthy database.
const progression = await payload.findGlobal({ slug: 'progression' })
if (!progression?.tier) {
  await payload.updateGlobal({
    slug: 'progression',
    data: { tier: 'Midnight Season 1', difficulty: 'Mythic' },
  })
  console.log('  progression.tier: seeded (required, and not sync-derived)')
} else {
  console.log(`  progression.tier: already set ("${progression.tier}"), left alone`)
}

// --- Optional: real data from Raider.IO ---------------------------------------
if (WITH_SYNC) {
  console.log('\n  syncing from Raider.IO...')
  const { fetchAndTransformGuildDetails } = await import('../src/lib/raiderio.ts')
  const { deriveProgression } = await import('../src/lib/syncProgression.ts')
  const { deriveOfficers } = await import('../src/lib/syncOfficers.ts')

  const details = await fetchAndTransformGuildDetails()

  const current = await payload.findGlobal({ slug: 'progression' })
  const derivedProgression = deriveProgression(details, {
    bosses: current.bosses ?? [],
    kills: current.kills ?? 0,
    totalBosses: current.totalBosses ?? 0,
    rankings: current.rankings,
    mythicPlusRunners: current.mythicPlusRunners ?? [],
  })

  const officersGlobal = await payload.findGlobal({ slug: 'officers-section' })
  const derivedOfficers = deriveOfficers(details, officersGlobal.officers ?? [])

  await payload.updateGlobal({
    slug: 'guild-details',
    data: { details, lastSyncedAt: new Date().toISOString(), lastSyncError: null },
  })
  await payload.updateGlobal({ slug: 'progression', data: derivedProgression })
  await payload.updateGlobal({
    slug: 'officers-section',
    data: { officers: derivedOfficers },
  })

  console.log(
    `  synced: ${derivedProgression.kills}/${derivedProgression.totalBosses} bosses, ` +
      `${derivedOfficers.length} officers, ` +
      `${derivedProgression.mythicPlusRunners?.length ?? 0} M+ runners`,
  )
}

console.log('\nDone. Start the site with `npm run dev` and log in at /admin.')
process.exit(0)
