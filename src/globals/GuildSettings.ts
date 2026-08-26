import type { GlobalConfig } from 'payload'

/**
 * The hero sentence when the CMS field is empty.
 *
 * Exported because it is also the column default in the migration and the
 * render-time fallback in VenomPage — three copies of one string that must stay
 * in step, which is two too many. One name, imported by the component.
 */
export const DEFAULT_HERO_INTRO =
  "Semi-hardcore Mythic progression. Two nights a week. Small potatoes, big pulls — don't worry, be raiding."

export const GuildSettings: GlobalConfig = {
  slug: 'guild-settings',
  label: 'Guild Settings',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'About Us',
      admin: { description: 'Small label above the About section heading.' },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'The Guild',
      admin: { description: 'Main heading of the About section.' },
    },
    { name: 'name', type: 'text', required: true },
    { name: 'tagline', type: 'text' },
    { name: 'server', type: 'text' },
    { name: 'region', type: 'text' },
    { name: 'faction', type: 'text' },
    {
      name: 'currentSeason',
      type: 'relationship',
      relationTo: 'seasons',
      admin: {
        description: 'The Season the Sync writes to and the home page renders by default. Exactly one Season is current — this pointer, not a per-row flag, is what makes that true by construction.',
      },
    },
    {
      name: 'heroIntro',
      type: 'textarea',
      defaultValue: DEFAULT_HERO_INTRO,
      admin: {
        description:
          'The sentence under the guild name in the hero. Left blank, the layout falls back to its built-in copy rather than rendering an empty space.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      admin: { description: 'Guild description shown on the About section. Supports bold, italic, lists, links.' },
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
