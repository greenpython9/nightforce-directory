import * as fs from "node:fs";

import {
  createWallet,
  createProviders,
  ProfileProof,
  getSyncedWalletState,
} from "./utils.js";

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║        Read Profile on Midnight Local Network              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  if (!fs.existsSync("deployment.json")) {
    console.error("No deployment.json found! Run `npm run deploy` first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf-8"));

  if (!deployment.contractAddress) {
    throw new Error("deployment.json is missing contractAddress");
  }

  if (!deployment.seed) {
    throw new Error("deployment.json is missing seed");
  }

  let walletCtx: Awaited<ReturnType<typeof createWallet>> | undefined;

  try {
    console.log(`  Contract: ${deployment.contractAddress}`);
    console.log("  Restoring deployment wallet...");
    walletCtx = await createWallet(deployment.seed.trim());

    console.log("  Syncing wallet...");
    await getSyncedWalletState(walletCtx.wallet);

    console.log("  Setting up providers...");
    const providers = await createProviders(walletCtx);

    console.log("  Reading public ledger state...");
    const state = await providers.publicDataProvider.queryContractState(
      deployment.contractAddress,
    );

    if (!state) {
      throw new Error("No contract state found");
    }

    const ledgerState = (ProfileProof as any).ledger(state.data);

    const visibilityValue = ledgerState.visibility;
    const countryCodeValue = ledgerState.countryCode;

    const visibilityName =
      (ProfileProof as any).Visibility[visibilityValue] ?? String(visibilityValue);

    const countryCodeName =
      (ProfileProof as any).CountryCode[countryCodeValue] ?? String(countryCodeValue);

    console.log("\n  ✅ Read succeeded!\n");
    console.log(`  Visibility:  ${visibilityName} (${visibilityValue})`);
    console.log(`  CountryCode: ${countryCodeName} (${countryCodeValue})\n`);
  } finally {
    if (walletCtx) {
      await walletCtx.wallet.stop();
    }
  }
}

main().catch(console.error);