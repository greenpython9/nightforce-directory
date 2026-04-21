import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as Rx from "rxjs";
import { Buffer } from "buffer";

import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import { unshieldedToken } from "@midnight-ntwrk/ledger-v8";
import { generateRandomSeed } from "@midnight-ntwrk/wallet-sdk-hd";

import {
  createWallet,
  createProviders,
  compiledContract,
  zkConfigPath,
  PROFILE_PROOF_PRIVATE_STATE_ID,
  getSyncedWalletState,
} from "./utils.js";

function getNightBalance(state: any): bigint {
  const tokenKey = String((unshieldedToken() as any).raw);
  return (state?.unshielded?.balances?.[tokenKey] ?? 0n) as bigint;
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║      Deploy Profile Proof to Midnight Local Network        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  if (!fs.existsSync(path.join(zkConfigPath, "contract", "index.js"))) {
    console.error("Contract not compiled! Run: npm run compile");
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    console.log("─── Step 1: Wallet Setup ───────────────────────────────────────\n");

    const choice = await rl.question(
      "  [1] Create new wallet\n  [2] Restore from seed\n  > ",
    );

    const seed =
      choice.trim() === "2"
        ? await rl.question("\n  Enter your 64-character seed: ")
        : toHex(Buffer.from(generateRandomSeed()));

    if (choice.trim() !== "2") {
      console.log(`\n  ⚠️  SAVE THIS SEED (you'll need it later):\n  ${seed}\n`);
    }

    console.log("  Creating wallet...");
    const walletCtx = await createWallet(seed);

    console.log("  Syncing with network...");
    const state = await getSyncedWalletState(walletCtx.wallet);

    const address = walletCtx.unshieldedKeystore.getBech32Address();
    const balance = getNightBalance(state);

    console.log(`\n  Wallet Address: ${address}`);
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

    if (balance === 0n) {
      console.log("─── Step 2: Fund Your Wallet ───────────────────────────────────\n");
      console.log("  Fund this wallet using your Midnight local network setup.");
      console.log(`  Address: ${address}\n`);
      console.log("  Waiting for funds...");

      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.filter((s: any) => Boolean(s?.isSynced)),
          Rx.map((s: any) => getNightBalance(s)),
          Rx.filter((b: bigint) => b > 0n),
        ),
      );

      console.log("  Funds received!\n");
    }

    console.log("─── Step 3: DUST Token Setup ───────────────────────────────────\n");

    const dustState = await getSyncedWalletState(walletCtx.wallet);

    if ((dustState.dust?.balance?.(new Date()) ?? 0n) === 0n) {
      const nightUtxos = (dustState.unshielded?.availableCoins ?? []).filter(
        (c: any) => !c?.meta?.registeredForDustGeneration,
      );

      if (nightUtxos.length > 0) {
        console.log("  Registering for DUST generation...");

        const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
          nightUtxos,
          walletCtx.unshieldedKeystore.getPublicKey(),
          (payload: Uint8Array) => walletCtx.unshieldedKeystore.signData(payload),
        );

        await walletCtx.wallet.submitTransaction(
          await walletCtx.wallet.finalizeRecipe(recipe),
        );
      }

      console.log("  Waiting for DUST tokens...");

      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.filter((s: any) => Boolean(s?.isSynced)),
          Rx.filter((s: any) => (s?.dust?.balance?.(new Date()) ?? 0n) > 0n),
        ),
      );
    }

    console.log("  DUST tokens ready!\n");

    console.log("─── Step 4: Deploy Contract ────────────────────────────────────\n");
    console.log("  Setting up providers...");

    const providers = await createProviders(walletCtx);

    console.log("  Deploying contract (this may take 30-60 seconds)...\n");

    const deployed = await (deployContract as any)(providers, {
      compiledContract: compiledContract as any,
      privateStateId: PROFILE_PROOF_PRIVATE_STATE_ID,
      initialPrivateState: {},
    });

    const contractAddress = (deployed as any).deployTxData.public.contractAddress;

    console.log("  ✅ Contract deployed successfully!\n");
    console.log(`  Contract Address: ${contractAddress}\n`);

    const deploymentInfo = {
      contractAddress,
      seed,
      network: "undeployed",
      deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("  Saved to deployment.json\n");

    await walletCtx.wallet.stop();

    console.log("─── Deployment Complete! ───────────────────────────────────────\n");
  } finally {
    rl.close();
  }
}

main().catch(console.error);