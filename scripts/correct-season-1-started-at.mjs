/**
 * One-shot data correction: Season 1's real start date.
 *
 * The Season 1 row was migrated in with a `startedAt` of 2026-01-01 — an
 * explicit placeholder, because no authoritative start date was recorded
 * anywhere upstream or in the CMS (see LEDGER.md, "Season 1's startedAt is
 * still a placeholder"). The operator confirmed the real date on 2026-08-11:
 * **2026-03-17**. `startedAt` drives the Season switcher's chronological
 * ordering, so it must be corrected before a second Season row exists.
 *
 * Targets the row by `url_slug = 'season-1'` and writes only if the current
 * value is exactly the known placeholder:
 *
 *   - current == placeholder  → plan the update (write with --commit)
 *   - current == target       → already corrected, nothing to do, exit 0
 *   - anything else           → refuse and print what it found, exit 1
 *
 * The third branch makes the script inert after first use: it can never
 * clobber a value someone set deliberately, so it is safe to keep in the repo
 * as the record of the correction.
 *
 * Usage
 * -----
 *   node scripts/correct-season-1-started-at.mjs            # verify only (default)
 *   node scripts/correct-season-1-started-at.mjs --commit   # verify, then write
 *
 * Reads DATABASE_URL from the environment if set, else from .env (production).
 * To rehearse against the local Docker database first:
 *
 *   DATABASE_URL=postgres://guild:guild@127.0.0.1:55432/guild_website \
 *     node scripts/correct-season-1-started-at.mjs --commit
 */

import { readFileSync } from "node:fs";
import { Client } from "pg";

const URL_SLUG = "season-1";
const PLACEHOLDER = "2026-01-01T00:00:00.000Z";
const TARGET = "2026-03-17T00:00:00.000Z"; // operator-confirmed 2026-08-11
const COMMIT = process.argv.includes("--commit");

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const line = readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL"));
  if (!line) throw new Error("DATABASE_URL not set and not found in .env");
  return line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
}

const url = readDatabaseUrl();
const host = new URL(url).hostname;
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
// Neon requires TLS with a valid CA cert; the local Docker Postgres refuses TLS.
const client = new Client({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: true },
});

await client.connect();
console.log(`Connected to ${host}`);
console.log(COMMIT ? "Mode: COMMIT (will write)\n" : "Mode: VERIFY ONLY (no writes)\n");

try {
  const { rows } = await client.query(
    `select id, name, started_at from seasons where url_slug = $1`,
    [URL_SLUG],
  );

  if (rows.length !== 1) {
    console.error(`Expected exactly one row with url_slug = "${URL_SLUG}", found ${rows.length}.`);
    console.error("Refusing to write. Inspect manually before proceeding.");
    process.exit(1);
  }

  const row = rows[0];
  // pg returns timestamptz as a JS Date — compare instants, not SQL literals.
  const current = row.started_at.toISOString();
  console.log(`Row ${row.id} ("${row.name}"): started_at = ${current}`);

  if (current === TARGET) {
    console.log("\nAlready corrected. Nothing to do — safe to re-run.");
    process.exit(0);
  }

  if (current !== PLACEHOLDER) {
    console.error(`\nstarted_at is neither the placeholder (${PLACEHOLDER}) nor the target (${TARGET}).`);
    console.error("Someone set this deliberately. Refusing to write.");
    process.exit(1);
  }

  console.log(`\nPlan:`);
  console.log(`  UPDATE seasons SET started_at = ${TARGET} WHERE id = ${row.id}`);

  if (!COMMIT) {
    console.log("\nVerify-only run. Re-run with --commit to apply.");
    process.exit(0);
  }

  await client.query(
    `update seasons set started_at = $1, updated_at = now() where id = $2`,
    [TARGET, row.id],
  );

  const { rows: after } = await client.query(
    `select started_at from seasons where id = $1`,
    [row.id],
  );
  console.log(`\nDone. started_at is now ${after[0].started_at.toISOString()}.`);
} catch (err) {
  console.error("\nFailed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
