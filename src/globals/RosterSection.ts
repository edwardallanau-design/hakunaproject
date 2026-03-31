import type { GlobalConfig } from 'payload'

export const RosterSection: GlobalConfig = {
  slug: 'roster',
  label: 'Guild Roster',
  admin: {
    components: {
      elements: {
        beforeDocumentControls: ['/components/admin/SyncRosterButton'],
      },
    },
  },
  fields: [
    {
      name: 'members',
      type: 'json',
      admin: { hidden: true },
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      admin: { description: 'Last time roster was synced from Raider.IO', readOnly: true },
    },
  ],
}
