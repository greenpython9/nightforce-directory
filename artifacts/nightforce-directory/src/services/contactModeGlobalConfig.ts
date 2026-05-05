import { MIDNIGHT_NETWORK_ID } from "./walletService";

export type ContactModeGlobalNetworkId = "preprod" | "mainnet";

export type ContactModeGlobalConfig = {
  architecture: "global";
  enabled: boolean;
  networkId: ContactModeGlobalNetworkId;
  contractAddress: string | null;
  source: "api" | "env" | "missing";
};

const API_BASE_URL = (
  import.meta.env.VITE_NIGHTFORCE_API_BASE_URL as string | undefined
)?.replace(/\/$/, "");

function normalizeNetworkId(value: string | undefined): ContactModeGlobalNetworkId {
  return value === "mainnet" ? "mainnet" : "preprod";
}

function getEnvContractAddress(networkId: ContactModeGlobalNetworkId): string | null {
  const rawValue =
    networkId === "mainnet"
      ? (import.meta.env
          .VITE_CONTACT_MODE_GLOBAL_MAINNET_CONTRACT_ADDRESS as string | undefined)
      : (import.meta.env
          .VITE_CONTACT_MODE_GLOBAL_PREPROD_CONTRACT_ADDRESS as string | undefined);

  const normalized = rawValue?.trim();

  return normalized && normalized.length > 0 ? normalized : null;
}

function getApiUrl(path: string): string {
  return `${API_BASE_URL ?? ""}${path}`;
}

export function getStaticGlobalContactModeConfig(
  networkId = normalizeNetworkId(MIDNIGHT_NETWORK_ID),
): ContactModeGlobalConfig {
  const contractAddress = getEnvContractAddress(networkId);

  return {
    architecture: "global",
    enabled: Boolean(contractAddress),
    networkId,
    contractAddress,
    source: contractAddress ? "env" : "missing",
  };
}

export async function fetchGlobalContactModeConfig(
  networkId = normalizeNetworkId(MIDNIGHT_NETWORK_ID),
): Promise<ContactModeGlobalConfig> {
  try {
    const response = await window.fetch(
      getApiUrl(
        `/api/nightforce/contact-mode/global-config?networkId=${encodeURIComponent(
          networkId,
        )}`,
      ),
      {
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to load global Contact Mode config (${response.status})`);
    }

    const payload = (await response.json()) as Partial<ContactModeGlobalConfig>;

    if (payload.networkId !== "preprod" && payload.networkId !== "mainnet") {
      throw new Error("Global Contact Mode config returned an invalid networkId.");
    }

    const contractAddress =
      typeof payload.contractAddress === "string" &&
      payload.contractAddress.trim().length > 0
        ? payload.contractAddress.trim()
        : null;

    return {
      architecture: "global",
      enabled: Boolean(contractAddress),
      networkId: payload.networkId,
      contractAddress,
      source: "api",
    };
  } catch {
    return getStaticGlobalContactModeConfig(networkId);
  }
}
