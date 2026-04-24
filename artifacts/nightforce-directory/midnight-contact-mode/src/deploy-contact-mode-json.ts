import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";

import {
  createWallet,
  createProviders,
  compiledContract,
  ContactModeContract,
  DEPLOY_TARGET,
  TARGET_NETWORK_ID,
} from "./utils.js";

type ContactModeLabel =
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseInitialMode(value: string): {
  value: number;
  label: ContactModeLabel;
} {
  const ContactMode = (ContactModeContract as any).ContactMode;

  switch (value.trim()) {
    case "NO_CONTACT":
      return {
        value: ContactMode.NO_CONTACT,
        label: "NO_CONTACT",
      };
    case "PRIVATE_CONTACT_AVAILABLE":
      return {
        value: ContactMode.PRIVATE_CONTACT_AVAILABLE,
        label: "PRIVATE_CONTACT_AVAILABLE",
      };
    case "PUBLIC_CONTACT_ALLOWED":
      return {
        value: ContactMode.PUBLIC_CONTACT_ALLOWED,
        label: "PUBLIC_CONTACT_ALLOWED",
      };
    default:
      throw new Error(
        "Invalid MIDNIGHT_CONTACT_MODE_INITIAL_MODE. Expected one of: NO_CONTACT, PRIVATE_CONTACT_AVAILABLE, PUBLIC_CONTACT_ALLOWED",
      );
  }
}

async function main() {
  const seed = getRequiredEnv("MIDNIGHT_CONTACT_MODE_SEED");
  const initialMode = parseInitialMode(
    getRequiredEnv("MIDNIGHT_CONTACT_MODE_INITIAL_MODE"),
  );

  const walletCtx = await createWallet(seed);

  try {
    const providers = await createProviders(walletCtx);

    const deployed = await (deployContract as any)(providers, {
      compiledContract: compiledContract as any,
      args: [initialMode.value],
    });

    const contractAddress = (deployed as any).deployTxData.public.contractAddress;

    const result = {
      ok: true,
      target: DEPLOY_TARGET,
      network: TARGET_NETWORK_ID,
      initialMode: initialMode.label,
      contractAddress,
      deployedAt: new Date().toISOString(),
    };

    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await walletCtx.wallet.stop();
  }
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Unknown contact-mode deploy error";

  process.stderr.write(`${message}\n`);
  process.exit(1);
});