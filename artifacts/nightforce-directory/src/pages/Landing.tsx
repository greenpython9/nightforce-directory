import { Link } from "wouter";
import { useWallet } from "../hooks/useWallet";
import { StatusBadge } from "../components/StatusBadge";
import {
  MOCK_WALLETS,
  ADMIN_WALLET_ID,
  getProfileProofState,
  type ProfileProofState,
} from "../services/walletService";
import { useEffect, useMemo, useState } from "react";

function shortenValue(value: string | null, left = 10, right = 8) {
  if (!value) return "—";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export function Landing() {
  const {
    walletId,
    isConnected,
    verificationStatus,
    connectionMode,
    midnightSnapshot,
    walletError,
    isWalletLoading,
    connect,
    disconnect,
  } = useWallet();

  const [showMockPicker, setShowMockPicker] = useState(false);
  const [profileProofState, setProfileProofState] = useState<ProfileProofState | null>(null);
  const [isProfileProofLoading, setIsProfileProofLoading] = useState(false);
  const [profileProofError, setProfileProofError] = useState<string | null>(null);

  useEffect(() => {
  let cancelled = false;

  async function loadProfileProofState() {
    setIsProfileProofLoading(true);
    setProfileProofError(null);

      try {
      const data = await getProfileProofState();

      if (!cancelled) {
      setProfileProofState(data);
    }
  } catch (error) {
    if (!cancelled) {
      setProfileProofState(null);
      setProfileProofError(
        error instanceof Error
          ? error.message
          : "Failed to load profile-proof state.",
      );
    }
  } finally {
    if (!cancelled) {
      setIsProfileProofLoading(false);
    }
  }
}

  void loadProfileProofState();

  return () => {
    cancelled = true;
  };
}, []);

const connectedLabel = useMemo(() => {
  if (connectionMode === "midnight" && midnightSnapshot) {
    return midnightSnapshot.providerName;
  }
  return walletId;
}, [connectionMode, midnightSnapshot, walletId]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-mono font-bold text-white tracking-wider mb-3">
            NIGHTFORCE DIRECTORY
          </h1>
          <p className="text-sm font-mono text-zinc-400">
            Unofficial directory for existing Nightforce ambassadors
          </p>
        </div>

        {walletError && (
          <div className="border border-red-900 bg-red-950/40 rounded-lg p-4 mb-4">
            <div className="text-xs font-mono text-red-300">{walletError}</div>
          </div>
        )}

        {isConnected ? (
          <div className="border border-zinc-800 rounded-lg p-5 bg-zinc-900 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-500">Connected Wallet</span>
              <button
                onClick={() => void disconnect()}
                disabled={isWalletLoading}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
              >
                {isWalletLoading ? "Working..." : "Disconnect"}
              </button>
            </div>

            <div className="font-mono text-white text-sm mb-3">{connectedLabel ?? "—"}</div>

            {connectionMode === "mock" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500">Status:</span>
                <StatusBadge status={verificationStatus} />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-zinc-500">Mode:</span>
                  <span className="text-xs font-mono text-cyan-300">Midnight Wallet</span>
                  <span className="text-xs font-mono text-zinc-600">•</span>
                  <span className="text-xs font-mono text-emerald-300">
                    {(midnightSnapshot?.networkId ?? "undeployed").toUpperCase()}
                  </span>
                </div>

                <div className="grid gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">Provider</div>
                    <div className="text-xs font-mono text-zinc-200">
                      {midnightSnapshot?.providerName ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">
                      Shielded Address
                    </div>
                    <div className="text-xs font-mono text-zinc-200 break-all">
                      {midnightSnapshot?.shieldedAddress ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">
                      Unshielded Address
                    </div>
                    <div className="text-xs font-mono text-zinc-200 break-all">
                      {midnightSnapshot?.unshieldedAddress ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">Dust Address</div>
                    <div className="text-xs font-mono text-zinc-200 break-all">
                      {midnightSnapshot?.dustAddress ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">Dust Balance</div>
                    <div className="text-xs font-mono text-zinc-200">
                      {midnightSnapshot?.dustBalance
                        ? `${midnightSnapshot.dustBalance.balance} / cap ${midnightSnapshot.dustBalance.cap}`
                        : "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">Indexer</div>
                    <div className="text-xs font-mono text-zinc-200 break-all">
                      {midnightSnapshot?.configuration?.indexerUri || "—"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 space-y-3">
            <div className="relative">
              <button
                onClick={() => {
                  setShowMockPicker((prev) => !prev);
                }}
                disabled={isWalletLoading}
                className="w-full font-mono text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isWalletLoading ? "Working..." : "Connect Mock Wallet"}
              </button>

              {showMockPicker && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <span className="text-xs font-mono text-zinc-500">Select mock wallet</span>
                  </div>
                  {MOCK_WALLETS.map((wId) => (
                    <button
                      key={wId}
                      onClick={async () => {
                        await connect(wId);
                        setShowMockPicker(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>{wId}</span>
                      {wId === ADMIN_WALLET_ID && (
                        <span className="text-xs text-zinc-500">[admin]</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-cyan-950 bg-cyan-950/20 rounded-lg p-4">
              <div className="text-xs font-mono text-cyan-300 mb-1">
                Midnight local browser wallet write is not available yet
              </div>
              <div className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                Injected Midnight browser wallets currently reject the local
                <span className="text-zinc-300"> undeployed </span>
                network in this app flow. The live read-only Profile Proof State panel below
                is still connected to the local contract.
              </div>
            </div>

            <p className="text-[11px] font-mono text-zinc-600 px-1">
              Mock wallet keeps the existing proof-of-life UI flow. Local Midnight contract
              state is shown below through the API bridge while app-side write remains blocked.
            </p>
          </div>
        )}

<div className="border border-cyan-950 bg-cyan-950/20 rounded-lg px-4 py-3 mb-6">
  <div className="text-xs font-mono text-cyan-300 mb-2">
    Profile Proof State
  </div>

  {isProfileProofLoading ? (
    <div className="text-[11px] font-mono text-zinc-400">
      Loading contract state...
    </div>
  ) : profileProofError ? (
    <div className="text-[11px] font-mono text-red-300">
      {profileProofError}
    </div>
  ) : profileProofState ? (
    <div className="grid gap-2">
      <div>
        <div className="text-[11px] font-mono text-zinc-500 mb-1">
          Contract Address
        </div>
        <div className="text-xs font-mono text-zinc-200 break-all">
          {profileProofState.contractAddress}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-mono text-zinc-500 mb-1">Network</div>
        <div className="text-xs font-mono text-zinc-200">
          {profileProofState.network}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-mono text-zinc-500 mb-1">
          Visibility
        </div>
        <div className="text-xs font-mono text-zinc-200">
          {profileProofState.visibility.name} ({profileProofState.visibility.value})
        </div>
      </div>

      <div>
        <div className="text-[11px] font-mono text-zinc-500 mb-1">
          Country Code
        </div>
        <div className="text-xs font-mono text-zinc-200">
          {profileProofState.countryCode.name} ({profileProofState.countryCode.value})
        </div>
      </div>
    </div>
  ) : (
    <div className="text-[11px] font-mono text-zinc-500">
      No profile-proof state loaded.
    </div>
  )}
</div>

        <div className="flex flex-col gap-3">
          <Link
            href="/directory"
            className="block text-center font-mono text-sm text-zinc-300 border border-zinc-700 px-4 py-3 rounded-lg hover:border-zinc-500 hover:text-white transition-colors"
          >
            Browse Directory
          </Link>

          <Link
            href="/request-verification"
            className="block text-center font-mono text-sm text-zinc-300 border border-zinc-700 px-4 py-3 rounded-lg hover:border-zinc-500 hover:text-white transition-colors"
          >
            Request Verification
          </Link>

          {verificationStatus === "approved" && connectionMode === "mock" && (
            <Link
              href="/my-profile"
              className="block text-center font-mono text-sm text-emerald-400 border border-emerald-800 px-4 py-3 rounded-lg hover:border-emerald-600 transition-colors"
            >
              My Profile
            </Link>
          )}

          {connectionMode === "midnight" && midnightSnapshot && (
            <div className="border border-cyan-950 bg-cyan-950/20 rounded-lg px-4 py-3">
              <div className="text-xs font-mono text-cyan-300 mb-1">
                Midnight local connection active
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                Batch C Step 1 active: wallet connected to local undeployed network.
              </div>
              <div className="text-[11px] font-mono text-zinc-500 mt-2">
                Active address:{" "}
                {shortenValue(
                  midnightSnapshot.shieldedAddress ?? midnightSnapshot.unshieldedAddress,
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}