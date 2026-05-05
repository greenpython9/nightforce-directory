import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Rx from "rxjs";
import { Buffer } from "buffer";

import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import * as ledger from "@midnight-ntwrk/ledger-v8";
import { unshieldedToken } from "@midnight-ntwrk/ledger-v8";
import { generateRandomSeed } from "@midnight-ntwrk/wallet-sdk-hd";

import {
  CONFIG,
  DEPLOY_TARGET,
  TARGET_NETWORK_ID,
  createWallet,
  getSyncedWalletState,
  signTransactionIntents,
} from "./utils.js";

const CONTACT_MODE_GLOBAL_PRIVATE_STATE_ID = "contactModeGlobalDeployState";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const globalZkConfigPath = path.resolve(
  __dirname,
  "..",
  "contracts",
  "managed",
  "contact-mode-global",
);

const globalContractPath = path.join(globalZkConfigPath, "contract", "index.js");
const ContactModeGlobalContract = await import(
  pathToFileURL(globalContractPath).href
);

const deployWitnesses = {
  localSecretKey(context: { privateState: unknown }) {
    return [context.privateState, new Uint8Array(32)];
  },
};

const compiledGlobalContract = CompiledContract.make(
  "contact-mode-global",
  (ContactModeGlobalContract as any).Contract,
).pipe(
  CompiledContract.withWitnesses(deployWitnesses as any),
  CompiledContract.withCompiledFileAssets(globalZkConfigPath),
) as any;

function getNightBalance(state: any): bigint {
  const tokenKey = String((unshieldedToken() as any).raw);
  return (state?.unshielded?.balances?.[tokenKey] ?? 0n) as bigint;
}

function getDustBalance(state: any): bigint {
  return (state?.dust?.balance?.(new Date()) ?? 0n) as bigint;
}

function getUnregisteredNightUtxos(state: any): any[] {
  return (state.unshielded?.availableCoins ?? []).filter(
    (coin: any) => !coin?.meta?.registeredForDustGeneration,
  );
}

async function logSyncedWalletSnapshot(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
  label: string,
): Promise<any> {
  const state = await getSyncedWalletState(walletCtx.wallet);
  const nightBalance = getNightBalance(state);
  const dustBalance = getDustBalance(state);
  const availableCoins = state.unshielded?.availableCoins?.length ?? 0;
  const unregisteredNightUtxos = getUnregisteredNightUtxos(state);

  console.log(`  ${label}`);
  console.log(`    NIGHT balance: ${nightBalance.toLocaleString()} tNight`);
  console.log(`    DUST balance: ${dustBalance.toLocaleString()}`);
  console.log(`    Available NIGHT coins: ${availableCoins}`);
  console.log(`    Unregistered NIGHT UTXOs: ${unregisteredNightUtxos.length}\n`);

  return state;
}

