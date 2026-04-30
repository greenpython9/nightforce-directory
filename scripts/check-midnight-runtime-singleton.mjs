import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");

const forbiddenPaths = [
  "artifacts/nightforce-directory/midnight-contact-mode/node_modules/@midnight-ntwrk/compact-runtime",
  "artifacts/nightforce-directory/midnight-contact-mode/node_modules/@midnight-ntwrk/onchain-runtime-v3",
  "artifacts/nightforce-directory/midnight-proof/node_modules/@midnight-ntwrk/compact-runtime",
  "artifacts/nightforce-directory/midnight-proof/node_modules/@midnight-ntwrk/onchain-runtime-v3",
];

const found = forbiddenPaths
  .map((path) => resolve(root, path))
  .filter((path) => existsSync(path));

if (found.length > 0) {
  console.error("");
  console.error("❌ Duplicate Midnight runtime copies detected.");
  console.error("");
  console.error("These nested runtime installs can break browser Midnight SDK flows with:");
  console.error("  Cannot read properties of undefined (reading 'codec')");
  console.error("  expected instance of _ContractMaintenanceAuthority");
  console.error("");
  console.error("Remove these folders before running the frontend:");
  console.error("");

  for (const path of found) {
    console.error(`  - ${relative(root, path)}`);
  }

  console.error("");
  console.error("Suggested cleanup:");
  console.error("");
  console.error("  rm -rf artifacts/nightforce-directory/midnight-contact-mode/node_modules");
  console.error("  rm -rf artifacts/nightforce-directory/midnight-proof/node_modules");
  console.error("  rm -rf artifacts/nightforce-directory/node_modules/.vite");
  console.error("  rm -rf node_modules/.vite");
  console.error("");

  process.exit(1);
}

console.log("✅ Midnight runtime singleton check passed.");