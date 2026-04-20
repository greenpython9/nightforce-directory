import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getWalletAdapter, ADMIN_WALLET_ID } from "../services/walletService";
import { loadStore } from "../lib/storage";
import type { VerificationStatus } from "../types";

interface WalletContextType {
  walletId: string | null;
  isConnected: boolean;
  isAdmin: boolean;
  verificationStatus: VerificationStatus;
  connect: (walletId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshStatus: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const adapter = getWalletAdapter();
  const [walletId, setWalletId] = useState<string | null>(adapter.getConnectedWallet());
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("not_verified");

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

  const refreshStatus = useCallback(() => {
    const id = adapter.getConnectedWallet();
    setWalletId(id);
    setVerificationStatus(computeStatus(id));
  }, [adapter, computeStatus]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const connect = useCallback(async (id: string) => {
    await adapter.connect(id);
    setWalletId(id);
    setVerificationStatus(computeStatus(id));
  }, [adapter, computeStatus]);

  const disconnect = useCallback(async () => {
    await adapter.disconnect();
    setWalletId(null);
    setVerificationStatus("not_verified");
  }, [adapter]);

  const isAdmin = walletId === ADMIN_WALLET_ID;

  return (
    <WalletContext.Provider
      value={{
        walletId,
        isConnected: walletId !== null,
        isAdmin,
        verificationStatus,
        connect,
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
