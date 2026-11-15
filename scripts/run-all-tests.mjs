/**
 * `npm run test:all`: runs every suite even when an earlier one fails, prints
 * a summary, and exits non-zero if any suite failed.
 *   node scripts/run-all-tests.mjs            unit, api, e2e
 *   node scripts/run-all-tests.mjs unit api   only those
 */
import { spawnSync } from "node:child_process";

const SUITES = { unit: "test:unit", api: "test:api", e2e: "test:e2e" };
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SUITES);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const results = [];

for (const name of wanted) {
  const script = SUITES[name];
  if (!script) {
    console.error(`Unknown suite "${name}". Use: ${Object.keys(SUITES).join(", ")}`);
    process.exit(2);
  }
  console.log(`\n=== ${name} (npm run ${script}) ===\n`);
  const started = Date.now();
  const run = spawnSync(npm, ["run", script], { stdio: "inherit", shell: process.platform === "win32" });
  const code = run.status ?? 1;
  results.push({ name, code, seconds: Math.round((Date.now() - started) / 1000) });
}

console.log("\n=== test:all summary ===");
for (const r of results) console.log(`${r.code === 0 ? "PASS" : "FAIL"}  ${r.name.padEnd(5)} ${r.seconds}s${r.code === 0 ? "" : ` (exit ${r.code})`}`);
const failed = results.filter((r) => r.code !== 0);
process.exit(failed.length ? 1 : 0);
