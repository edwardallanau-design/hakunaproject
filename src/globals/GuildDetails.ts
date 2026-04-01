import type { GlobalConfig } from 'payload'

export const GuildDetails: GlobalConfig = {
  slug: 'guild-details',
  label: 'Guild Details',
  admin: {
    components: {
      elements: {
        beforeDocumentControls: ['/components/admin/SyncGuildDetailsButton'],
      },
    },
  },
  fields: [
    {
      name: 'details',
      type: 'json',
      admin: { hidden: true },
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      admin: { description: 'Last time guild details were synced from Raider.IO', readOnly: true },
    },
  ],
}
