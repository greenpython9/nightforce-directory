import { createDefaultProvider, getDefaultProvider } from "@midnames/sdk";

type MidnamesNetworkId = "preprod" | "mainnet";

const rawFeatureFlag = import.meta.env.VITE_FEATURE_MIDNAMES;
const rawNetworkId = import.meta.env.VITE_MIDNAMES_NETWORK_ID;

export const MIDNAMES_ENABLED = rawFeatureFlag !== "false";

export const MIDNAMES_NETWORK_ID: MidnamesNetworkId =
  rawNetworkId === "mainnet" ? "mainnet" : "preprod";

let cachedProvider: ReturnType<typeof createDefaultProvider> | null = null;

export function getMidnamesProvider(): ReturnType<typeof createDefaultProvider> {
  if (cachedProvider) {
    return cachedProvider;
  }

  cachedProvider =
    MIDNAMES_NETWORK_ID === "preprod"
      ? createDefaultProvider({ networkId: "preprod" })
      : (getDefaultProvider() as ReturnType<typeof createDefaultProvider>);

  return cachedProvider;
}

export function getMidnamesNetworkLabel(): string {
  return MIDNAMES_NETWORK_ID === "preprod" ? "preprod" : "mainnet";
}

export function isMidnamesPreprod(): boolean {
  return MIDNAMES_NETWORK_ID === "preprod";
}
