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
import { buildNightforceApiUrl } from "../lib/nightforceApi";

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
      const response = await fetch(buildNightforceApiUrl("/api/nightforce/wallet-bindings"), {
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
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-zinc-700/10 blur-3xl" />
        <div className="absolute left-[15%] top-[28%] h-80 w-80 rounded-full bg-emerald-950/10 blur-3xl" />
        <div className="absolute right-[10%] top-[36%] h-96 w-96 rounded-full bg-zinc-800/10 blur-3xl" />
    </div>

    <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col px-4 pb-16 pt-28 sm:pt-32">
        <div className="mb-7 text-center">
          <h1 className="mb-3 text-3xl font-mono font-bold tracking-wider text-white">
            nightforce.cc
          </h1>
          <p className="text-sm font-mono leading-6 text-zinc-500/90">
            Unofficial directory for existing Nightforce ambassadors
          </p>
        </div>

        {walletError && (
          <div className="mb-4 rounded-2xl border border-red-900/60 bg-red-950/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
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
                      <div className="mb-2 text-xs font-mono font-semibold text-emerald-300">
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
          <div className="mb-8 space-y-3 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(9,9,11,0.96))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="relative">
              <button
                onClick={() => {
                  setShowMockPicker((prev) => !prev);
                }}
                disabled={isWalletLoading}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-mono font-semibold text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-emerald-300/30 hover:bg-emerald-400/10 hover:text-emerald-100 hover:shadow-[0_0_18px_rgba(52,211,153,0.16),inset_0_1px_0_rgba(255,255,255,0.04)] disabled:opacity-50"
              >
                {isWalletLoading ? "Working..." : "Connect Mock Wallet"}
              </button>

              {showMockPicker && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
                  <div className="border-b border-white/10 px-3 py-2">
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
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-mono text-zinc-300 transition-colors hover:bg-emerald-400/10 hover:text-emerald-100"
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
                className="w-full rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-mono font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-emerald-300/40 hover:bg-emerald-400/15 hover:text-white hover:shadow-[0_0_22px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] disabled:opacity-50"
              >
                {isWalletLoading
                  ? "Working..."
                  : availableMidnightWallets.length === 0
                    ? "No Midnight Wallet Detected"
                    : "Connect Midnight Wallet (Preprod)"}
              </button>
            )}

            <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
              <div className="mb-1 text-xs font-mono font-semibold text-emerald-300">
                {MIDNIGHT_CONNECT_ENABLED
                  ? midnightModeLabel
                  : "Midnight local browser wallet write is not available yet"}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                {midnightModeHelpText}
              </div>
            </div>

            <p className="mt-3 px-1 text-[11px] font-mono leading-5 text-zinc-600">
              {isPreprodWriteMode
                ? "Mock wallet stays available for the existing proof-of-life UI flow. Preprod mode is the next path for real app-side write."
                : "Mock wallet keeps the existing proof-of-life UI flow. Local Midnight contract state is shown below through the API bridge while app-side write remains blocked."}
            </p>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <div className="text-xs font-mono text-emerald-300 mb-2">
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
            className="block rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-mono font-semibold text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-emerald-300/30 hover:bg-emerald-400/10 hover:text-emerald-100 hover:shadow-[0_0_18px_rgba(52,211,153,0.14),inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            Browse Directory
          </Link>

          <Link
            href="/request-verification"
            className="block rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-mono font-semibold text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-emerald-300/30 hover:bg-emerald-400/10 hover:text-emerald-100 hover:shadow-[0_0_18px_rgba(52,211,153,0.14),inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            Request Verification
          </Link>

          {verificationStatus === "approved" && connectionMode === "midnight" && (
            <Link
              href="/my-profile"
              className="block rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-center text-sm font-mono font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-emerald-300/40 hover:bg-emerald-400/15 hover:text-white hover:shadow-[0_0_18px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]"
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