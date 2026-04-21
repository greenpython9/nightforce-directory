import { Router, type IRouter } from "express";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const router: IRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const proofDir = path.resolve(
  process.cwd(),
  "..",
  "nightforce-directory",
  "midnight-proof",
);

const readScriptPath = path.join(proofDir, "dist", "read-profile-json.js");
const deploymentPath = path.join(proofDir, "deployment.json");

router.get("/profile-proof/state", async (_req, res) => {
  try {
    if (!fs.existsSync(deploymentPath)) {
      return res.status(500).json({
        error: "deployment.json was not found in midnight-proof",
      });
    }

    if (!fs.existsSync(readScriptPath)) {
      return res.status(500).json({
        error: "read-profile-json build output was not found. Build midnight-proof first.",
      });
    }

    const { stdout } = await execFileAsync("node", [readScriptPath], {
      cwd: proofDir,
      env: process.env,
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });

    const data = JSON.parse(stdout.trim());
    return res.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown profile-proof read error";

    return res.status(500).json({
      error: "Failed to read profile-proof state",
      details: message,
    });
  }
});

export default router;