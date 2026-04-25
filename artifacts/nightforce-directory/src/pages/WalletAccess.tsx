import { Link } from "wouter";
import { useWallet } from "../hooks/useWallet";
import { StatusBadge } from "../components/StatusBadge";
import {
  MOCK_WALLETS,
  ADMIN_WALLET_ID,
  NIGHTFORCE_APP_MODE,
  MIDNIGHT_CONNECT_ENABLED,
  getProfileProofState,
  type ProfileProofState,
} from "../services/walletService";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8787";

function shortenValue(value: string | null, left = 10, right = 8) {
  if (!value) return "—";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export function WalletAccess() {
  const {
    walletId,
    isConnected,
    verificationStatus,
    connectionMode,
    midnightSnapshot,
    availableMidnightWallets,
    walletError,
    isWalletLoading,
    connect,
    connectMidnight,
    writeProfileProof,
    disconnect,
    refreshStatus,
  } = useWallet();

  const [showMockPicker, setShowMockPicker] = useState(false);
  const [profileProofState, setProfileProofState] =
    useState<ProfileProofState | null>(null);
  const [isProfileProofLoading, setIsProfileProofLoading] = useState(false);
  const [profileProofError, setProfileProofError] = useState<string | null>(null);
  const [profileProofWriteMessage, setProfileProofWriteMessage] =
    useState<string | null>(null);

  const [requestIdToBind, setRequestIdToBind] = useState("");
  const [bindError, setBindError] = useState<string | null>(null);
  const [bindSuccess, setBindSuccess] = useState<string | null>(null);
  const [isBinding, setIsBinding] = useState(false);

  async function reloadProfileProofState() {
    setIsProfileProofLoading(true);
    setProfileProofError(null);

    try {
      const data = await getProfileProofState();
      setProfileProofState(data);
    } catch (error) {
      setProfileProofState(null);
      setProfileProofError(
        error instanceof Error
          ? error.message
          : "Failed to load profile-proof state.",
      );
    } finally {
      setIsProfileProofLoading(false);
    }
  }

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

  const isPreprodWriteMode = NIGHTFORCE_APP_MODE === "preprod-write";

  const midnightModeLabel = isPreprodWriteMode
    ? "Midnight Wallet (Preprod)"
    : "Midnight Wallet (Local)";

  const midnightModeHelpText = isPreprodWriteMode
    ? "Preprod mode is enabled. Browser wallet connection is intended for the first real app-side write flow."
    : "Injected Midnight browser wallets currently reject the local undeployed network in this app flow. The live read-only Profile Proof State panel below is still connected to the local contract.";

  const connectedLabel = useMemo(() => {
    if (connectionMode === "midnight" && midnightSnapshot) {
      return midnightSnapshot.providerName;
    }
    return walletId;
  }, [connectionMode, midnightSnapshot, walletId]);

  const handleBindWallet = async () => {
    if (!walletId) {
      setBindError("No Midnight wallet address is available to bind.");
      return;
    }

    if (!requestIdToBind.trim()) {
      setBindError("Approved verification request ID is required.");
      return;
    }

    setIsBinding(true);
    setBindError(null);
    setBindSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/nightforce/wallet-bindings`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          verificationRequestId: requestIdToBind.trim(),
          midnightWalletAddress: walletId,
        }),
      });

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
            : "Failed to bind wallet.";

        throw new Error(message);
      }

      await refreshStatus();
      setBindSuccess("Wallet binding created. You can now continue to My Profile.");
      setRequestIdToBind("");
    } catch (error) {
      setBindError(
        error instanceof Error ? error.message : "Failed to bind wallet.",
      );
    } finally {
      setIsBinding(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-mono font-bold text-white tracking-wider mb-3">
            nightforce.cc
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

            <div className="font-mono text-white text-sm mb-3">
              {connectedLabel ?? "—"}
            </div>

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
                    {(
                      midnightSnapshot?.networkId ??
                      (isPreprodWriteMode ? "preprod" : "undeployed")
                    ).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-zinc-500">Status:</span>
                  <StatusBadge status={verificationStatus} />
                </div>

                <div className="grid gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">
                      Provider
                    </div>
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
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">
                      Dust Address
                    </div>
                    <div className="text-xs font-mono text-zinc-200 break-all">
                      {midnightSnapshot?.dustAddress ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">
                      Dust Balance
                    </div>
                    <div className="text-xs font-mono text-zinc-200">
                      {midnightSnapshot?.dustBalance
                        ? `${midnightSnapshot.dustBalance.balance} / cap ${midnightSnapshot.dustBalance.cap}`
                        : "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">
                      Indexer
                    </div>
                    <div className="text-xs font-mono text-zinc-200 break-all">
                      {midnightSnapshot?.configuration?.indexerUri || "—"}
                    </div>
                  </div>
                </div>

                {connectionMode === "midnight" &&
                  verificationStatus !== "approved" && (
                    <div className="mt-4 border-t border-zinc-800 pt-4">
                      <div className="text-xs font-mono text-cyan-300 mb-2">
                        Bind Approved Request to This Midnight Wallet
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500 leading-relaxed mb-3">
                        After admin approval, paste your approved verification request ID here to
                        bind it to the currently connected Midnight wallet.
                      </p>

                      <input
                        type="text"
                        value={requestIdToBind}
                        onChange={(e) => setRequestIdToBind(e.target.value)}
                        placeholder="Paste approved verification request ID"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 mb-3"
                      />

                      {bindError && (
                        <div className="mb-3 text-[11px] font-mono text-red-300">
                          {bindError}
                        </div>
                      )}

                      {bindSuccess && (
                        <div className="mb-3 text-[11px] font-mono text-emerald-300">
                          {bindSuccess}
                        </div>
                      )}

                      <button
                        onClick={() => void handleBindWallet()}
                        disabled={isBinding || !walletId}
                        className="w-full font-mono text-sm bg-cyan-950/40 hover:bg-cyan-950/60 text-cyan-300 border border-cyan-900 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isBinding ? "Binding Wallet..." : "Bind Wallet"}
                      </button>
                    </div>
                  )}

                {isPreprodWriteMode && verificationStatus === "approved" && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <button
                      onClick={async () => {
                        setProfileProofWriteMessage(null);

                        try {
                          const result = await writeProfileProof();
                          await reloadProfileProofState();

                          setProfileProofWriteMessage(
                            `Write submitted on ${result.networkId}. Profile Proof state panel reloaded.`,
                          );
                        } catch {
                          // walletError is already surfaced by the wallet hook
                        }
                      }}
                      disabled={isWalletLoading}
                      className="w-full font-mono text-sm bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 border border-emerald-900 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isWalletLoading
                        ? "Writing Profile Proof..."
                        : "Write Profile Proof (PUBLIC / MY)"}
                    </button>

                    {profileProofWriteMessage && (
                      <div className="mt-3 text-[11px] font-mono text-emerald-300">
                        {profileProofWriteMessage}
                      </div>
                    )}
                  </div>
                )}
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
                    <span className="text-xs font-mono text-zinc-500">
                      Select mock wallet
                    </span>
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

            {MIDNIGHT_CONNECT_ENABLED && (
              <button
                onClick={async () => {
                  const providerId = availableMidnightWallets[0]?.providerId ?? null;

                  if (!providerId) {
                    throw new Error("No Midnight wallet detected.");
                  }

                  await connectMidnight(providerId);
                }}
                disabled={isWalletLoading || availableMidnightWallets.length === 0}
                className="w-full font-mono text-sm bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-900 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isWalletLoading
                  ? "Working..."
                  : availableMidnightWallets.length === 0
                    ? "No Midnight Wallet Detected"
                    : "Connect Midnight Wallet (Preprod)"}
              </button>
            )}

            <div className="border border-cyan-950 bg-cyan-950/20 rounded-lg p-4">
              <div className="text-xs font-mono text-cyan-300 mb-1">
                {MIDNIGHT_CONNECT_ENABLED
                  ? midnightModeLabel
                  : "Midnight local browser wallet write is not available yet"}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                {midnightModeHelpText}
              </div>
            </div>

            <p className="text-[11px] font-mono text-zinc-600 px-1">
              {isPreprodWriteMode
                ? "Mock wallet stays available for the existing proof-of-life UI flow. Preprod mode is the next path for real app-side write."
                : "Mock wallet keeps the existing proof-of-life UI flow. Local Midnight contract state is shown below through the API bridge while app-side write remains blocked."}
            </p>
          </div>
        )}

        <div className="border border-cyan-950 bg-cyan-950/20 rounded-lg px-4 py-3 mb-6">
          <div className="text-xs font-mono text-cyan-300 mb-2">
            {isPreprodWriteMode
              ? "Profile Proof State (Current Source)"
              : "Profile Proof State"}
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
                <div className="text-[11px] font-mono text-zinc-500 mb-1">
                  Network
                </div>
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

          {verificationStatus === "approved" && connectionMode === "midnight" && (
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
                {isPreprodWriteMode
                  ? "Midnight Preprod connection active"
                  : "Midnight local connection active"}
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                {isPreprodWriteMode
                  ? "Preprod mode active: browser wallet connection is enabled for future app-side write."
                  : "Local read-only mode active: browser wallet write is currently unavailable."}
              </div>
              <div className="text-[11px] font-mono text-zinc-500 mt-2">
                Active address:{" "}
                {shortenValue(
                  midnightSnapshot.shieldedAddress ??
                    midnightSnapshot.unshieldedAddress,
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}