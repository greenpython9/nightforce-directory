import { Router, type IRouter } from "express";
import * as fs from "node:fs";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const router: IRouter = Router();

const contactModeDir = path.resolve(
  process.cwd(),
  "..",
  "nightforce-directory",
  "midnight-contact-mode",
);

const deployScriptPath = path.join(
  contactModeDir,
  "dist",
  "deploy-contact-mode-json.js",
);

type RequestedTarget = "local" | "preprod";
type ContactModeLabel =
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED";

function getRequestedTarget(value: unknown): RequestedTarget {
  return value === "preprod" ? "preprod" : "local";
}

function isValidInitialMode(value: unknown): value is ContactModeLabel {
  return (
    value === "NO_CONTACT" ||
    value === "PRIVATE_CONTACT_AVAILABLE" ||
    value === "PUBLIC_CONTACT_ALLOWED"
  );
}

router.post("/contact-mode/deploy", async (req, res) => {
  try {
    const target = getRequestedTarget(req.query.target);
    const seed =
      typeof req.body?.seed === "string" ? req.body.seed.trim() : "";
    const initialMode = req.body?.initialMode;

    if (!seed) {
      return res.status(400).json({
        error: "Missing required field: seed",
      });
    }

    if (!isValidInitialMode(initialMode)) {
      return res.status(400).json({
        error:
          "Invalid initialMode. Expected one of: NO_CONTACT, PRIVATE_CONTACT_AVAILABLE, PUBLIC_CONTACT_ALLOWED",
      });
    }

    if (!fs.existsSync(deployScriptPath)) {
      return res.status(500).json({
        error:
          "deploy-contact-mode-json build output was not found. Build midnight-contact-mode first.",
      });
    }

    const { stdout } = await execFileAsync("node", [deployScriptPath], {
      cwd: contactModeDir,
      env: {
        ...process.env,
        MIDNIGHT_CONTACT_MODE_TARGET: target,
        MIDNIGHT_CONTACT_MODE_SEED: seed,
        MIDNIGHT_CONTACT_MODE_INITIAL_MODE: initialMode,
      },
      timeout: 180_000,
      maxBuffer: 1024 * 1024,
    });

    const data = JSON.parse(stdout.trim());
    return res.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown contact-mode deploy error";

    return res.status(500).json({
      error: "Failed to deploy contact-mode contract",
      details: message,
    });
  }
});

export default router;