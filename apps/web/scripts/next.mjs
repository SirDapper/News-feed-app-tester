// Runs the Next.js CLI with the repository's root .env loaded, so the website,
// the worker and the mobile app share one file of keys. Next.js on its own only
// reads .env files in apps/web. Variables already set (e.g. on Vercel) win.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const rootEnv = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const next = createRequire(import.meta.url).resolve("next/dist/bin/next");
const { status } = spawnSync(process.execPath, [next, ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(status ?? 1);
