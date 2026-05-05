import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import * as ledger from "@midnight-ntwrk/ledger-v8";

import * as ContactModeGlobalContract from "../../midnight-contact-mode/contracts/managed/contact-mode-global/contract/index.js";

import {
  MIDNIGHT_NETWORK_ID,
  getConnectedMidnightApi,
} from "./walletService";

type ConnectedConfiguration = {
  indexerUri?: string;
  indexerWsUri?: string;
  proverServerUri?: string;
  networkId?: string;
};

type ConnectedShieldedAddresses = {
  shieldedAddress?: string;
  shieldedCoinPublicKey?: string;
  shieldedEncryptionPublicKey?: string;
};

type ContactModeConnectedApi = {
  balanceUnsealedTransaction?: (
    tx: string,
    options?: { payFees?: boolean },
  ) => Promise<{ tx: string }>;
  submitTransaction?: (tx: string) => Promise<void>;
};

export type ContactModeGlobalValue =
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED";

export type GlobalContactModeReadResult = {
  contractAddress: string;
  networkId: string;
  profileKey: string;
  registered: boolean;
  contactMode: ContactModeGlobalValue | null;
  rawValue: number | string | null;
  ownerCommitment: string | null;
};

const CONTACT_MODE_GLOBAL_ZK_BASE_URL = new URL(
  "../../midnight-contact-mode/contracts/managed/contact-mode-global/",
  import.meta.url,
).href;

const CONTACT_MODE_GLOBAL_PRIVATE_STATE_ID = "contactModeGlobalStateBrowser";
const CONTACT_MODE_GLOBAL_LOCAL_SECRET_KEY_STORAGE_KEY =
  "nightforce:contact-mode-global:local-secret-key:v1";

const CONTACT_MODE_GLOBAL_CONFIRMATION_ATTEMPTS = 18;
const CONTACT_MODE_GLOBAL_CONFIRMATION_DELAY_MS = 5_000;

function requireBalanceUnsealedTransaction(
  connectedApi: ContactModeConnectedApi,
): NonNullable<ContactModeConnectedApi["balanceUnsealedTransaction"]> {
  if (typeof connectedApi.balanceUnsealedTransaction !== "function") {
    throw new Error(
      "Connected Midnight wallet does not expose balanceUnsealedTransaction. This wallet cannot prepare global Contact Mode transactions in the expected Nightforce flow.",
    );
  }

  return connectedApi.balanceUnsealedTransaction.bind(connectedApi);
}

function getReadableWalletError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  try {
    const serialized = JSON.stringify(error);

    if (serialized && serialized !== "{}") {
      return serialized;
    }
  } catch {
    // Fall back below.
  }

  return fallback;
}

function requireSubmitTransaction(
  connectedApi: ContactModeConnectedApi,
): NonNullable<ContactModeConnectedApi["submitTransaction"]> {
  if (typeof connectedApi.submitTransaction !== "function") {
    throw new Error(
      "Connected Midnight wallet does not expose submitTransaction. The transaction was not submitted. Unlock the wallet, reconnect, and try again.",
    );
  }

  const submitTransaction = connectedApi.submitTransaction.bind(connectedApi);

  return async (tx: string) => {
    try {
      await submitTransaction(tx);
    } catch (error) {
      throw new Error(
        `Midnight wallet submitTransaction failed: ${getReadableWalletError(
          error,
          "The wallet rejected or failed the transaction without a readable error.",
        )}`,
      );
    }
  };
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToUint8Array(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;

  if (clean.length === 0) {
    return new Uint8Array();
  }

  if (clean.length % 2 !== 0) {
    throw new Error("Invalid hex string length.");
  }

  const bytes = new Uint8Array(clean.length / 2);

  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }

  return bytes;
}

function normalizeHex32(value: string, label: string): string {
  const clean = value.trim().toLowerCase().replace(/^0x/, "");

  if (!/^[0-9a-f]{64}$/.test(clean)) {
    throw new Error(`${label} must be a 32-byte hex string.`);
  }

  return clean;
}

