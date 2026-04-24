import { CompiledContract } from "@midnight-ntwrk/compact-js";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import * as ledger from "@midnight-ntwrk/ledger-v8";

import * as ContactModeContract from "../../midnight-contact-mode/contracts/managed/contact-mode/contract/index.js";

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

export type ContactModeWriteValue =
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED";

const CONTACT_MODE_ZK_BASE_URL = new URL(
  "../../midnight-contact-mode/contracts/managed/contact-mode/",
  import.meta.url,
).href;

const CONTACT_MODE_PRIVATE_STATE_ID = "contactModeStateBrowser";

const compiledContract = CompiledContract.make(
  "contact-mode",
  (ContactModeContract as any).Contract,
).pipe(CompiledContract.withVacantWitnesses) as any;

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

function toContractModeValue(initialMode: ContactModeWriteValue): number {
  const ContactMode = (ContactModeContract as any).ContactMode;

  switch (initialMode) {
    case "PRIVATE_CONTACT_AVAILABLE":
      return ContactMode.PRIVATE_CONTACT_AVAILABLE;
    case "PUBLIC_CONTACT_ALLOWED":
      return ContactMode.PUBLIC_CONTACT_ALLOWED;
    case "NO_CONTACT":
    default:
      return ContactMode.NO_CONTACT;
  }
}

function fromContractModeValue(value: unknown): ContactModeWriteValue {
  const ContactMode = (ContactModeContract as any).ContactMode;

  if (value === ContactMode.PUBLIC_CONTACT_ALLOWED || value === 2) {
    return "PUBLIC_CONTACT_ALLOWED";
  }

  if (value === ContactMode.PRIVATE_CONTACT_AVAILABLE || value === 1) {
    return "PRIVATE_CONTACT_AVAILABLE";
  }

  return "NO_CONTACT";
}

export async function deployContactModePublic(
  initialMode: ContactModeWriteValue,
): Promise<{
  contractAddress: string;
  networkId: string;
  initialMode: ContactModeWriteValue;
}> {
  if (MIDNIGHT_NETWORK_ID !== "preprod") {
    throw new Error(
      `Contact-mode deploy is only enabled in preprod-write mode. Current network: ${MIDNIGHT_NETWORK_ID}`,
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
    CONTACT_MODE_ZK_BASE_URL,
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

      const result = await connectedApi.balanceUnsealedTransaction?.(
        serialized,
        { payFees: true },
      );

      if (!result?.tx) {
        throw new Error("Midnight wallet failed to balance the contract transaction.");
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

      await connectedApi.submitTransaction?.(serialized);

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
    CONTACT_MODE_PRIVATE_STATE_ID,
  );

  const providers: any = {
    privateStateProvider,
    publicDataProvider: indexerPublicDataProvider(
      configuration.indexerUri,
      configuration.indexerWsUri,
    ),
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  };

  const deployed = await (deployContract as any)(providers, {
    compiledContract,
    args: [toContractModeValue(initialMode)],
  });

  const contractAddress = (deployed as any).deployTxData.public.contractAddress;

  if (typeof privateStateProvider.setContractAddress === "function") {
    privateStateProvider.setContractAddress(contractAddress);
  }

  return {
    contractAddress,
    networkId: configuration.networkId ?? MIDNIGHT_NETWORK_ID,
    initialMode,
  };
}

export async function updateContactModePublic(
  contractAddress: string,
  nextMode: ContactModeWriteValue,
): Promise<{
  contractAddress: string;
  networkId: string;
  nextMode: ContactModeWriteValue;
}> {
  if (MIDNIGHT_NETWORK_ID !== "preprod") {
    throw new Error(
      `Contact-mode update is only enabled in preprod-write mode. Current network: ${MIDNIGHT_NETWORK_ID}`,
    );
  }

  const connectedApi = getConnectedMidnightApi();

  if (!connectedApi) {
    throw new Error("Connect a Midnight wallet first.");
  }

  if (!contractAddress.trim()) {
    throw new Error("Contact-mode contract address is required.");
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
    CONTACT_MODE_ZK_BASE_URL,
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

      const result = await connectedApi.balanceUnsealedTransaction?.(
        serialized,
        { payFees: true },
      );

      if (!result?.tx) {
        throw new Error("Midnight wallet failed to balance the contract transaction.");
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

      await connectedApi.submitTransaction?.(serialized);

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
    CONTACT_MODE_PRIVATE_STATE_ID,
  );

  if (typeof privateStateProvider.setContractAddress === "function") {
    privateStateProvider.setContractAddress(contractAddress);
  }

  const providers: any = {
    privateStateProvider,
    publicDataProvider: indexerPublicDataProvider(
      configuration.indexerUri,
      configuration.indexerWsUri,
    ),
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  };

  const contract = await (findDeployedContract as any)(providers, {
    contractAddress,
    compiledContract,
    privateStateId: CONTACT_MODE_PRIVATE_STATE_ID,
    initialPrivateState: {},
  });

  await contract.callTx.setContactMode(toContractModeValue(nextMode));

  return {
    contractAddress,
    networkId: configuration.networkId ?? MIDNIGHT_NETWORK_ID,
    nextMode,
  };
}

export async function readContactModePublic(contractAddress: string): Promise<{
  contractAddress: string;
  networkId: string;
  contactMode: ContactModeWriteValue;
  rawValue: number | string;
}> {
  if (MIDNIGHT_NETWORK_ID !== "preprod") {
    throw new Error(
      `Contact-mode read is only enabled in preprod-write mode. Current network: ${MIDNIGHT_NETWORK_ID}`,
    );
  }

  const connectedApi = getConnectedMidnightApi();

  if (!connectedApi) {
    throw new Error("Connect a Midnight wallet first.");
  }

  const cleanContractAddress = contractAddress.trim();

  if (!cleanContractAddress) {
    throw new Error("Contact-mode contract address is required.");
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

  const publicDataProvider = indexerPublicDataProvider(
    configuration.indexerUri,
    configuration.indexerWsUri,
  );

  const state = await publicDataProvider.queryContractState(cleanContractAddress);

  if (!state) {
    throw new Error("No Contact Mode contract state was found.");
  }

  const ledgerState = (ContactModeContract as any).ledger(state.data);
  const rawValue = ledgerState.contactMode;

  return {
    contractAddress: cleanContractAddress,
    networkId: configuration.networkId ?? MIDNIGHT_NETWORK_ID,
    contactMode: fromContractModeValue(rawValue),
    rawValue:
      typeof rawValue === "number" || typeof rawValue === "string"
        ? rawValue
        : String(rawValue),
  };
}