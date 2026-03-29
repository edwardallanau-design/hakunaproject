import type { GlobalConfig } from 'payload'

export const RecruitmentSection: GlobalConfig = {
  slug: 'recruitment-section',
  label: 'Recruitment Section',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: '◆ Join the Ranks ◆',
      admin: { description: 'Small label above the section heading.' },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: "We're Recruiting",
      admin: { description: 'Main section heading.' },
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        "Looking for dedicated players who can parse, execute mechanics, and still have fun doing it. Semi-hardcore means high standards, low drama.",
      admin: { description: 'Paragraph shown below the heading.' },
    },
    {
      name: 'footerNote',
      type: 'text',
      defaultValue: 'Exceptional players of any role are always considered',
      admin: { description: 'Small text shown below the Apply button.' },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      defaultValue: 'Apply via Discord ↗',
      admin: { description: 'Label on the Apply button.' },
    },
    {
      name: 'discordUrl',
      type: 'text',
      defaultValue: 'https://discord.gg/placeholder',
      admin: { description: 'Discord invite link for the Apply button.' },
    },
    {
      name: 'roles',
      type: 'array',
      label: 'Recruitment Roles',
      labels: { singular: 'Role', plural: 'Roles' },
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
      ],
    },
  ],
}
