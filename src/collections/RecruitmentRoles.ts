import type { CollectionConfig } from 'payload'

export const RecruitmentRoles: CollectionConfig = {
  slug: 'recruitment-roles',
  admin: { useAsTitle: 'role' },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      options: ['Tank', 'Healer', 'DPS'].map(r => ({ label: r, value: r })),
    },
    {
      name: 'specs',
      type: 'array',
      labels: { singular: 'Spec', plural: 'Specs' },
      fields: [{ name: 'spec', type: 'text', required: true }],
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'Medium',
      options: ['High', 'Medium', 'Low'].map(p => ({ label: p, value: p })),
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { description: 'Lower = first' } },
  ],
}
