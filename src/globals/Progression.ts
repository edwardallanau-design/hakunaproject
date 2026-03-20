import type { GlobalConfig } from 'payload'

export const Progression: GlobalConfig = {
  slug: 'progression',
  label: 'Progression',
  fields: [
    { name: 'tier', type: 'text', required: true },
    { name: 'season', type: 'text' },
    { name: 'mythicKills', type: 'number', defaultValue: 0 },
    { name: 'totalBosses', type: 'number', defaultValue: 8 },
    {
      name: 'bosses',
      type: 'array',
      labels: { singular: 'Boss', plural: 'Bosses' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'mythic', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}
