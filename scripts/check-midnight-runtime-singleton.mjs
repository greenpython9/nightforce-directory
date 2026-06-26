import { existsSync, lstatSync, realpathSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");

const runtimePackages = [
  "@midnight-ntwrk/compact-runtime",
  "@midnight-ntwrk/onchain-runtime-v3",
];

const workspacePackages = [
  {
    label: "frontend",
    directory: "artifacts/nightforce-directory",
  },
  {
    label: "Contact Mode contract",
    directory: "artifacts/nightforce-directory/midnight-contact-mode",
  },
  {
    label: "Profile Proof contract",
    directory: "artifacts/nightforce-directory/midnight-proof",
  },
];

function relativeToRoot(target) {
  const result = relative(root, target);
  return result || ".";
}

const failures = [];
const summaries = [];

for (const packageName of runtimePackages) {
  const resolutions = [];

  for (const workspacePackage of workspacePackages) {
    const logicalPath = resolve(
      root,
      workspacePackage.directory,
      "node_modules",
      packageName,
    );

    if (!existsSync(logicalPath)) {
      continue;
    }

    const realPath = realpathSync(logicalPath);

    resolutions.push({
      workspaceLabel: workspacePackage.label,
      logicalPath,
      realPath,
      isSymbolicLink: lstatSync(logicalPath).isSymbolicLink(),
    });
  }

  if (resolutions.length === 0) {
    summaries.push({
      packageName,
      resolutionCount: 0,
      physicalCopies: [],
    });

    continue;
  }

  const physicalCopies = new Map();

  for (const resolution of resolutions) {
    const existing = physicalCopies.get(resolution.realPath) ?? [];
    existing.push(resolution);
    physicalCopies.set(resolution.realPath, existing);
  }

  summaries.push({
    packageName,
    resolutionCount: resolutions.length,
    physicalCopies: [...physicalCopies.keys()],
  });

  if (physicalCopies.size > 1) {
    failures.push({
      packageName,
      resolutions,
    });
  }
}

if (failures.length > 0) {
  console.error("");
  console.error("❌ Multiple physical Midnight runtime copies detected.");
  console.error("");
  console.error(
    "Normal pnpm workspace symlinks are allowed when they resolve to",
  );
  console.error("the same physical package. The following resolutions do not:");

  for (const failure of failures) {
    console.error("");
    console.error(`  ${failure.packageName}`);

    for (const resolution of failure.resolutions) {
      const linkType = resolution.isSymbolicLink ? "symlink" : "directory";

      console.error(`    - ${resolution.workspaceLabel} (${linkType})`);
      console.error(`      logical: ${relativeToRoot(resolution.logicalPath)}`);
      console.error(`      real:    ${relativeToRoot(resolution.realPath)}`);
    }
  }

  console.error("");
  console.error("Remove only the independently installed nested runtime copy,");
  console.error("then run pnpm install again from the workspace root.");
  console.error("");

  process.exit(1);
}

console.log("✅ Midnight runtime singleton check passed.");

for (const summary of summaries) {
  if (summary.resolutionCount === 0) {
    console.log(`  - ${summary.packageName}: not installed`);
    continue;
  }

  const linkLabel =
    summary.resolutionCount === 1
      ? "1 workspace resolution"
      : `${summary.resolutionCount} workspace resolutions`;

  console.log(
    `  - ${summary.packageName}: ${linkLabel}, ` +
      `${summary.physicalCopies.length} physical copy`,
  );
}
