import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "progression_bosses" CASCADE;
  DROP TABLE "progression_mythic_plus_runners" CASCADE;
  DROP TABLE "progression" CASCADE;
  DROP TYPE "public"."enum_progression_difficulty";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_progression_difficulty" AS ENUM('Normal', 'Heroic', 'Mythic');
  CREATE TABLE "progression_bosses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"killed" boolean DEFAULT false,
  	"first_defeated" timestamp(3) with time zone,
  	"pulls" numeric,
  	"best_pull" numeric
  );
  
  CREATE TABLE "progression_mythic_plus_runners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"class" varchar NOT NULL,
  	"spec" varchar NOT NULL,
  	"score" numeric NOT NULL
  );
  
  CREATE TABLE "progression" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tier" varchar NOT NULL,
  	"difficulty" "enum_progression_difficulty" DEFAULT 'Heroic',
  	"summary" varchar,
  	"profile_url" varchar,
  	"last_synced_at" timestamp(3) with time zone,
  	"kills" numeric DEFAULT 0,
  	"total_bosses" numeric DEFAULT 9,
  	"rankings_members" numeric DEFAULT 0,
  	"rankings_world" numeric DEFAULT 0,
  	"rankings_region" numeric DEFAULT 0,
  	"rankings_realm" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "progression_bosses" ADD CONSTRAINT "progression_bosses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."progression"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "progression_mythic_plus_runners" ADD CONSTRAINT "progression_mythic_plus_runners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."progression"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "progression_bosses_order_idx" ON "progression_bosses" USING btree ("_order");
  CREATE INDEX "progression_bosses_parent_id_idx" ON "progression_bosses" USING btree ("_parent_id");
  CREATE INDEX "progression_mythic_plus_runners_order_idx" ON "progression_mythic_plus_runners" USING btree ("_order");
  CREATE INDEX "progression_mythic_plus_runners_parent_id_idx" ON "progression_mythic_plus_runners" USING btree ("_parent_id");`)
}
