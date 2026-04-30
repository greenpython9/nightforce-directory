export type MidnamesNetworkId = "preprod" | "mainnet";

const rawFeatureFlag = import.meta.env.VITE_FEATURE_MIDNAMES;

export const MIDNAMES_ENABLED = rawFeatureFlag !== "false";

/**
 * nightforce.cc intentionally keeps .night / Midnames resolution on preprod
 * during the Midnight mainnet migration.
 *
 * Do not wire this to VITE_MIDNAMES_NETWORK_ID yet.
 */
export const MIDNAMES_NETWORK_ID: MidnamesNetworkId = "preprod";

export function getMidnamesNetworkLabel(): string {
  return "preprod";
}

export function isMidnamesPreprod(): boolean {
  return true;
}