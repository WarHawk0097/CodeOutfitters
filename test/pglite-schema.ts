// Shared setup for the *.pglite.test.ts suites — the ones that prove a migration by applying
// it, unmodified, to a real embedded Postgres.
//
// Each suite used to open a PGlite instance per test. That reads as the safest possible
// isolation and behaves as the opposite: a PGlite instance carries a WASM Postgres heap that
// the process does not give back when it is closed, so a file with twenty-odd tests exhausts
// the worker and the whole run dies with "Fatal process out of memory" — no failing
// assertion, no clue which test was to blame.
//
// So the connection is opened once per file and the SCHEMA is what gets rebuilt per test.
// Isolation is unchanged in the way that matters: every test still starts from the migrations
// applied to nothing, including whatever they seed, rather than from another test's leftovers
// swept up by hand.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";

/** Open the connection once, with the Supabase roles the migrations' GRANT/REVOKE reference.
 *  They do not exist in a bare Postgres, and they outlive a schema drop, so they are created
 *  here rather than in the per-test rebuild. */
export async function openTestDatabase(): Promise<PGlite> {
  const db = new PGlite({ extensions: { citext } });
  await db.exec("create role anon; create role authenticated; create role service_role;");
  return db;
}

/** Drop everything the migrations own and apply them again, as a first deployment would.
 *
 *  `authStub` is the stand-in for GoTrue: PGlite has no `auth` schema, so suites that exercise
 *  RLS supply the two shapes the migrations read — `auth.users` and `auth.uid()`. */
export async function resetSchema(
  db: PGlite,
  options: { migrations: readonly string[]; authStub?: string },
): Promise<void> {
  await db.exec("reset role");
  // A jwt claim set with is_local = false belongs to the connection, and the connection now
  // outlives the schema. Left alone, a test inherits the previous test's signed-in user — one
  // the rebuild has already deleted.
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
  await db.exec(`
    drop schema if exists public cascade;
    drop schema if exists auth cascade;
    create schema public authorization pg_database_owner;
    grant usage on schema public to public;
  `);
  if (options.authStub) await db.exec(options.authStub);
  for (const path of options.migrations) await db.exec(readFileSync(path, "utf8"));
}
