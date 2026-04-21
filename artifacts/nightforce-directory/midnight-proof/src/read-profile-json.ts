import * as fs from "node:fs";

import {
  createWallet,
  createProviders,
  ProfileProof,
  getSyncedWalletState,
} from "./utils.js";

async function main() {
  if (!fs.existsSync("deployment.json")) {
    throw new Error("No deployment.json found");
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
    walletCtx = await createWallet(deployment.seed.trim());
    await getSyncedWalletState(walletCtx.wallet);

    const providers = await createProviders(walletCtx);
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

    process.stdout.write(
      JSON.stringify({
        contractAddress: deployment.contractAddress,
        network: deployment.network ?? "undeployed",
        visibility: {
          name: visibilityName,
          value: visibilityValue,
        },
        countryCode: {
          name: countryCodeName,
          value: countryCodeValue,
        },
      }),
    );
  } finally {
    if (walletCtx) {
      await walletCtx.wallet.stop();
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});