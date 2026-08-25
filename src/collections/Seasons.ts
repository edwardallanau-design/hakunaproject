import type { Access, CollectionConfig, Field } from 'payload'
import { THEME_OPTIONS } from '../lib/themes'

// Per-difficulty progress for one boss, for the difficulties that are NOT
// mythic. Mythic lives in the flat fields alongside these, for the historical
// reason noted at the boss field below.
const difficultyGroups: Field[] = (['normal', 'heroic'] as const).map((difficulty) => ({
  name: difficulty,
  type: 'group',
  label: difficulty === 'normal' ? 'Normal' : 'Heroic',
  admin: {
    description: `Progress on ${difficulty} difficulty. Auto-filled by the Raider.IO sync and frozen once killed, like mythic above.`,
  },
  fields: [
    { name: 'killed', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
    {
      name: 'firstDefeated',
      type: 'date',
      admin: { description: `Date the boss was first killed on ${difficulty}`, readOnly: true },
    },
    {
      name: 'pulls',
      type: 'number',
      admin: { description: 'Total pulls — frozen at time of kill, or live while in progress', readOnly: true },
    },
    {
      name: 'bestPull',
      type: 'number',
      admin: { description: 'Best pull % (in-progress only — cleared once killed)', readOnly: true },
    },
  ],
}))

// Ranks for the non-mythic difficulties; mythic stays in the flat `rankings`
// group. Same asymmetry, same reason.
const rankingsByDifficulty: Field[] = (['normal', 'heroic'] as const).map((difficulty) => ({
  name: `rankings${difficulty === 'normal' ? 'Normal' : 'Heroic'}`,
  type: 'group',
  label: `Rankings — ${difficulty === 'normal' ? 'Normal' : 'Heroic'}`,
  admin: {
    description: `World/region/realm ranks on ${difficulty}, from the Rank Source Raid. Auto-filled by sync.`,
  },
  fields: [
    { name: 'world', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'region', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'realm', type: 'number', defaultValue: 0, admin: { readOnly: true } },
  ],
}))

/**
 * Only the current Season can be changed from the admin panel.
 *
 * ADR 0005 freezes archived Seasons, and the Sync has enforced that in code
 * since — but the admin panel did not, so Season 1 sat there fully editable
 * with nothing but care standing between it and a typo. Its 595 M+ participants
 * are the least recoverable data in the project: two of those members
 * (Exyie, Brunogarzz) no longer exist upstream, so a bad write cannot be
 * repaired by re-syncing.
 *
 * "Archived" is not a stored flag — it is *not being the Season that
 * `guild-settings.currentSeason` points at*, which is the same definition the
 * page and the Sync already use. Returning a `Where` rather than a boolean lets
 * Payload apply it per document, so the current Season stays editable and every
 * other one renders read-only.
 *
 * **The Sync is unaffected.** It writes through the Local API, which defaults to
 * `overrideAccess: true`; the `current.isArchived` branches in
 * `syncProgression.ts` are what protect archived rows there (covered by
 * `syncArchiveSafety.test.ts`), and they are untouched by this.
 *
 * **To edit an archived Season deliberately**, point `currentSeason` at it, make
 * the change, and point it back — or write a script, as
 * `correct-season-1-started-at.mjs` did. Both are awkward on purpose.
 */
const onlyCurrentSeason: Access = async ({ req }) => {
  const settings = await req.payload.findGlobal({ slug: 'guild-settings', depth: 0 })
  const ref = settings.currentSeason
  const currentId = ref && typeof ref === 'object' ? ref.id : ref
  // No pointer configured is a broken install, not a reason to lock the whole
  // collection — that would leave nobody able to set the pointer.
  if (currentId === null || currentId === undefined) return true
  return { id: { equals: currentId } }
}

export const Seasons: CollectionConfig = {
  slug: 'seasons',
  labels: { singular: 'Season', plural: 'Seasons' },
  access: {
    update: onlyCurrentSeason,
    // Delete is locked with it. A Season that cannot be corrected but can be
    // destroyed is the worst of both, and deletion is the less recoverable of
    // the two accidents.
    delete: onlyCurrentSeason,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'urlSlug', 'startedAt'],
    description:
      '⚠ Written by the hourly Raider.IO Sync — not by hand. Almost every field here is auto-filled and read-only, and the values feed the live site directly. ' +
      'Archived Seasons are locked: only the Season that Guild Settings → Current Season points at can be edited at all. ' +
      'If something looks wrong, run the Sync from Guild Details rather than typing over it — a hand edit is overwritten within the hour, or worse, is not.',
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'Display label, e.g. "Midnight Season 1".' } },
    {
      name: 'urlSlug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Identifies this Season in the site switcher URL. Not a Raid slug or the M+ season slug.' },
    },
    {
      name: 'themeSlug',
      type: 'select',
      required: true,
      // Options come from the theme manifest rather than a second hand-typed
      // list, so a theme cannot exist in the dropdown without existing in code.
      // Note this is stored as a pg enum: adding a theme costs an enum-value
      // migration (ADR 0007).
      options: THEME_OPTIONS,
      admin: {
        description:
          "Selects this Season's theme — the whole look, not just colours: palette, fonts, and any backdrop, motifs and key art the theme defines. Themes are built in code and added by a pull request; see src/lib/themes.ts.",
      },
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
      admin: { description: 'Orders the switcher. Not the same as row order.', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'raidSlugs',
      type: 'array',
      labels: { singular: 'Raid slug', plural: 'Raid slugs' },
      admin: { description: 'Raider.IO Raid slugs that contribute kills to this Season, e.g. "tier-mn-1", "sporefall".' },
      fields: [{ name: 'slug', type: 'text', required: true }],
    },
    {
      name: 'rankSourceRaidSlug',
      type: 'text',
      required: true,
      admin: { description: 'The Raid slug (from raidSlugs) whose world/region/realm ranks are shown. Per ADR 0006 — absence from a non-empty rankings response fails the Sync loudly rather than silently.' },
    },
    {
      name: 'mythicPlusSeasonSlug',
      type: 'text',
      required: true,
      admin: { description: 'Raider.IO M+ season slug this Season\'s scores came from, e.g. "season-mn-1". Provenance only — never used to pin the live fetch, per ADR 0005.' },
    },
    { name: 'difficulty', type: 'select', options: ['Normal', 'Heroic', 'Mythic'], defaultValue: 'Heroic' },
    { name: 'summary', type: 'text', admin: { description: 'e.g. "6/9 H" — auto-filled by Raider.IO sync' } },
    { name: 'profileUrl', type: 'text', admin: { description: 'Raider.IO profile URL' } },
    { name: 'lastSyncedAt', type: 'date', admin: { description: 'Last time data was synced from Raider.IO', readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'kills', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'totalBosses', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    {
      name: 'rankings',
      type: 'group',
      fields: [
        { name: 'members', type: 'number', defaultValue: 0, admin: { description: 'Auto-filled by sync — level 90 characters with an IO score or raid kill', readOnly: true } },
        { name: 'world', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'region', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'realm', type: 'number', defaultValue: 0, admin: { readOnly: true } },
      ],
    },
    ...rankingsByDifficulty,
    {
      name: 'bosses',
      type: 'array',
      labels: { singular: 'Boss', plural: 'Bosses' },
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '/components/admin/BossRowLabel',
        },
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        // The flat fields below are canonical MYTHIC. Normal and heroic live in
        // their own groups underneath. The asymmetry is deliberate: these
        // fields predate difficulty tracking and Season 1's rows hold mythic
        // data in them, so restructuring would mean a backfill over a frozen
        // archive (ADR 0005). Adding groups touches no existing column.
        { name: 'killed', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
        { name: 'firstDefeated', type: 'date', admin: { description: 'Date the boss was first killed on mythic', readOnly: true } },
        { name: 'pulls', type: 'number', admin: { description: 'Total pulls — auto-set at time of kill and frozen, or live pull count while in progress', readOnly: true } },
        { name: 'bestPull', type: 'number', admin: { description: 'Best pull % (in-progress bosses only — auto-updated by sync until killed)', readOnly: true } },
        ...difficultyGroups,
      ],
    },
    {
      name: 'mythicPlusRunners',
      type: 'array',
      labels: { singular: 'Runner', plural: 'Runners' },
      admin: {
        initCollapsed: true,
        description: 'Top 10 M+ runners shown on the site — auto-filled by Raider.IO sync or add manually',
        components: {
          RowLabel: '/components/admin/MythicPlusRunnerRowLabel',
        },
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'class', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'spec', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'score', type: 'number', required: true, admin: { readOnly: true } },
      ],
    },
    {
      name: 'mythicPlusParticipants',
      type: 'json',
      admin: {
        // Hidden from the admin panel entirely (operator decision, 2026-08-25).
        // This is a write-once archive: the Sync writes it, the Sync reads it
        // back to honour the archived-Season freeze, and nothing renders it.
        // Nobody should be editing it by hand, so showing a 46 kB JSON blob in
        // an edit screen only invited someone to try.
        //
        // `hidden` affects the panel, not the data — the column, the Sync and
        // the archive guard are untouched, and `payload.find` still returns it.
        //
        // **It stays JSON, deliberately.** Bosses and runners are relational
        // because they are rendered and hand-edited (19 and 20 rows). This is
        // 758 rows across two Seasons, rendered nowhere and edited never, and
        // moving it would spend migration risk on Season 1's 595 archived
        // entries — the least recoverable data in the project, two of whose
        // members Raider.IO has already dropped.
        hidden: true,
        description: 'Every Character with an M+ score this Season, not just the displayed top 10. Archival. Correcting it requires a script.',
      },
    },
  ],
}
