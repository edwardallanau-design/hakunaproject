import type { GlobalConfig } from 'payload'

const WOW_CLASSES = [
  'Death Knight', 'Demon Hunter', 'Druid', 'Evoker', 'Hunter',
  'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior',
]

export const OfficersSection: GlobalConfig = {
  slug: 'officers-section',
  label: 'Officers Section',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: '◆ The Vanguard ◆',
      admin: { description: 'Small label above the section heading.' },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Guild Officers',
      admin: { description: 'Main section heading.' },
    },
    {
      name: 'officers',
      type: 'array',
      label: 'Officers',
      labels: { singular: 'Officer', plural: 'Officers' },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'sync',
          type: 'ui',
          admin: {
            components: {
              Field: '/components/admin/OfficerSyncButton',
            },
          },
        },
        {
          name: 'class',
          type: 'select',
          options: WOW_CLASSES.map(c => ({ label: c, value: c })),
          admin: { readOnly: true },
        },
        { name: 'spec', type: 'text', admin: { readOnly: true } },
        {
          name: 'role',
          type: 'select',
          options: ['Tank', 'Healer', 'DPS'].map(r => ({ label: r, value: r })),
          admin: { readOnly: true },
        },
        { name: 'ilvl', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'rank', type: 'text', defaultValue: 'Officer' },
      ],
    },
  ],
}
