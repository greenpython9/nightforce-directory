import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getWalletAdapter,
  ADMIN_WALLET_ID,
  getAvailableMidnightWallets,
  connectMidnightWallet,
  getMidnightWalletSnapshot,
  disconnectMidnightWallet,
  type MidnightWalletProviderSummary,
  type MidnightWalletSnapshot,
} from "../services/walletService";
import { loadStore } from "../lib/storage";
import type { VerificationStatus } from "../types";

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
  disconnect: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

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

  const computeStatus = useCallback((wId: string | null): VerificationStatus => {
    if (!wId) return "not_verified";

    const store = loadStore();

    if (store.approvedWallets.includes(wId)) return "approved";

    const req = store.verificationRequests.find((r) => r.walletId === wId);
    if (!req) return "not_verified";
    if (req.status === "pending") return "pending";
    if (req.status === "rejected") return "not_verified";

    return "not_verified";
  }, []);

  const refreshStatus = useCallback(async () => {
    setAvailableMidnightWallets(getAvailableMidnightWallets());

    if (connectionMode === "midnight") {
      const snapshot = await getMidnightWalletSnapshot();
      setMidnightSnapshot(snapshot);
      setWalletId(null);
      setVerificationStatus("not_verified");
      return;
    }

    const id = adapter.getConnectedWallet();
    setWalletId(id);
    setVerificationStatus(computeStatus(id));

    if (!id) {
      setConnectionMode(null);
    }
  }, [adapter, computeStatus, connectionMode]);

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
        setVerificationStatus(computeStatus(id));
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
    [adapter, computeStatus],
  );

  const connectMidnight = useCallback(
    async (providerId: string) => {
      setIsWalletLoading(true);
      setWalletError(null);

      try {
        await adapter.disconnect();

        const snapshot = await connectMidnightWallet(providerId);

        setConnectionMode("midnight");
        setWalletId(null);
        setVerificationStatus("not_verified");
        setMidnightProviderId(providerId);
        setMidnightSnapshot(snapshot);
      } catch (error) {
        const rawMessage =
          error instanceof Error ? error.message : "Failed to connect Midnight wallet.";

        const message = rawMessage.includes("Unknown network: undeployed")
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