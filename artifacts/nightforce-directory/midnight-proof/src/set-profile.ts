import * as fs from "node:fs";

import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";

import {
  createWallet,
  createProviders,
  compiledContract,
  ProfileProof,
  PROFILE_PROOF_PRIVATE_STATE_ID,
  getSyncedWalletState,
} from "./utils.js";

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║         Set Profile on Midnight Local Network              ║");
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

  if (deployment.network !== "undeployed") {
    throw new Error(
      `Expected undeployed network, got: ${deployment.network ?? "(missing)"}`
    );
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

    console.log("  Joining contract...");
    const contract = await (findDeployedContract as any)(providers, {
      contractAddress: deployment.contractAddress,
      compiledContract: compiledContract as any,
      privateStateId: PROFILE_PROOF_PRIVATE_STATE_ID,
      initialPrivateState: {},
    });

    console.log("  Calling setProfile(PUBLIC, MY)...");
    const tx = await (contract as any).callTx.setProfile(
      (ProfileProof as any).Visibility.PUBLIC,
      (ProfileProof as any).CountryCode.MY,
    );

    console.log("\n  ✅ setProfile succeeded!\n");
    console.log(`  Transaction: ${tx.public.txId}`);
    console.log(`  Block: ${tx.public.blockHeight}\n`);
  } finally {
    if (walletCtx) {
      await walletCtx.wallet.stop();
    }
  }
}

main().catch(console.error);