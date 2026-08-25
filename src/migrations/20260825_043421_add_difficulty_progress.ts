import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Per-difficulty raid progress: normal and heroic kills, dates, pull counts and
// ranks. Mythic already lives in the flat columns these sit beside.
//
// **This migration is purely additive on purpose.** Fourteen ADD COLUMNs, no
// UPDATE, no data movement, nothing dropped. The symmetric alternative —
// restructuring bosses into {normal, heroic, mythic} groups — would have needed
// a backfill over Season 1's rows, and Season 1 is a frozen archive (ADR 0005,
// reaffirmed by operator decision 2026-08-25). Additive means the archive is
// untouched by construction rather than by a backfill that has to be correct.
//
// `normal_killed` and `heroic_killed` default to false rather than NULL, so
// existing rows read as "not killed at this difficulty", which is exactly how
// deriveProgression treats an absent group.
//
// `down` is a true reverse: it drops only the columns added here, so a
// rollback returns the table to its pre-migration shape with mythic data
// intact.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seasons_bosses" ADD COLUMN "normal_killed" boolean DEFAULT false;
  ALTER TABLE "seasons_bosses" ADD COLUMN "normal_first_defeated" timestamp(3) with time zone;
  ALTER TABLE "seasons_bosses" ADD COLUMN "normal_pulls" numeric;
  ALTER TABLE "seasons_bosses" ADD COLUMN "normal_best_pull" numeric;
  ALTER TABLE "seasons_bosses" ADD COLUMN "heroic_killed" boolean DEFAULT false;
  ALTER TABLE "seasons_bosses" ADD COLUMN "heroic_first_defeated" timestamp(3) with time zone;
  ALTER TABLE "seasons_bosses" ADD COLUMN "heroic_pulls" numeric;
  ALTER TABLE "seasons_bosses" ADD COLUMN "heroic_best_pull" numeric;
  ALTER TABLE "seasons" ADD COLUMN "rankings_normal_world" numeric DEFAULT 0;
  ALTER TABLE "seasons" ADD COLUMN "rankings_normal_region" numeric DEFAULT 0;
  ALTER TABLE "seasons" ADD COLUMN "rankings_normal_realm" numeric DEFAULT 0;
  ALTER TABLE "seasons" ADD COLUMN "rankings_heroic_world" numeric DEFAULT 0;
  ALTER TABLE "seasons" ADD COLUMN "rankings_heroic_region" numeric DEFAULT 0;
  ALTER TABLE "seasons" ADD COLUMN "rankings_heroic_realm" numeric DEFAULT 0;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seasons_bosses" DROP COLUMN "normal_killed";
  ALTER TABLE "seasons_bosses" DROP COLUMN "normal_first_defeated";
  ALTER TABLE "seasons_bosses" DROP COLUMN "normal_pulls";
  ALTER TABLE "seasons_bosses" DROP COLUMN "normal_best_pull";
  ALTER TABLE "seasons_bosses" DROP COLUMN "heroic_killed";
  ALTER TABLE "seasons_bosses" DROP COLUMN "heroic_first_defeated";
  ALTER TABLE "seasons_bosses" DROP COLUMN "heroic_pulls";
  ALTER TABLE "seasons_bosses" DROP COLUMN "heroic_best_pull";
  ALTER TABLE "seasons" DROP COLUMN "rankings_normal_world";
  ALTER TABLE "seasons" DROP COLUMN "rankings_normal_region";
  ALTER TABLE "seasons" DROP COLUMN "rankings_normal_realm";
  ALTER TABLE "seasons" DROP COLUMN "rankings_heroic_world";
  ALTER TABLE "seasons" DROP COLUMN "rankings_heroic_region";
  ALTER TABLE "seasons" DROP COLUMN "rankings_heroic_realm";`)
}
