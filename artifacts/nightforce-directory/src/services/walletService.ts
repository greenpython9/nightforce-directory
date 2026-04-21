import "@midnight-ntwrk/dapp-connector-api";

export interface WalletAdapter {
  connect(walletId: string): Promise<{ walletId: string }>;
  disconnect(): Promise<void>;
  getConnectedWallet(): string | null;
}

export interface MidnightWalletProviderSummary {
  providerId: string;
  providerName: string;
  icon: string | null;
  apiVersion: string;
}

export interface MidnightWalletSnapshot {
  providerId: string;
  providerName: string;
  icon: string | null;
  apiVersion: string;
  networkId: string;
  shieldedAddress: string | null;
  unshieldedAddress: string | null;
  dustAddress: string | null;
  dustBalance: {
    balance: string;
    cap: string;
  } | null;
  configuration: {
    indexerUri: string;
    indexerWsUri: string;
    proverServerUri: string;
    substrateNodeUri: string;
    networkId: string;
  } | null;
}

type MidnightInitialApiLike = {
  name?: string;
  icon?: string;
  apiVersion?: string;
  connect: (networkId: string) => Promise<MidnightConnectedApiLike>;
};

type MidnightConnectedApiLike = {
  getConfiguration?: () => Promise<{
    indexerUri?: string;
    indexerWsUri?: string;
    proverServerUri?: string;
    substrateNodeUri?: string;
    networkId?: string;
  }>;
  getConnectionStatus?: () => Promise<{
    networkId?: string;
  }>;
  getShieldedAddresses?: () => Promise<{
    shieldedAddress?: string;
  }>;
  getUnshieldedAddress?: () => Promise<{
    unshieldedAddress?: string;
  }>;
  getDustAddress?: () => Promise<{
    dustAddress?: string;
  }>;
  getDustBalance?: () => Promise<{
    balance?: bigint;
    cap?: bigint;
  }>;
};


export interface ProfileProofState {
  contractAddress: string;
  network: string;
  visibility: {
    name: string;
    value: number;
  };
  countryCode: {
    name: string;
    value: number;
  };
}

const PROFILE_PROOF_STATE_URL = "http://127.0.0.1:4000/api/profile-proof/state";

export async function getProfileProofState(): Promise<ProfileProofState> {
  const response = await fetch(PROFILE_PROOF_STATE_URL);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.details ??
      payload?.error ??
      `Failed to load profile-proof state (${response.status})`;

    throw new Error(message);
  }

  return payload as ProfileProofState;
}


// ============================================================
// MOCK WALLET IMPLEMENTATION
// Keep this for the local proof-of-life flow.
//
// MIDNIGHT BATCH C - STEP 1
// App-side local network retarget only.
// Adds helper functions for:
//   - detecting injected Midnight wallets
//   - connecting to local undeployed network
//   - reading wallet addresses/config/dust balance
//
// We are still NOT replacing the existing mock adapter.
// Mock flow stays intact while we begin app-side Midnight integration.
// ============================================================

export const MOCK_WALLETS = [
  "admin-wallet-001",
  "member-wallet-001",
  "member-wallet-002",
  "member-wallet-003",
  "member-wallet-004",
  "member-wallet-005",
  "member-wallet-006",
];

export const ADMIN_WALLET_ID = "admin-wallet-001";
export const MIDNIGHT_NETWORK_ID = "undeployed";

const WALLET_STORAGE_KEY = "nightforce_wallet";
const MIDNIGHT_PROVIDER_STORAGE_KEY = "nightforce_midnight_provider";

class MockWalletAdapter implements WalletAdapter {
  private connectedWalletId: string | null = null;

  constructor() {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(WALLET_STORAGE_KEY);
    if (saved && MOCK_WALLETS.includes(saved)) {
      this.connectedWalletId = saved;
    }
  }

  async connect(walletId: string): Promise<{ walletId: string }> {
    this.connectedWalletId = walletId;
    localStorage.setItem(WALLET_STORAGE_KEY, walletId);
    return { walletId };
  }

  async disconnect(): Promise<void> {
    this.connectedWalletId = null;
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }

  getConnectedWallet(): string | null {
    return this.connectedWalletId;
  }
}

let _adapter: WalletAdapter | null = null;

export function getWalletAdapter(): WalletAdapter {
  if (!_adapter) {
    _adapter = new MockWalletAdapter();
  }
  return _adapter;
}

let connectedMidnightApi: MidnightConnectedApiLike | null = null;
let connectedMidnightProviderId: string | null = null;

