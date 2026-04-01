import type { GlobalConfig } from 'payload'
import { syncProgressionFromDetails } from '@/lib/syncProgression'
import { syncOfficersFromDetails } from '@/lib/syncOfficers'

export const GuildDetails: GlobalConfig = {
  slug: 'guild-details',
  label: 'Guild Details',
  hooks: {
    afterChange: [
      async ({ req }) => {
        try {
          await Promise.all([
            syncProgressionFromDetails(req.payload),
            syncOfficersFromDetails(req.payload),
          ]);
        } catch (err) {
          req.payload.logger.error(`Auto-sync failed: ${err instanceof Error ? err.message : String(err)}`);
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
      admin: { description: 'Last time guild details were synced from Raider.IO', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
