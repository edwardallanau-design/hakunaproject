import type { CollectionConfig } from 'payload'

const WOW_CLASSES = [
  'Death Knight', 'Demon Hunter', 'Druid', 'Evoker', 'Hunter',
  'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior',
]

export const Officers: CollectionConfig = {
  slug: 'officers',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'class',
      type: 'select',
      required: true,
      options: WOW_CLASSES.map(c => ({ label: c, value: c })),
    },
    { name: 'spec', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: ['Tank', 'Healer', 'DPS'].map(r => ({ label: r, value: r })),
    },
    { name: 'rank', type: 'text', defaultValue: 'Officer' },
    { name: 'ilvl', type: 'number', defaultValue: 0 },
    { name: 'order', type: 'number', defaultValue: 0, admin: { description: 'Lower = first' } },
  ],
}