export function getOrCreateGlobalContactModeLocalSecretKey(): Uint8Array {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error(
      "localStorage is not available for global Contact Mode witnesses.",
    );
  }

  const existing = window.localStorage.getItem(
    CONTACT_MODE_GLOBAL_LOCAL_SECRET_KEY_STORAGE_KEY,
  );

  if (existing) {
    const bytes = hexToUint8Array(existing);

    if (bytes.length === 32) {
      return bytes;
    }
  }

  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);

  window.localStorage.setItem(
    CONTACT_MODE_GLOBAL_LOCAL_SECRET_KEY_STORAGE_KEY,
    uint8ArrayToHex(bytes),
  );

  return bytes;
}

export function deriveOwnerCommitment(): string {
  const secretKey = getOrCreateGlobalContactModeLocalSecretKey();
  const commitment = (ContactModeGlobalContract as any).pureCircuits.getOwnerCommitment(
    secretKey,
  );

  return uint8ArrayToHex(commitment);
}

const contactModeGlobalWitnesses = {
  localSecretKey(context: { privateState: unknown }) {
    return [context.privateState, getOrCreateGlobalContactModeLocalSecretKey()];
  },
};

const compiledGlobalContract = CompiledContract.make(
  "contact-mode-global",
  (ContactModeGlobalContract as any).Contract,
).pipe(CompiledContract.withWitnesses(contactModeGlobalWitnesses as any)) as any;

function createBrowserPrivateStateProvider(storeName: string) {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("localStorage is not available in this browser.");
  }

  const storage = window.localStorage;
  let scopedContractAddress: string | null = null;

  function requireContractAddress(): string {
    if (!scopedContractAddress) {
      throw new Error("Private state provider contract address not set.");
    }

    return scopedContractAddress;
  }

  function stateKey(privateStateId: string): string {
    return `${storeName}:contract:${requireContractAddress()}:state:${privateStateId}`;
  }

  function signingKeyKey(address: string): string {
    return `${storeName}:signing:${address}`;
  }

  return {
    setContractAddress(address: string) {
      scopedContractAddress = address;
    },

    async get(privateStateId: string) {
      const raw = storage.getItem(stateKey(privateStateId));
      return raw ? JSON.parse(raw) : null;
    },

    async set(privateStateId: string, state: unknown) {
      storage.setItem(stateKey(privateStateId), JSON.stringify(state ?? {}));
    },

    async remove(privateStateId: string) {
      storage.removeItem(stateKey(privateStateId));
    },

    async clear() {
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);

        if (key && key.startsWith(`${storeName}:`)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        storage.removeItem(key);
      }
    },

    async getSigningKey(address: string) {
      return storage.getItem(signingKeyKey(address));
    },

    async setSigningKey(address: string, signingKey: string) {
      storage.setItem(signingKeyKey(address), signingKey);
    },

    async removeSigningKey(address: string) {
      storage.removeItem(signingKeyKey(address));
    },

    async clearSigningKeys() {
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);

        if (key && key.startsWith(`${storeName}:signing:`)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        storage.removeItem(key);
      }
    },

    async exportPrivateStates() {
      throw new Error("Private state export is not implemented in this browser helper.");
    },

    async exportSigningKeys() {
      throw new Error("Signing key export is not implemented in this browser helper.");
    },

    async importPrivateStates() {
      throw new Error("Private state import is not implemented in this browser helper.");
    },

    async importSigningKeys() {
      throw new Error("Signing key import is not implemented in this browser helper.");
    },
  };
}

function toContractModeValue(value: ContactModeGlobalValue): number {
  const ContactMode = (ContactModeGlobalContract as any).ContactMode;

  switch (value) {
    case "PRIVATE_CONTACT_AVAILABLE":
      return ContactMode.PRIVATE_CONTACT_AVAILABLE;
    case "PUBLIC_CONTACT_ALLOWED":
      return ContactMode.PUBLIC_CONTACT_ALLOWED;
    case "NO_CONTACT":
    default:
      return ContactMode.NO_CONTACT;
  }
}

