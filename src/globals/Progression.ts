import type { GlobalConfig } from 'payload'

export const Progression: GlobalConfig = {
  slug: 'progression',
  label: 'Progression',
  admin: {
    components: {
      elements: {
        beforeDocumentControls: ['/components/admin/SyncProgressionButton'],
      },
    },
  },
  fields: [
    { name: 'tier', type: 'text', required: true },
    { name: 'difficulty', type: 'select', options: ['Normal', 'Heroic', 'Mythic'], defaultValue: 'Heroic' },
    { name: 'summary', type: 'text', admin: { description: 'e.g. "6/9 H" — auto-filled by Raider.IO sync' } },
    { name: 'kills', type: 'number', defaultValue: 0 },
    { name: 'totalBosses', type: 'number', defaultValue: 9 },
    { name: 'profileUrl', type: 'text', admin: { description: 'Raider.IO profile URL' } },
    {
      name: 'rankings',
      type: 'group',
      fields: [
        { name: 'members', type: 'number', defaultValue: 0, admin: { description: 'Auto-filled by sync — total guild member count' } },
        { name: 'world', type: 'number', defaultValue: 0 },
        { name: 'region', type: 'number', defaultValue: 0 },
        { name: 'realm', type: 'number', defaultValue: 0 },
      ],
    },
    {
      name: 'bosses',
      type: 'array',
      labels: { singular: 'Boss', plural: 'Bosses' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'killed', type: 'checkbox', defaultValue: false },
        { name: 'pulls', type: 'number', admin: { description: 'Number of pulls (for in-progress bosses)' } },
        { name: 'bestPull', type: 'number', admin: { description: 'Best pull % (for in-progress bosses)' } },
      ],
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      admin: { description: 'Last time data was synced from Raider.IO', readOnly: true },
    },
    {
      name: 'guildMembers',
      type: 'json',
      admin: { hidden: true },
    },
    {
      name: 'mythicPlusSync',
      type: 'ui',
      admin: {
        components: { Field: '/components/admin/SyncMythicRunnersButton' },
      },
    },
    {
      name: 'mythicPlusRunners',
      type: 'array',
      labels: { singular: 'Runner', plural: 'Runners' },
      admin: {
        description: 'Top 10 M+ runners — auto-filled by Raider.IO sync or add manually',
        components: {
          RowLabel: '/components/admin/MythicPlusRunnerRowLabel',
        },
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'sync',
          type: 'ui',
          admin: {
            components: {
              Field: '/components/admin/MythicPlusRunnerSyncButton',
            },
          },
        },
        { name: 'class', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'spec', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'score', type: 'number', required: true, admin: { readOnly: true } },
      ],
    },
    {
      name: 'mythicPlusSyncedAt',
      type: 'date',
      admin: { description: 'Last time M+ data was synced from Raider.IO', readOnly: true },
    },
  ],
}
