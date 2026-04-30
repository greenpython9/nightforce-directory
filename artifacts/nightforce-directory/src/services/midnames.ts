import { createDefaultProvider } from "@midnames/sdk";

let cachedProvider: ReturnType<typeof createDefaultProvider> | null = null;

export function getMidnamesProvider(): ReturnType<typeof createDefaultProvider> {
  if (cachedProvider) {
    return cachedProvider;
  }

  cachedProvider = createDefaultProvider({ networkId: "preprod" });

  return cachedProvider;
}

export function getMidnamesNetworkLabel(): string {
  return "preprod";
}

export function isMidnamesPreprod(): boolean {
  return true;
}