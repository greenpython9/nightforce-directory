import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getWalletAdapter,
  ADMIN_WALLET_ID,
  NIGHTFORCE_APP_MODE,
  getAvailableMidnightWallets,
  connectMidnightWallet,
  getMidnightWalletSnapshot,
  disconnectMidnightWallet,
  type MidnightWalletProviderSummary,
  type MidnightWalletSnapshot,
} from "../services/walletService";
import { writeProfileProofPublicMy } from "../services/profileProofWrite";
import {
  deployContactModePublic,
  readContactModePublic,
  updateContactModePublic,
  type ContactModeWriteValue,
} from "../services/contactModeWrite";
import type { VerificationStatus } from "../types";

const API_BASE_URL = "http://127.0.0.1:8787";

type ConnectionMode = "mock" | "midnight" | null;

interface WalletContextType {
  walletId: string | null;
  isConnected: boolean;
  isAdmin: boolean;
  verificationStatus: VerificationStatus;
  connectionMode: ConnectionMode;
  midnightProviderId: string | null;
  midnightSnapshot: MidnightWalletSnapshot | null;
  availableMidnightWallets: MidnightWalletProviderSummary[];
  walletError: string | null;
  isWalletLoading: boolean;
  connect: (walletId: string) => Promise<void>;
  connectMidnight: (providerId: string) => Promise<void>;
  writeProfileProof: () => Promise<{
    contractAddress: string;
    networkId: string;
  }>;
  deployContactMode: (initialMode: ContactModeWriteValue) => Promise<{
    contractAddress: string;
    networkId: string;
    initialMode: ContactModeWriteValue;
  }>;
  updateContactMode: (
    contractAddress: string,
    nextMode: ContactModeWriteValue,
  ) => Promise<{
    contractAddress: string;
    networkId: string;
    nextMode: ContactModeWriteValue;
  }>;
  readContactMode: (contractAddress: string) => Promise<{
    contractAddress: string;
    networkId: string;
    contactMode: ContactModeWriteValue;
    rawValue: number | string;
  }>;
  disconnect: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

type WalletBindingResponse = {
  binding: {
    id: string;
    verificationRequestId: string;
    midnightWalletAddress: string;
    boundAt: string;
    isActive: "true" | "false";
    updatedAt: string;
  };
};

function resolveMidnightWalletAddress(
  snapshot: MidnightWalletSnapshot | null,
): string | null {
  if (!snapshot) return null;

  return (
    snapshot.unshieldedAddress ??
    snapshot.dustAddress ??
    snapshot.shieldedAddress ??
    null
  );
}

async function fetchBackendVerificationStatus(
  walletAddress: string | null,
): Promise<VerificationStatus> {
  if (!walletAddress) {
    return "not_verified";
  }

  const response = await fetch(
    `${API_BASE_URL}/api/nightforce/wallet-bindings/by-wallet/${encodeURIComponent(walletAddress)}`,
  );

  if (response.status === 404) {
    return "not_verified";
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Failed to load wallet binding status.";

    throw new Error(message);
  }

  const data = payload as WalletBindingResponse;

  if (data.binding.isActive === "true") {
    return "approved";
  }

  return "not_verified";
}

function computeMockStatus(walletId: string | null): VerificationStatus {
  if (!walletId) return "not_verified";
  if (walletId === ADMIN_WALLET_ID) return "approved";
  return "not_verified";
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const adapter = getWalletAdapter();

  const [walletId, setWalletId] = useState<string | null>(adapter.getConnectedWallet());
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("not_verified");
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(
    adapter.getConnectedWallet() ? "mock" : null,
  );
  const [midnightProviderId, setMidnightProviderId] = useState<string | null>(null);
  const [midnightSnapshot, setMidnightSnapshot] = useState<MidnightWalletSnapshot | null>(null);
  const [availableMidnightWallets, setAvailableMidnightWallets] = useState<
    MidnightWalletProviderSummary[]
  >([]);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isWalletLoading, setIsWalletLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    setAvailableMidnightWallets(getAvailableMidnightWallets());

    if (connectionMode === "midnight") {
      try {
        const snapshot = await getMidnightWalletSnapshot();
        const resolvedWalletId = resolveMidnightWalletAddress(snapshot);
        const backendStatus = await fetchBackendVerificationStatus(resolvedWalletId);

        setMidnightSnapshot(snapshot);
        setWalletId(resolvedWalletId);
        setVerificationStatus(backendStatus);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to refresh Midnight wallet status.";

        setWalletError(message);
        setMidnightSnapshot(null);
        setWalletId(null);
        setVerificationStatus("not_verified");
      }

      return;
    }

    const id = adapter.getConnectedWallet();
    setWalletId(id);
    setVerificationStatus(computeMockStatus(id));

    if (!id) {
      setConnectionMode(null);
    }
  }, [adapter, connectionMode]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const connect = useCallback(
    async (id: string) => {
      setIsWalletLoading(true);
      setWalletError(null);

      try {
        await disconnectMidnightWallet();
        await adapter.connect(id);

        setConnectionMode("mock");
        setWalletId(id);
        setVerificationStatus(computeMockStatus(id));
        setMidnightProviderId(null);
        setMidnightSnapshot(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to connect mock wallet.";
        setWalletError(message);
        throw error;
      } finally {
        setIsWalletLoading(false);
      }
    },
    [adapter],
  );

  const connectMidnight = useCallback(
    async (providerId: string) => {
      setIsWalletLoading(true);
      setWalletError(null);

      try {
        await adapter.disconnect();

        const snapshot = await connectMidnightWallet(providerId);
        const resolvedWalletId = resolveMidnightWalletAddress(snapshot);
        const backendStatus = await fetchBackendVerificationStatus(resolvedWalletId);

        setConnectionMode("midnight");
        setWalletId(resolvedWalletId);
        setVerificationStatus(backendStatus);
        setMidnightProviderId(providerId);
        setMidnightSnapshot(snapshot);
      } catch (error) {
        const rawMessage =
          error instanceof Error ? error.message : "Failed to connect Midnight wallet.";

        const message =
          NIGHTFORCE_APP_MODE === "local-readonly" &&
          rawMessage.includes("Unknown network: undeployed")
            ? "Injected Midnight browser wallets do not currently support the local undeployed network in this app flow. The read-only Profile Proof State panel below is still live."
            : rawMessage;

        setWalletError(message);
        throw error;
      } finally {
        setIsWalletLoading(false);
      }
    },
    [adapter],
  );

  const writeProfileProof = useCallback(async () => {
    setIsWalletLoading(true);
    setWalletError(null);

    try {
      const result = await writeProfileProofPublicMy();
      const snapshot = await getMidnightWalletSnapshot();
      const resolvedWalletId = resolveMidnightWalletAddress(snapshot);
      const backendStatus = await fetchBackendVerificationStatus(resolvedWalletId);

      setConnectionMode("midnight");
      setWalletId(resolvedWalletId);
      setVerificationStatus(backendStatus);
      setMidnightSnapshot(snapshot);

      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit profile-proof write transaction.";

      setWalletError(message);
      throw error;
    } finally {
      setIsWalletLoading(false);
    }
  }, []);

  const deployContactMode = useCallback(
    async (initialMode: ContactModeWriteValue) => {
      setIsWalletLoading(true);
      setWalletError(null);

      try {
        const result = await deployContactModePublic(initialMode);
        const snapshot = await getMidnightWalletSnapshot();
        const resolvedWalletId = resolveMidnightWalletAddress(snapshot);
        const backendStatus = await fetchBackendVerificationStatus(resolvedWalletId);

        setConnectionMode("midnight");
        setWalletId(resolvedWalletId);
        setVerificationStatus(backendStatus);
        setMidnightSnapshot(snapshot);

        return result;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to deploy contact-mode contract.";

        setWalletError(message);
        throw error;
      } finally {
        setIsWalletLoading(false);
      }
    },
    [],
  );


  const updateContactMode = useCallback(
    async (contractAddress: string, nextMode: ContactModeWriteValue) => {
      setIsWalletLoading(true);
      setWalletError(null);

      try {
        const result = await updateContactModePublic(contractAddress, nextMode);
        const snapshot = await getMidnightWalletSnapshot();
        const resolvedWalletId = resolveMidnightWalletAddress(snapshot);
        const backendStatus = await fetchBackendVerificationStatus(resolvedWalletId);

        setConnectionMode("midnight");
        setWalletId(resolvedWalletId);
        setVerificationStatus(backendStatus);
        setMidnightSnapshot(snapshot);

        return result;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update contact-mode contract.";

        setWalletError(message);
        throw error;
      } finally {
        setIsWalletLoading(false);
      }
    },
    [],
  );


  const readContactMode = useCallback(async (contractAddress: string) => {
    setIsWalletLoading(true);
    setWalletError(null);

    try {
      const result = await readContactModePublic(contractAddress);
      const snapshot = await getMidnightWalletSnapshot();
      const resolvedWalletId = resolveMidnightWalletAddress(snapshot);
      const backendStatus = await fetchBackendVerificationStatus(resolvedWalletId);

      setConnectionMode("midnight");
      setWalletId(resolvedWalletId);
      setVerificationStatus(backendStatus);
      setMidnightSnapshot(snapshot);

      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to read contact-mode contract.";

      setWalletError(message);
      throw error;
    } finally {
      setIsWalletLoading(false);
    }
  }, []);


  const disconnect = useCallback(async () => {
    setIsWalletLoading(true);
    setWalletError(null);

    try {
      await adapter.disconnect();
      await disconnectMidnightWallet();

      setConnectionMode(null);
      setWalletId(null);
      setVerificationStatus("not_verified");
      setMidnightProviderId(null);
      setMidnightSnapshot(null);
      setAvailableMidnightWallets(getAvailableMidnightWallets());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to disconnect wallet.";
      setWalletError(message);
      throw error;
    } finally {
      setIsWalletLoading(false);
    }
  }, [adapter]);

  const isAdmin = connectionMode === "mock" && walletId === ADMIN_WALLET_ID;
  const isConnected =
    (connectionMode === "mock" && walletId !== null) ||
    (connectionMode === "midnight" && midnightSnapshot !== null);

  return (
    <WalletContext.Provider
      value={{
        walletId,
        isConnected,
        isAdmin,
        verificationStatus,
        connectionMode,
        midnightProviderId,
        midnightSnapshot,
        availableMidnightWallets,
        walletError,
        isWalletLoading,
        connect,
        connectMidnight,
        writeProfileProof,
        deployContactMode,
        updateContactMode,
        readContactMode,
        disconnect,
        refreshStatus,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}