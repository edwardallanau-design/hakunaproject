import type { GlobalConfig } from 'payload'

export const Progression: GlobalConfig = {
  slug: 'progression',
  label: 'Progression',
  admin: {},
  fields: [
    { name: 'tier', type: 'text', required: true },
    { name: 'difficulty', type: 'select', options: ['Normal', 'Heroic', 'Mythic'], defaultValue: 'Heroic' },
    { name: 'summary', type: 'text', admin: { description: 'e.g. "6/9 H" — auto-filled by Raider.IO sync' } },
    { name: 'profileUrl', type: 'text', admin: { description: 'Raider.IO profile URL' } },
    { name: 'lastSyncedAt', type: 'date', admin: { description: 'Last time data was synced from Raider.IO', readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'kills', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'totalBosses', type: 'number', defaultValue: 9, admin: { readOnly: true } },
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
        { name: 'pulls', type: 'number', admin: { description: 'Number of pulls (for in-progress bosses)', readOnly: true } },
        { name: 'bestPull', type: 'number', admin: { description: 'Best pull % (for in-progress bosses)', readOnly: true } },
      ],
    },
    {
      name: 'guildMembers',
      type: 'json',
      admin: { hidden: true },
    },
    {
      name: 'mythicPlusRunners',
      type: 'array',
      labels: { singular: 'Runner', plural: 'Runners' },
      admin: {
        initCollapsed: true,
        description: 'Top 10 M+ runners — auto-filled by Raider.IO sync or add manually',
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
  ],
}
