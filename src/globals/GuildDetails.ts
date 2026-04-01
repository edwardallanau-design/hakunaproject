import type { GlobalConfig } from 'payload'
import { syncProgressionFromDetails } from '@/lib/syncProgression'

export const GuildDetails: GlobalConfig = {
  slug: 'guild-details',
  label: 'Guild Details',
  hooks: {
    afterChange: [
      async ({ req }) => {
        try {
          await syncProgressionFromDetails(req.payload);
        } catch (err) {
          req.payload.logger.error(`Auto-sync progression failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ],
  },
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