async function createGlobalProviders(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
): Promise<any> {
  const state = await getSyncedWalletState(walletCtx.wallet);

  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () =>
      state.shielded.encryptionPublicKey.toHexString(),

    async balanceTx(tx: any, ttl?: Date) {
      await logSyncedWalletSnapshot(
        walletCtx,
        "Fresh synced wallet snapshot immediately before balanceTx",
      );

      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey: walletCtx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );

      const signFn = (payload: Uint8Array) =>
        walletCtx.unshieldedKeystore.signData(payload);

      signTransactionIntents(recipe.baseTransaction, signFn, "proof");

      if (recipe.balancingTransaction) {
        signTransactionIntents(recipe.balancingTransaction, signFn, "pre-proof");
      }

      return walletCtx.wallet.finalizeRecipe(recipe);
    },

    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(globalZkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().asString();

  return {
    privateStateProvider: (levelPrivateStateProvider as any)({
      privateStateStoreName: CONTACT_MODE_GLOBAL_PRIVATE_STATE_ID,
      accountId,
      privateStoragePasswordProvider: () =>
        "NightforceGlobalContactMode#2026!Only",
      walletProvider,
    }),
    publicDataProvider: indexerPublicDataProvider(
      CONFIG.indexer,
      CONFIG.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(CONFIG.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  } as any;
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(
    DEPLOY_TARGET === "preprod"
      ? "║  Deploy GLOBAL Contact Mode to Midnight Preprod            ║"
      : "║  Deploy GLOBAL Contact Mode to Midnight Local Network      ║",
  );
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  if (!fs.existsSync(globalContractPath)) {
    console.error(
      "Global contract not compiled. Run: pnpm run compile:global",
    );
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    console.log("─── Step 1: Wallet Setup ───────────────────────────────────────\n");

    const walletChoice = await rl.question(
      "  [1] Create new wallet\n  [2] Restore from seed\n  > ",
    );

    const seed =
      walletChoice.trim() === "2"
        ? await rl.question("\n  Enter your 64-character seed: ")
        : toHex(Buffer.from(generateRandomSeed()));

    if (walletChoice.trim() !== "2") {
      console.log(`\n  ⚠️  SAVE THIS SEED. It is NOT written to the public deployment file:\n  ${seed}\n`);
    }

    console.log("  Creating wallet...");
    const walletCtx = await createWallet(seed);

    try {
      console.log("  Syncing with network...");
      const state = await getSyncedWalletState(walletCtx.wallet);

      const address = walletCtx.unshieldedKeystore.getBech32Address();
      const balance = getNightBalance(state);

      console.log(`\n  Wallet Address: ${address}`);
      console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

      if (balance === 0n) {
        console.log("─── Step 2: Fund Your Wallet ───────────────────────────────────\n");

        if (DEPLOY_TARGET === "preprod") {
          console.log("  Visit the Midnight Preprod faucet in your browser.");
          console.log("  Faucet: https://faucet.preprod.midnight.network/");
        } else {
          console.log("  Fund this wallet using your Midnight local network setup.");
        }

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

      const dustState = await logSyncedWalletSnapshot(
        walletCtx,
        "Initial DUST setup wallet snapshot",
      );

      const nightUtxos = getUnregisteredNightUtxos(dustState);

      if (nightUtxos.length > 0) {
        console.log("  Registering unregistered NIGHT UTXOs for DUST generation...");

        const recipe =
          await walletCtx.wallet.registerNightUtxosForDustGeneration(
            nightUtxos,
            walletCtx.unshieldedKeystore.getPublicKey(),
            (payload: Uint8Array) =>
              walletCtx.unshieldedKeystore.signData(payload),
          );

        await walletCtx.wallet.submitTransaction(
          await walletCtx.wallet.finalizeRecipe(recipe),
        );

        await logSyncedWalletSnapshot(
          walletCtx,
          "Wallet snapshot after DUST registration transaction",
        );
      }

      const postRegistrationState = await logSyncedWalletSnapshot(
        walletCtx,
        "Post-registration synced wallet snapshot",
      );

      if (getDustBalance(postRegistrationState) === 0n || nightUtxos.length > 0) {
        console.log("  Waiting for fresh DUST tokens...");

        await Rx.firstValueFrom(
          walletCtx.wallet.state().pipe(
            Rx.filter((s: any) => Boolean(s?.isSynced)),
            Rx.filter(
              (s: any) => (s?.dust?.balance?.(new Date()) ?? 0n) > 0n,
            ),
          ),
        );
      }

      await logSyncedWalletSnapshot(
        walletCtx,
        "Final synced wallet snapshot immediately before deploy",
      );

      console.log("  DUST tokens ready!\n");

      console.log("─── Step 4: Deploy Global Contract ─────────────────────────────\n");
      console.log("  Setting up providers...");

      const providers = await createGlobalProviders(walletCtx);

      console.log("  Deploying global Contact Mode contract...\n");

      const deployed = await (deployContract as any)(providers, {
        compiledContract: compiledGlobalContract as any,
        privateStateId: CONTACT_MODE_GLOBAL_PRIVATE_STATE_ID,
        initialPrivateState: {},
        args: [],
      });

      const contractAddress = (deployed as any).deployTxData.public.contractAddress;

      console.log("  ✅ Global Contact Mode contract deployed successfully!\n");
      console.log(`  Contract Address: ${contractAddress}\n`);

      const publicDeploymentInfo = {
        contractAddress,
        network: TARGET_NETWORK_ID,
        contract: "contact-mode-global",
        deployedAt: new Date().toISOString(),
      };

      const publicFile =
        DEPLOY_TARGET === "preprod"
          ? "deployment.global.preprod.public.json"
          : "deployment.global.local.public.json";

      fs.writeFileSync(publicFile, JSON.stringify(publicDeploymentInfo, null, 2));
      console.log(`  Saved public deployment metadata to ${publicFile}\n`);
      console.log("  Private seed was not written to this file.\n");
    } finally {
      await walletCtx.wallet.stop();
    }

    console.log("─── Global Deployment Complete! ────────────────────────────────\n");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
