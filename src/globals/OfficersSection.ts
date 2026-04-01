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
      name: 'lastSyncedAt',
      type: 'date',
      admin: { description: 'Last time officer data was synced from Guild Details', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'officers',
      type: 'array',
      label: 'Officers',
      labels: { singular: 'Officer', plural: 'Officers' },
      admin: {
        components: {
          RowLabel: '/components/admin/OfficerRowLabel',
        },
      },
      fields: [
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
          name: 'name',
          type: 'text',
          admin: { hidden: true },
        },
        {
          name: 'class',
          type: 'select',
          options: WOW_CLASSES.map(c => ({ label: c, value: c })),
          admin: { hidden: true },
        },
        { name: 'spec', type: 'text', admin: { hidden: true } },
        {
          name: 'role',
          type: 'select',
          options: ['Tank', 'Healer', 'DPS'].map(r => ({ label: r, value: r })),
          admin: { hidden: true },
        },
        { name: 'ilvl', type: 'number', defaultValue: 0, admin: { hidden: true } },
        { name: 'rank', type: 'text', defaultValue: 'Officer' },
      ],
    },
  ],
}
