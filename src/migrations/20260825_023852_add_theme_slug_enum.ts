import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// `themeSlug` becomes a select over the theme manifest, which Payload's
// postgres adapter stores as a pg enum — so this is a column type change on a
// table whose production row holds 'void'. Generated, then hand-verified,
// because a drizzle-generated USING cast is exactly where a generator can be
// lossy (ADR 0004: no auto-push, ever).
//
// What the hand-check established, rehearsed on a throwaway table first:
//
//   - The USING cast is safe, not lossy. Postgres aborts the whole migration
//     if any row holds a value outside the enum — verified by casting a
//     deliberately typo'd 'voidd', which failed with `invalid input value for
//     enum ... "voidd"` rather than nulling the row.
//   - Both enum values ship in this one migration, so selecting `venom` needs
//     no further schema change. Every *future* theme does cost an enum-value
//     migration of its own — recorded in ADR 0007 so a session learns it there
//     rather than from a failed deploy.
//   - `down` is a true reverse: enum → varchar is always safe, and the type is
//     dropped after the column stops depending on it, not before. Round-tripped
//     up-then-down with a 'void' row, which came back as character varying.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_seasons_theme_slug" AS ENUM('void', 'venom');
  ALTER TABLE "seasons" ALTER COLUMN "theme_slug" SET DATA TYPE "public"."enum_seasons_theme_slug" USING "theme_slug"::"public"."enum_seasons_theme_slug";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seasons" ALTER COLUMN "theme_slug" SET DATA TYPE varchar;
  DROP TYPE "public"."enum_seasons_theme_slug";`)
}
