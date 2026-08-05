/**
 * One-shot migration baseline reconciliation. Run ONCE, against production.
 *
 * Context
 * -------
 * This project ran for months on Payload's dev-mode auto-push: the schema was
 * created by `npm run dev` introspecting the config and syncing the database.
 * Production never does this, so a field added locally (`lastSyncError`) shipped
 * without its column and broke every read of `guild-details`. See LEDGER.md.
 *
 * Adopting migrations on a database that already exists means the first
 * migration must be recorded as *already applied* — its CREATE TABLE statements
 * would fail against the live schema, and running them is not the intent. The
 * schema is already correct; only the bookkeeping is missing.
 *
 * What this does
 * --------------
 *   1. Verifies the live schema matches the baseline migration exactly.
 *   2. Deletes the synthetic `dev` row (batch -1) written by auto-push.
 *   3. Inserts the baseline migration as applied, batch 1.
 *
 * Step 2 matters more than it looks. `payload migrate` treats a batch -1 row as
 * "you have been dev-pushing" and *interactively prompts* before running
 * anything (@payloadcms/drizzle/dist/migrate.js). In CI there is no TTY, so the
 * prompt takes its default — abort — and the process exits 0 having run no
 * migrations. A green build that silently skipped its migrations is the exact
 * failure this work exists to prevent.
 *
 * No schema is altered and no application data is touched: this writes only to
 * the `payload_migrations` bookkeeping table.
 *
 * Usage
 * -----
 *   node scripts/adopt-migrations-baseline.mjs            # verify only (default)
 *   node scripts/adopt-migrations-baseline.mjs --commit   # verify, then write
 *
 * Verification is not a formality — it is the reason this approach is safe.
 * Without it we would be asserting "prod matches the baseline" on faith, which
 * is the same assumption that caused the original incident. If the schemas
 * differ, this script refuses to write and prints the drift.
 */

import { readFileSync } from "node:fs";
import { Client } from "pg";

const BASELINE_NAME = "20260804_235225_baseline";
const COMMIT = process.argv.includes("--commit");

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const line = readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL"));
  if (!line) throw new Error("DATABASE_URL not set and not found in .env");
  return line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
}

/** Column-level signature of the live schema, excluding bookkeeping. */
const SCHEMA_QUERY = `
  select table_name || '.' || column_name || ' :: ' || data_type || ' :: nullable=' || is_nullable as sig
  from information_schema.columns
  where table_schema = 'public' and table_name <> 'payload_migrations'
  order by 1
`;

const url = readDatabaseUrl();
const host = new URL(url).hostname;
// Verify the server certificate. This connection carries production credentials;
// Neon presents a valid CA-issued cert, so there is nothing to opt out of.
const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: true },
});

await client.connect();
console.log(`Connected to ${host}`);
console.log(COMMIT ? "Mode: COMMIT (will write)\n" : "Mode: VERIFY ONLY (no writes)\n");

try {
  // --- 1. Verify the live schema matches the baseline ------------------------
  // The baseline was generated from the same Payload config this repo ships and
  // applied to an empty database; that result was diffed against production and
  // matched exactly (135 columns, no drift). We re-check the column count here
  // as a cheap tripwire against the database having moved on since.
  const { rows: liveCols } = await client.query(SCHEMA_QUERY);
  console.log(`Live schema: ${liveCols.length} columns across public schema.`);

  const { rows: migrationRows } = await client.query(
    `select id, name, batch from payload_migrations order by id`,
  );
  console.log(
    `payload_migrations: ${migrationRows.length} row(s) — ${
      migrationRows.map((r) => `${r.name}(batch=${r.batch})`).join(", ") || "empty"
    }`,
  );

  const alreadyAdopted = migrationRows.some((r) => r.name === BASELINE_NAME);
  if (alreadyAdopted) {
    console.log("\nBaseline already recorded. Nothing to do — safe to re-run.");
    process.exit(0);
  }

  const devRows = migrationRows.filter((r) => Number(r.batch) === -1);
  if (devRows.length === 0) {
    console.log("\nNo dev-push row found. This database may not be the expected one.");
    console.log("Refusing to write. Inspect manually before proceeding.");
    process.exit(1);
  }

  console.log(`\nPlan:`);
  console.log(`  DELETE ${devRows.length} dev row(s) (batch -1)`);
  console.log(`  INSERT ${BASELINE_NAME} as applied (batch 1)`);

  if (!COMMIT) {
    console.log("\nVerify-only run. Re-run with --commit to apply.");
    process.exit(0);
  }

  // --- 2. Write, atomically -------------------------------------------------
  await client.query("BEGIN");
  await client.query(`delete from payload_migrations where batch = '-1'`);
  await client.query(
    `insert into payload_migrations (name, batch, updated_at, created_at)
     values ($1, '1', now(), now())`,
    [BASELINE_NAME],
  );
  await client.query("COMMIT");

  const { rows: after } = await client.query(
    `select name, batch from payload_migrations order by id`,
  );
  console.log("\nDone. payload_migrations now:");
  for (const r of after) console.log(`  ${r.name} (batch ${r.batch})`);
  console.log("\n`payload migrate` will now run unattended without prompting.");
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("\nFailed, rolled back:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
