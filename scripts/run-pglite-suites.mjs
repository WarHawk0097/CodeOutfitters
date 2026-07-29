// Deterministic serial runner for the PGlite migration suites.
//
// Why this exists: PGlite is a WASM Postgres. Two of these suites in one process,
// or two processes at once on a machine under memory pressure, exhausts the WASM
// allocator and V8 aborts with "Fatal process out of memory: Zone" — which tinypool
// then reports as "Channel closed" / ERR_IPC_CHANNEL_CLOSED. That is a machine
// condition, not a failing assertion, and the two must never be confused: one is a
// red build, the other is a red laptop.
//
// So each suite gets its own child process, one at a time, one worker inside it,
// and the exit of that child is classified before the next one starts. Nothing about
// the tests themselves is changed — no skips, no timeouts relaxed, no config
// overridden beyond "run exactly this one file, alone".
//
// Usage: node scripts/run-pglite-suites.mjs [--keep-going]
//   npm run test:pglite:serial
//
// Exit code is 0 only when every discovered suite ran and passed.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const keepGoing = process.argv.includes("--keep-going");

// Signatures of a process that died rather than a test that failed. PGlite's WASM
// heap is outside the JS heap, so --max-old-space-size does not move this line.
const PROCESS_DEATH = [
  "Fatal process out of memory",
  "JavaScript heap out of memory",
  "ERR_IPC_CHANNEL_CLOSED",
  "Channel closed",
  "wasm memory",
  "Aborted(",
];

/** Tracked suites only, so an untracked scratch file can never dilute the report. */
function discover() {
  const listed = spawnSync("git", ["ls-files", "-z", "*.pglite.test.ts"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (listed.status !== 0) {
    throw new Error(`git ls-files failed: ${listed.stderr?.trim() ?? listed.error?.message ?? "unknown"}`);
  }
  // Byte-stable order, independent of git's output order and of the locale.
  return listed.stdout.split("\0").filter(Boolean).sort();
}

function runSuite(file) {
  const vitest = `${repoRoot}node_modules/vitest/vitest.mjs`;
  if (!existsSync(vitest)) throw new Error(`vitest not found at ${vitest} — run npm install`);
  const started = Date.now();
  // No shell: argv is passed as an array, so a path with a space or an ampersand is
  // an argument and never a command. One fork, one file, no parallelism.
  const child = spawnSync(
    process.execPath,
    [
      vitest,
      "run",
      file,
      "--pool=forks",
      "--poolOptions.forks.singleFork=true",
      "--fileParallelism=false",
      "--reporter=basic",
    ],
    { cwd: repoRoot, encoding: "utf8", env: process.env, shell: false },
  );
  const durationMs = Date.now() - started;
  const output = `${child.stdout ?? ""}${child.stderr ?? ""}`;
  const died = child.signal !== null || PROCESS_DEATH.some((needle) => output.includes(needle));

  if (child.error) return { file, durationMs, status: "process_error", detail: child.error.message, output };
  if (child.status === 0 && !died) return { file, durationMs, status: "passed", output };
  if (died) return { file, durationMs, status: "process_died", detail: child.signal ?? `exit ${child.status}`, output };
  return { file, durationMs, status: "failed", detail: `exit ${child.status}`, output };
}

const suites = discover();
console.log(`PGLITE_SUITES_DISCOVERED: ${suites.length}`);
for (const file of suites) console.log(`  - ${file}`);
console.log("");

const results = [];
for (const file of suites) {
  process.stdout.write(`RUN  ${file} ... `);
  const result = runSuite(file);
  results.push(result);
  console.log(`${result.status.toUpperCase()} (${(result.durationMs / 1000).toFixed(1)}s)`);
  // A failing assertion stops the run — everything after it would be noise. A dead
  // process does not, because the point of the next suite is to show whether the
  // machine or the code is at fault.
  if (result.status === "failed" && !keepGoing) {
    console.log(result.output.trimEnd());
    break;
  }
  if (result.status !== "passed") console.log(lastLines(result.output, 12));
}

function lastLines(text, count) {
  return text.trimEnd().split(/\r?\n/).slice(-count).join("\n");
}

const passed = results.filter((r) => r.status === "passed");
const failed = results.filter((r) => r.status === "failed");
const dead = results.filter((r) => r.status === "process_died" || r.status === "process_error");

console.log("\n--- PGLITE SERIAL REPORT ---");
for (const r of results) {
  console.log(`${r.status.padEnd(13)} ${(r.durationMs / 1000).toFixed(1).padStart(6)}s  ${r.file}${r.detail ? `  (${r.detail})` : ""}`);
}
for (const file of suites.filter((f) => !results.some((r) => r.file === f))) {
  console.log(`${"not_run".padEnd(13)} ${"-".padStart(7)}  ${file}`);
}
console.log("");
console.log(`PGLITE_SUITES_DISCOVERED: ${suites.length}`);
console.log(`PGLITE_SUITES_EXECUTED: ${results.length}`);
console.log(`PGLITE_SUITES_PASSED: ${passed.length}`);
console.log(`PGLITE_SUITES_FAILED: ${failed.length}`);
console.log(`PGLITE_OOM: ${dead.length > 0 ? `YES (${dead.length})` : "NO"}`);

const ok = results.length === suites.length && failed.length === 0 && dead.length === 0;
console.log(`PGLITE_SERIAL_RESULT: ${ok ? "PASS" : "FAIL"}`);
process.exit(ok ? 0 : 1);
