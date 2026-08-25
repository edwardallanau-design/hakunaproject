import type { CollectionConfig } from 'payload'
import { THEME_OPTIONS } from '../lib/themes'

export const Seasons: CollectionConfig = {
  slug: 'seasons',
  labels: { singular: 'Season', plural: 'Seasons' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'urlSlug', 'startedAt'],
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
        { name: 'killed', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
        { name: 'firstDefeated', type: 'date', admin: { description: 'Date the boss was first killed on mythic', readOnly: true } },
        { name: 'pulls', type: 'number', admin: { description: 'Total pulls — auto-set at time of kill and frozen, or live pull count while in progress', readOnly: true } },
        { name: 'bestPull', type: 'number', admin: { description: 'Best pull % (in-progress bosses only — auto-updated by sync until killed)', readOnly: true } },
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
        description: 'Every Character with an M+ score this Season, not just the displayed top 10. Archival — roughly 585+ rows, so this is JSON rather than an array to keep the admin edit screen usable. Correcting it requires a script.',
      },
    },
  ],
}
