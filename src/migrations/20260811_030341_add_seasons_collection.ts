import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { readFileSync } from 'fs'
import path from 'path'

// Season 1's data comes from the reviewed snapshot committed in ticket 02
// (.scratch/season-rollover/season-1-snapshot.json), not from the live
// `progression` global — the global is left intact and unread, per the spec,
// so this step stays reversible.
type Season1Snapshot = {
  name: string
  urlSlug: string
  themeSlug: string
  startedAt: string
  raidSlugs: string[]
  rankSourceRaidSlug: string
  mythicPlusSeasonSlug: string
  difficulty: string
  summary: string
  profileUrl: string
  lastSyncedAt: string | null
  kills: number
  totalBosses: number
  rankings: { members: number; world: number; region: number; realm: number }
  bosses: Array<{ name: string; killed: boolean; firstDefeated: string | null; pulls: number | null; bestPull: number | null }>
  mythicPlusRunners: Array<{ name: string; class: string; spec: string; score: number }>
  mythicPlusParticipants: Array<{ name: string; class: string; spec: string; score: number }>
}

function readSeason1Snapshot(): Season1Snapshot {
  const snapshotPath = path.resolve(process.cwd(), '.scratch/season-rollover/season-1-snapshot.json')
  return JSON.parse(readFileSync(snapshotPath, 'utf-8'))
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_seasons_difficulty" AS ENUM('Normal', 'Heroic', 'Mythic');
  CREATE TABLE "seasons_raid_slugs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "seasons_bosses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"killed" boolean DEFAULT false,
  	"first_defeated" timestamp(3) with time zone,
  	"pulls" numeric,
  	"best_pull" numeric
  );
  
  CREATE TABLE "seasons_mythic_plus_runners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"class" varchar NOT NULL,
  	"spec" varchar NOT NULL,
  	"score" numeric NOT NULL
  );
  
  CREATE TABLE "seasons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"url_slug" varchar NOT NULL,
  	"theme_slug" varchar NOT NULL,
  	"started_at" timestamp(3) with time zone NOT NULL,
  	"rank_source_raid_slug" varchar NOT NULL,
  	"mythic_plus_season_slug" varchar NOT NULL,
  	"difficulty" "enum_seasons_difficulty" DEFAULT 'Heroic',
  	"summary" varchar,
  	"profile_url" varchar,
  	"last_synced_at" timestamp(3) with time zone,
  	"kills" numeric DEFAULT 0,
  	"total_bosses" numeric DEFAULT 0,
  	"rankings_members" numeric DEFAULT 0,
  	"rankings_world" numeric DEFAULT 0,
  	"rankings_region" numeric DEFAULT 0,
  	"rankings_realm" numeric DEFAULT 0,
  	"mythic_plus_participants" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "seasons_id" integer;
  ALTER TABLE "guild_settings" ADD COLUMN "current_season_id" integer;
  ALTER TABLE "seasons_raid_slugs" ADD CONSTRAINT "seasons_raid_slugs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seasons_bosses" ADD CONSTRAINT "seasons_bosses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seasons_mythic_plus_runners" ADD CONSTRAINT "seasons_mythic_plus_runners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "seasons_raid_slugs_order_idx" ON "seasons_raid_slugs" USING btree ("_order");
  CREATE INDEX "seasons_raid_slugs_parent_id_idx" ON "seasons_raid_slugs" USING btree ("_parent_id");
  CREATE INDEX "seasons_bosses_order_idx" ON "seasons_bosses" USING btree ("_order");
  CREATE INDEX "seasons_bosses_parent_id_idx" ON "seasons_bosses" USING btree ("_parent_id");
  CREATE INDEX "seasons_mythic_plus_runners_order_idx" ON "seasons_mythic_plus_runners" USING btree ("_order");
  CREATE INDEX "seasons_mythic_plus_runners_parent_id_idx" ON "seasons_mythic_plus_runners" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "seasons_url_slug_idx" ON "seasons" USING btree ("url_slug");
  CREATE INDEX "seasons_updated_at_idx" ON "seasons" USING btree ("updated_at");
  CREATE INDEX "seasons_created_at_idx" ON "seasons" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_seasons_fk" FOREIGN KEY ("seasons_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guild_settings" ADD CONSTRAINT "guild_settings_current_season_id_seasons_id_fk" FOREIGN KEY ("current_season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_seasons_id_idx" ON "payload_locked_documents_rels" USING btree ("seasons_id");
  CREATE INDEX "guild_settings_current_season_idx" ON "guild_settings" USING btree ("current_season_id");`)

  // Copy the reviewed Season 1 snapshot into a row. The `progression` global is
  // left intact and unread — this is a copy, not a move, so the step stays
  // reversible. This is the only point at which Season 1's M+ Participants can
  // ever be recorded: the Sync writes only to the current Season, so once
  // Season 2 becomes current no code path can reach them again.
  const snapshot = readSeason1Snapshot()

  const season1 = await payload.create({
    collection: 'seasons',
    data: {
      name: snapshot.name,
      urlSlug: snapshot.urlSlug,
      // Asserted for the same reason as `difficulty` below: the snapshot is
      // parsed JSON, so its fields are plain strings, while `themeSlug` is now
      // a select narrowed to the theme manifest. This migration runs before the
      // one that converts the column to a pg enum, so the value written here is
      // still text at runtime — the assertion is a compile-time concern only,
      // and the later conversion is what would reject an unknown slug.
      themeSlug: snapshot.themeSlug as 'void' | 'venom',
      startedAt: snapshot.startedAt,
      raidSlugs: snapshot.raidSlugs.map((slug) => ({ slug })),
      rankSourceRaidSlug: snapshot.rankSourceRaidSlug,
      mythicPlusSeasonSlug: snapshot.mythicPlusSeasonSlug,
      difficulty: snapshot.difficulty as 'Normal' | 'Heroic' | 'Mythic',
      summary: snapshot.summary,
      profileUrl: snapshot.profileUrl,
      lastSyncedAt: snapshot.lastSyncedAt,
      kills: snapshot.kills,
      totalBosses: snapshot.totalBosses,
      rankings: snapshot.rankings,
      bosses: snapshot.bosses.map(({ name, killed, firstDefeated, pulls, bestPull }) => ({
        name,
        killed,
        firstDefeated,
        pulls,
        bestPull,
      })),
      mythicPlusRunners: snapshot.mythicPlusRunners,
      mythicPlusParticipants: snapshot.mythicPlusParticipants,
    },
    req,
  })

  // Direct SQL rather than payload.updateGlobal: Payload validates a global
  // update against its FULL document, including fields unrelated to this
  // change — guild-settings.name is required, and this step only touches
  // currentSeason. Production already has a guild-settings row (the site has
  // been live), so this sets it there. A bare freshly migrated database (e.g.
  // local dev, before the seed script has ever run) has no row yet — Payload
  // creates a global's row lazily on first write — so there is nothing to
  // point at yet; the seed script sets the pointer itself once guild-settings
  // exists.
  await db.execute(sql`UPDATE "guild_settings" SET "current_season_id" = ${season1.id}`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Constraints on the two referencing tables must drop before `seasons` itself
  // — as generated, the explicit DROP CONSTRAINT statements ran after `DROP
  // TABLE "seasons" CASCADE`, which had already removed both constraints via
  // cascade, so the explicit drops errored ("constraint does not exist").
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_seasons_fk";
  ALTER TABLE "guild_settings" DROP CONSTRAINT "guild_settings_current_season_id_seasons_id_fk";
  DROP INDEX "payload_locked_documents_rels_seasons_id_idx";
  DROP INDEX "guild_settings_current_season_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "seasons_id";
  ALTER TABLE "guild_settings" DROP COLUMN "current_season_id";
  ALTER TABLE "seasons_raid_slugs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "seasons_bosses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "seasons_mythic_plus_runners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "seasons" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "seasons_raid_slugs" CASCADE;
  DROP TABLE "seasons_bosses" CASCADE;
  DROP TABLE "seasons_mythic_plus_runners" CASCADE;
  DROP TABLE "seasons" CASCADE;
  DROP TYPE "public"."enum_seasons_difficulty";`)
}