function fromContractModeValue(value: unknown): ContactModeGlobalValue {
  const ContactMode = (ContactModeGlobalContract as any).ContactMode;

  if (value === ContactMode.PUBLIC_CONTACT_ALLOWED || value === 2) {
    return "PUBLIC_CONTACT_ALLOWED";
  }

  if (value === ContactMode.PRIVATE_CONTACT_AVAILABLE || value === 1) {
    return "PRIVATE_CONTACT_AVAILABLE";
  }

  return "NO_CONTACT";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function requireConfiguredGlobalContractAddress(contractAddress: string): string {
  const cleanContractAddress = contractAddress.trim();

  if (!cleanContractAddress) {
    throw new Error("Global Contact Mode contract address is required.");
  }

  return cleanContractAddress;
}

async function getConnectedGlobalContactModeProviders(contractAddress: string) {
  if (MIDNIGHT_NETWORK_ID !== "preprod") {
    throw new Error(
      `Global Contact Mode writes are temporarily enabled only on preprod. Current network: ${MIDNIGHT_NETWORK_ID}`,
    );
  }

  const connectedApi = getConnectedMidnightApi();

  if (!connectedApi) {
    throw new Error("Connect a Midnight wallet first.");
  }

  const [configuration, shieldedAddresses] = await Promise.all([
    (connectedApi.getConfiguration?.() ??
      Promise.resolve(undefined)) as Promise<ConnectedConfiguration | undefined>,
    (connectedApi.getShieldedAddresses?.() ??
      Promise.resolve(undefined)) as Promise<
      ConnectedShieldedAddresses | undefined
    >,
  ]);

  if (
    !configuration?.indexerUri ||
    !configuration?.indexerWsUri ||
    !configuration?.proverServerUri
  ) {
    throw new Error(
      "Connected Midnight wallet did not provide indexer/prover configuration.",
    );
  }

  if (
    !shieldedAddresses?.shieldedCoinPublicKey ||
    !shieldedAddresses?.shieldedEncryptionPublicKey
  ) {
    throw new Error(
      "Connected Midnight wallet did not provide shielded public keys.",
    );
  }

  setNetworkId(MIDNIGHT_NETWORK_ID);

  const browserFetch: typeof fetch = (...args) => window.fetch(...args);

  const zkConfigProvider = new FetchZkConfigProvider(
    CONTACT_MODE_GLOBAL_ZK_BASE_URL,
    browserFetch,
  );

  const proofProvider = httpClientProofProvider(
    configuration.proverServerUri,
    zkConfigProvider,
  );

  const walletProvider = {
    getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey as string,

    getEncryptionPublicKey: () =>
      shieldedAddresses.shieldedEncryptionPublicKey as string,

    async balanceTx(tx: any) {
      const serialized = uint8ArrayToHex(tx.serialize());
      const balanceUnsealedTransaction =
        requireBalanceUnsealedTransaction(connectedApi);

      const result = await balanceUnsealedTransaction(serialized, {
        payFees: true,
      });

      if (!result?.tx) {
        throw new Error(
          "Midnight wallet failed to balance the global Contact Mode transaction.",
        );
      }

      const bytes = hexToUint8Array(result.tx);

      return ledger.Transaction.deserialize(
        "signature",
        "proof",
        "binding",
        bytes,
      );
    },
  };

  const midnightProvider = {
    async submitTx(tx: any): Promise<string> {
      const serialized = uint8ArrayToHex(tx.serialize());
      const submitTransaction = requireSubmitTransaction(connectedApi);

      await submitTransaction(serialized);

      if (typeof tx.identifiers === "function") {
        const ids = tx.identifiers();

        if (Array.isArray(ids) && ids.length > 0) {
          return ids[0];
        }
      }

      return "";
    },
  };

  const privateStateProvider = createBrowserPrivateStateProvider(
    CONTACT_MODE_GLOBAL_PRIVATE_STATE_ID,
  );

  if (typeof privateStateProvider.setContractAddress === "function") {
    privateStateProvider.setContractAddress(contractAddress);
  }

  const publicDataProvider = indexerPublicDataProvider(
    configuration.indexerUri,
    configuration.indexerWsUri,
  );

  return {
    configuration,
    providers: {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    } as any,
    publicDataProvider,
  };
}

async function getReadOnlyPublicDataProvider(): Promise<{
  networkId: string;
  publicDataProvider: {
    queryContractState: (contractAddress: string) => Promise<{ data: unknown } | null>;
  };
}> {
  if (MIDNIGHT_NETWORK_ID !== "preprod" && MIDNIGHT_NETWORK_ID !== "mainnet") {
    throw new Error(
      `Global Contact Mode read requires preprod or mainnet. Current network: ${MIDNIGHT_NETWORK_ID}`,
    );
  }

  const connectedApi = getConnectedMidnightApi();

  if (!connectedApi) {
    throw new Error("Connect a Midnight wallet first.");
  }

  const configuration =
    ((await connectedApi.getConfiguration?.()) as ConnectedConfiguration | undefined) ??
    undefined;

  if (!configuration?.indexerUri || !configuration?.indexerWsUri) {
    throw new Error(
      "Connected Midnight wallet did not provide indexer configuration.",
    );
  }

  setNetworkId(MIDNIGHT_NETWORK_ID);

  return {
    networkId: configuration.networkId ?? MIDNIGHT_NETWORK_ID,
    publicDataProvider: indexerPublicDataProvider(
      configuration.indexerUri,
      configuration.indexerWsUri,
    ),
  };
}

async function readGlobalContactModeFromPublicDataProvider(args: {
  publicDataProvider: {
    queryContractState: (contractAddress: string) => Promise<{ data: unknown } | null>;
  };
  contractAddress: string;
  profileKey: string;
}): Promise<GlobalContactModeReadResult> {
  const cleanContractAddress = requireConfiguredGlobalContractAddress(
    args.contractAddress,
  );
  const cleanProfileKey = normalizeHex32(args.profileKey, "profileKey");
  const profileKeyBytes = hexToUint8Array(cleanProfileKey);

  const state = await args.publicDataProvider.queryContractState(cleanContractAddress);

  if (!state) {
    throw new Error("No global Contact Mode contract state was found.");
  }

  const ledgerState = (ContactModeGlobalContract as any).ledger(state.data);
  const registered = ledgerState.ownerCommitments.member(profileKeyBytes);

  if (!registered) {
    return {
      contractAddress: cleanContractAddress,
      networkId: MIDNIGHT_NETWORK_ID,
      profileKey: cleanProfileKey,
      registered: false,
      contactMode: null,
      rawValue: null,
      ownerCommitment: null,
    };
  }

  const rawValue = ledgerState.contactModes.lookup(profileKeyBytes);
  const ownerCommitment = ledgerState.ownerCommitments.lookup(profileKeyBytes);

  return {
    contractAddress: cleanContractAddress,
    networkId: MIDNIGHT_NETWORK_ID,
    profileKey: cleanProfileKey,
    registered: true,
    contactMode: fromContractModeValue(rawValue),
    rawValue:
      typeof rawValue === "number" || typeof rawValue === "string"
        ? rawValue
        : String(rawValue),
    ownerCommitment: uint8ArrayToHex(ownerCommitment),
  };
}

async function waitForGlobalContactModeConfirmation(args: {
  publicDataProvider: {
    queryContractState: (contractAddress: string) => Promise<{ data: unknown } | null>;
  };
  contractAddress: string;
  profileKey: string;
  expectedMode: ContactModeGlobalValue;
}): Promise<void> {
  let lastSeenMode: ContactModeGlobalValue | "NO_STATE" | "NOT_REGISTERED" =
    "NO_STATE";

  for (
    let attempt = 1;
    attempt <= CONTACT_MODE_GLOBAL_CONFIRMATION_ATTEMPTS;
    attempt += 1
  ) {
    const result = await readGlobalContactModeFromPublicDataProvider({
      publicDataProvider: args.publicDataProvider,
      contractAddress: args.contractAddress,
      profileKey: args.profileKey,
    });

    if (!result.registered) {
      lastSeenMode = "NOT_REGISTERED";
    } else if (result.contactMode) {
      lastSeenMode = result.contactMode;

      if (result.contactMode === args.expectedMode) {
        return;
      }
    }

    if (attempt < CONTACT_MODE_GLOBAL_CONFIRMATION_ATTEMPTS) {
      await sleep(CONTACT_MODE_GLOBAL_CONFIRMATION_DELAY_MS);
    }
  }

  throw new Error(
    `Global Contact Mode transaction was submitted, but the indexer still reports ${lastSeenMode} instead of ${args.expectedMode}. Wait a minute, then try Verify Sync again.`,
  );
}

export async function registerOrRotateGlobalContactModeEntry(args: {
  contractAddress: string;
  profileKey: string;
  nextMode: ContactModeGlobalValue;
}): Promise<{
  contractAddress: string;
  networkId: string;
  profileKey: string;
  ownerCommitment: string;
  nextMode: ContactModeGlobalValue;
}> {
  const cleanContractAddress = requireConfiguredGlobalContractAddress(
    args.contractAddress,
  );
  const cleanProfileKey = normalizeHex32(args.profileKey, "profileKey");

  const { configuration, providers, publicDataProvider } =
    await getConnectedGlobalContactModeProviders(cleanContractAddress);

  const contract = await (findDeployedContract as any)(providers, {
    contractAddress: cleanContractAddress,
    compiledContract: compiledGlobalContract,
    privateStateId: CONTACT_MODE_GLOBAL_PRIVATE_STATE_ID,
    initialPrivateState: {},
  });

  await contract.callTx.registerEntry(
    hexToUint8Array(cleanProfileKey),
    toContractModeValue(args.nextMode),
  );

  await waitForGlobalContactModeConfirmation({
    publicDataProvider,
    contractAddress: cleanContractAddress,
    profileKey: cleanProfileKey,
    expectedMode: args.nextMode,
  });

  return {
    contractAddress: cleanContractAddress,
    networkId: configuration.networkId ?? MIDNIGHT_NETWORK_ID,
    profileKey: cleanProfileKey,
    ownerCommitment: deriveOwnerCommitment(),
    nextMode: args.nextMode,
  };
}

export async function updateGlobalContactMode(args: {
  contractAddress: string;
  profileKey: string;
  nextMode: ContactModeGlobalValue;
}): Promise<{
  contractAddress: string;
  networkId: string;
  profileKey: string;
  ownerCommitment: string;
  nextMode: ContactModeGlobalValue;
}> {
  const cleanContractAddress = requireConfiguredGlobalContractAddress(
    args.contractAddress,
  );
  const cleanProfileKey = normalizeHex32(args.profileKey, "profileKey");

  const { configuration, providers, publicDataProvider } =
    await getConnectedGlobalContactModeProviders(cleanContractAddress);

  const contract = await (findDeployedContract as any)(providers, {
    contractAddress: cleanContractAddress,
    compiledContract: compiledGlobalContract,
    privateStateId: CONTACT_MODE_GLOBAL_PRIVATE_STATE_ID,
    initialPrivateState: {},
  });

  await contract.callTx.setContactMode(
    hexToUint8Array(cleanProfileKey),
    toContractModeValue(args.nextMode),
  );

  await waitForGlobalContactModeConfirmation({
    publicDataProvider,
    contractAddress: cleanContractAddress,
    profileKey: cleanProfileKey,
    expectedMode: args.nextMode,
  });

  return {
    contractAddress: cleanContractAddress,
    networkId: configuration.networkId ?? MIDNIGHT_NETWORK_ID,
    profileKey: cleanProfileKey,
    ownerCommitment: deriveOwnerCommitment(),
    nextMode: args.nextMode,
  };
}

export async function readGlobalContactMode(args: {
  contractAddress: string;
  profileKey: string;
}): Promise<GlobalContactModeReadResult> {
  const cleanContractAddress = requireConfiguredGlobalContractAddress(
    args.contractAddress,
  );
  const cleanProfileKey = normalizeHex32(args.profileKey, "profileKey");

  const { networkId, publicDataProvider } = await getReadOnlyPublicDataProvider();
  const result = await readGlobalContactModeFromPublicDataProvider({
    publicDataProvider,
    contractAddress: cleanContractAddress,
    profileKey: cleanProfileKey,
  });

  return {
    ...result,
    networkId,
  };
}

export async function verifyGlobalContactModeSync(args: {
  contractAddress: string;
  profileKey: string;
  expectedMode: ContactModeGlobalValue;
}): Promise<GlobalContactModeReadResult & { matches: boolean }> {
  const result = await readGlobalContactMode({
    contractAddress: args.contractAddress,
    profileKey: args.profileKey,
  });

  return {
    ...result,
    matches: result.registered && result.contactMode === args.expectedMode,
  };
}