function getMidnightRegistry(): Record<string, MidnightInitialApiLike | undefined> {
  if (typeof window === "undefined") {
    return {};
  }

  const maybeWindow = window as Window & {
    midnight?: Record<string, MidnightInitialApiLike | undefined>;
  };

  return maybeWindow.midnight ?? {};
}

function formatBigIntLike(value: bigint | undefined): string {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return "0";
}

async function buildMidnightWalletSnapshot(
  providerId: string,
  provider: MidnightInitialApiLike,
  connectedApi: MidnightConnectedApiLike,
): Promise<MidnightWalletSnapshot> {
  const [configuration, connectionStatus, shieldedAddresses, unshieldedAddress, dustAddress, dustBalance] =
    await Promise.all([
      connectedApi.getConfiguration?.() ?? Promise.resolve(undefined),
      connectedApi.getConnectionStatus?.() ?? Promise.resolve(undefined),
      connectedApi.getShieldedAddresses?.() ?? Promise.resolve(undefined),
      connectedApi.getUnshieldedAddress?.() ?? Promise.resolve(undefined),
      connectedApi.getDustAddress?.() ?? Promise.resolve(undefined),
      connectedApi.getDustBalance?.() ?? Promise.resolve(undefined),
    ]);

  return {
    providerId,
    providerName: provider.name ?? providerId,
    icon: provider.icon ?? null,
    apiVersion: provider.apiVersion ?? "unknown",
    networkId:
      connectionStatus?.networkId ??
      configuration?.networkId ??
      MIDNIGHT_NETWORK_ID,
    shieldedAddress: shieldedAddresses?.shieldedAddress ?? null,
    unshieldedAddress: unshieldedAddress?.unshieldedAddress ?? null,
    dustAddress: dustAddress?.dustAddress ?? null,
    dustBalance: dustBalance
      ? {
          balance: formatBigIntLike(dustBalance.balance),
          cap: formatBigIntLike(dustBalance.cap),
        }
      : null,
    configuration: configuration
      ? {
          indexerUri: configuration.indexerUri ?? "",
          indexerWsUri: configuration.indexerWsUri ?? "",
          proverServerUri: configuration.proverServerUri ?? "",
          substrateNodeUri: configuration.substrateNodeUri ?? "",
          networkId: configuration.networkId ?? MIDNIGHT_NETWORK_ID,
        }
      : null,
  };
}

export function getAvailableMidnightWallets(): MidnightWalletProviderSummary[] {
  const registry = getMidnightRegistry();

  return Object.entries(registry)
    .filter((entry): entry is [string, MidnightInitialApiLike] => {
      const [, wallet] = entry;
      return !!wallet && typeof wallet.connect === "function";
    })
    .map(([providerId, wallet]) => ({
      providerId,
      providerName: wallet.name ?? providerId,
      icon: wallet.icon ?? null,
      apiVersion: wallet.apiVersion ?? "unknown",
    }));
}

export function getStoredMidnightProviderId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(MIDNIGHT_PROVIDER_STORAGE_KEY);
}

export async function connectMidnightWallet(
  providerId: string,
): Promise<MidnightWalletSnapshot> {
  const provider = getMidnightRegistry()[providerId];

  if (!provider || typeof provider.connect !== "function") {
    throw new Error(
      "Selected Midnight wallet was not found. Refresh the page and try again.",
    );
  }

  const api = await provider.connect(MIDNIGHT_NETWORK_ID);

  connectedMidnightApi = api;
  connectedMidnightProviderId = providerId;
  localStorage.setItem(MIDNIGHT_PROVIDER_STORAGE_KEY, providerId);

  return buildMidnightWalletSnapshot(providerId, provider, api);
}

export async function getMidnightWalletSnapshot(): Promise<MidnightWalletSnapshot | null> {
  if (!connectedMidnightApi || !connectedMidnightProviderId) {
    return null;
  }

  const provider = getMidnightRegistry()[connectedMidnightProviderId];
  if (!provider) {
    return null;
  }

  return buildMidnightWalletSnapshot(
    connectedMidnightProviderId,
    provider,
    connectedMidnightApi,
  );
}

export async function disconnectMidnightWallet(): Promise<void> {
  connectedMidnightApi = null;
  connectedMidnightProviderId = null;

  if (typeof window !== "undefined") {
    localStorage.removeItem(MIDNIGHT_PROVIDER_STORAGE_KEY);
  }
}