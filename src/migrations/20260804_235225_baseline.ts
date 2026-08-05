import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_progression_difficulty" AS ENUM('Normal', 'Heroic', 'Mythic');
  CREATE TYPE "public"."enum_officers_section_officers_class" AS ENUM('Death Knight', 'Demon Hunter', 'Druid', 'Evoker', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior');
  CREATE TYPE "public"."enum_officers_section_officers_role" AS ENUM('Tank', 'Healer', 'DPS');
  CREATE TYPE "public"."enum_recruitment_section_roles_role" AS ENUM('Tank', 'Healer', 'DPS');
  CREATE TYPE "public"."enum_recruitment_section_roles_priority" AS ENUM('High', 'Medium', 'Low');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "guild_settings_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "guild_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'About Us',
  	"heading" varchar DEFAULT 'The Guild',
  	"name" varchar NOT NULL,
  	"tagline" varchar,
  	"server" varchar,
  	"region" varchar,
  	"faction" varchar,
  	"description" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
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
  
  CREATE TABLE "officers_section_officers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"class" "enum_officers_section_officers_class",
  	"spec" varchar,
  	"role" "enum_officers_section_officers_role",
  	"ilvl" numeric DEFAULT 0,
  	"rank" varchar DEFAULT 'Officer'
  );
  
  CREATE TABLE "officers_section" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT '◆ The Vanguard ◆',
  	"heading" varchar DEFAULT 'Guild Officers',
  	"last_synced_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "recruitment_section_roles_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"spec" varchar NOT NULL
  );
  
  CREATE TABLE "recruitment_section_roles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" "enum_recruitment_section_roles_role" NOT NULL,
  	"priority" "enum_recruitment_section_roles_priority" DEFAULT 'Medium'
  );
  
  CREATE TABLE "recruitment_section" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT '◆ Join the Ranks ◆',
  	"heading" varchar DEFAULT 'We''re Recruiting',
  	"description" varchar DEFAULT 'Looking for dedicated players who can parse, execute mechanics, and still have fun doing it. Semi-hardcore means high standards, low drama.',
  	"footer_note" varchar DEFAULT 'Exceptional players of any role are always considered',
  	"cta_label" varchar DEFAULT 'Apply via Discord ↗',
  	"discord_url" varchar DEFAULT 'https://discord.gg/placeholder',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "guild_details" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"details" jsonb,
  	"last_synced_at" timestamp(3) with time zone,
  	"last_sync_error" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guild_settings_footer_links" ADD CONSTRAINT "guild_settings_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guild_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "progression_bosses" ADD CONSTRAINT "progression_bosses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."progression"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "progression_mythic_plus_runners" ADD CONSTRAINT "progression_mythic_plus_runners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."progression"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "officers_section_officers" ADD CONSTRAINT "officers_section_officers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."officers_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recruitment_section_roles_specs" ADD CONSTRAINT "recruitment_section_roles_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."recruitment_section_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recruitment_section_roles" ADD CONSTRAINT "recruitment_section_roles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."recruitment_section"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "guild_settings_footer_links_order_idx" ON "guild_settings_footer_links" USING btree ("_order");
  CREATE INDEX "guild_settings_footer_links_parent_id_idx" ON "guild_settings_footer_links" USING btree ("_parent_id");
  CREATE INDEX "progression_bosses_order_idx" ON "progression_bosses" USING btree ("_order");
  CREATE INDEX "progression_bosses_parent_id_idx" ON "progression_bosses" USING btree ("_parent_id");
  CREATE INDEX "progression_mythic_plus_runners_order_idx" ON "progression_mythic_plus_runners" USING btree ("_order");
  CREATE INDEX "progression_mythic_plus_runners_parent_id_idx" ON "progression_mythic_plus_runners" USING btree ("_parent_id");
  CREATE INDEX "officers_section_officers_order_idx" ON "officers_section_officers" USING btree ("_order");
  CREATE INDEX "officers_section_officers_parent_id_idx" ON "officers_section_officers" USING btree ("_parent_id");
  CREATE INDEX "recruitment_section_roles_specs_order_idx" ON "recruitment_section_roles_specs" USING btree ("_order");
  CREATE INDEX "recruitment_section_roles_specs_parent_id_idx" ON "recruitment_section_roles_specs" USING btree ("_parent_id");
  CREATE INDEX "recruitment_section_roles_order_idx" ON "recruitment_section_roles" USING btree ("_order");
  CREATE INDEX "recruitment_section_roles_parent_id_idx" ON "recruitment_section_roles" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "guild_settings_footer_links" CASCADE;
  DROP TABLE "guild_settings" CASCADE;
  DROP TABLE "progression_bosses" CASCADE;
  DROP TABLE "progression_mythic_plus_runners" CASCADE;
  DROP TABLE "progression" CASCADE;
  DROP TABLE "officers_section_officers" CASCADE;
  DROP TABLE "officers_section" CASCADE;
  DROP TABLE "recruitment_section_roles_specs" CASCADE;
  DROP TABLE "recruitment_section_roles" CASCADE;
  DROP TABLE "recruitment_section" CASCADE;
  DROP TABLE "guild_details" CASCADE;
  DROP TYPE "public"."enum_progression_difficulty";
  DROP TYPE "public"."enum_officers_section_officers_class";
  DROP TYPE "public"."enum_officers_section_officers_role";
  DROP TYPE "public"."enum_recruitment_section_roles_role";
  DROP TYPE "public"."enum_recruitment_section_roles_priority";`)
}
