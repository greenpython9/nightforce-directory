import { createDefaultProvider, getDefaultProvider } from "@midnames/sdk";

import { MIDNAMES_NETWORK_ID } from "./midnamesConfig";

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
