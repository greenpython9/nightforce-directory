export type MidnamesNetworkId = "preprod" | "mainnet";

const rawFeatureFlag = import.meta.env.VITE_FEATURE_MIDNAMES;
const rawNetworkId = import.meta.env.VITE_MIDNAMES_NETWORK_ID;

export const MIDNAMES_ENABLED = rawFeatureFlag !== "false";

export const MIDNAMES_NETWORK_ID: MidnamesNetworkId =
  rawNetworkId === "mainnet" ? "mainnet" : "preprod";

export function getMidnamesNetworkLabel(): string {
  return MIDNAMES_NETWORK_ID === "preprod" ? "preprod" : "mainnet";
}

export function isMidnamesPreprod(): boolean {
  return MIDNAMES_NETWORK_ID === "preprod";
}
