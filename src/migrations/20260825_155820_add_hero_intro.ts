import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guild_settings" ADD COLUMN "hero_intro" varchar DEFAULT 'Semi-hardcore Mythic progression. Two nights a week. Small potatoes, big pulls — don''t worry, be raiding.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guild_settings" DROP COLUMN "hero_intro";`)
}
