import type { GlobalConfig } from 'payload'

export const GuildSettings: GlobalConfig = {
  slug: 'guild-settings',
  label: 'Guild Settings',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'tagline', type: 'text' },
    { name: 'server', type: 'text' },
    { name: 'region', type: 'text' },
    { name: 'faction', type: 'text' },
    { name: 'founded', type: 'text' },
    {
      name: 'description',
      type: 'richText',
      admin: { description: 'Guild description shown on the About section. Supports bold, italic, lists, links.' },
    },
    {
      name: 'raidSchedule',
      type: 'array',
      labels: { singular: 'Day', plural: 'Days' },
      fields: [{ name: 'day', type: 'text', required: true }],
    },
    {
      name: 'stats',
      type: 'group',
      fields: [
        { name: 'members', type: 'number', defaultValue: 0 },
        { name: 'cuttingEdge', type: 'number', defaultValue: 0 },
        { name: 'keystoneRuns', type: 'number', defaultValue: 0 },
        { name: 'worldRank', type: 'number', defaultValue: 0 },
      ],
    },
    {
      name: 'footerLinks',
      type: 'array',
      labels: { singular: 'Link', plural: 'Links' },
      admin: { description: 'Links shown in the site footer.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}
