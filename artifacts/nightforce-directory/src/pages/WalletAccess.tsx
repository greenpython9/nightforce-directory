import { Link } from "wouter";
import { useWallet } from "../hooks/useWallet";
import { StatusBadge } from "../components/StatusBadge";
import {
  NIGHTFORCE_APP_MODE,
  MIDNIGHT_CONNECT_ENABLED,
  MIDNIGHT_NETWORK_ID,
} from "../services/walletService";
import { useEffect, useMemo, useState } from "react";
import { buildNightforceApiUrl } from "../lib/nightforceApi";

function shortenValue(value: string | null, left = 10, right = 8) {
  if (!value) return "—";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

type VerificationRequestStatus = "pending" | "approved" | "rejected";

type LinkedVerificationRequest = {
  id: string;
  status: VerificationRequestStatus;
  midnightWalletAddress?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVerificationRequestStatus(
  value: unknown,
): value is VerificationRequestStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function getLinkedVerificationRequestFromPayload(
  payload: unknown,
): LinkedVerificationRequest | null {
  if (!isRecord(payload) || !isRecord(payload.request)) {
    return null;
  }

  const request = payload.request;

  if (
    typeof request.id !== "string" ||
    !isVerificationRequestStatus(request.status)
  ) {
    return null;
  }

  return {
    id: request.id,
    status: request.status,
    midnightWalletAddress:
      typeof request.midnightWalletAddress === "string"
        ? request.midnightWalletAddress
        : null,
  };
}

function isLaceMidnightWallet(wallet: {
  providerId: string;
  providerName: string;
}): boolean {
  return (
    wallet.providerName.toLowerCase().includes("lace") ||
    wallet.providerId.toLowerCase().includes("lace")
  );
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
    connectMidnight,
    disconnect,
    refreshStatus,
  } = useWallet();

  const [requestIdToBind, setRequestIdToBind] = useState("");
  const [bindError, setBindError] = useState<string | null>(null);
  const [bindSuccess, setBindSuccess] = useState<string | null>(null);
  const [isBinding, setIsBinding] = useState(false);
  const [linkedVerificationRequest, setLinkedVerificationRequest] =
    useState<LinkedVerificationRequest | null>(null);
  const [isLinkedRequestLoading, setIsLinkedRequestLoading] = useState(false);
  const [linkedRequestError, setLinkedRequestError] = useState<string | null>(
    null,
  );
  const [copyRequestMessage, setCopyRequestMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLinkedVerificationRequest() {
      setLinkedRequestError(null);
      setCopyRequestMessage(null);

      if (connectionMode !== "midnight" || !walletId) {
        setLinkedVerificationRequest(null);
        setIsLinkedRequestLoading(false);
        return;
      }

      setIsLinkedRequestLoading(true);

      try {
        const response = await fetch(
          buildNightforceApiUrl(
            `/api/nightforce/verification-requests/by-wallet/${encodeURIComponent(walletId)}`,
          ),
        );

        let payload: unknown = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (response.status === 404) {
          if (!cancelled) {
            setLinkedVerificationRequest(null);
          }

          return;
        }

        if (!response.ok) {
          const message =
            isRecord(payload) &&
            typeof payload.error === "string" &&
            payload.error.trim()
              ? payload.error
              : "Failed to load linked verification request.";

          throw new Error(message);
        }

        const request = getLinkedVerificationRequestFromPayload(payload);

        if (!request) {
          throw new Error("Linked verification request response was invalid.");
        }

        if (!cancelled) {
          setLinkedVerificationRequest(request);

          if (request.status === "approved") {
            setRequestIdToBind((current) =>
              current.trim() ? current : request.id,
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setLinkedVerificationRequest(null);
          setLinkedRequestError(
            error instanceof Error
              ? error.message
              : "Failed to load linked verification request.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLinkedRequestLoading(false);
        }
      }
    }

    void loadLinkedVerificationRequest();

    return () => {
      cancelled = true;
    };
  }, [connectionMode, walletId]);

  const isPreprodWriteMode = NIGHTFORCE_APP_MODE === "preprod-write";
  const isMainnetWriteMode = NIGHTFORCE_APP_MODE === "mainnet-write";
  const isMidnightWriteMode = isPreprodWriteMode || isMainnetWriteMode;

  const midnightNetworkLabel =
    MIDNIGHT_NETWORK_ID === "mainnet"
      ? "Mainnet"
      : MIDNIGHT_NETWORK_ID === "preprod"
        ? "Preprod"
        : "Local";

  const midnightModeLabel = isMidnightWriteMode
    ? `Midnight Wallet (${midnightNetworkLabel})`
    : "Midnight Wallet (Local)";

  const midnightModeHelpText = !MIDNIGHT_CONNECT_ENABLED
    ? "Wallet-based profile creation, existing wallet-linked profile access, and Contact Mode writes are temporarily disabled while the federated mainnet deployment and wallet integration are being completed. The Midnames .night integration is independent and remains reviewable."
    : isMainnetWriteMode
      ? "Mainnet integration testing is enabled for development only. The end-user profile flow is not production-ready until the global mainnet contract deployment is complete."
      : isPreprodWriteMode
        ? "Preprod integration testing is enabled for development only. The current end-user profile flow remains unsupported in this transitional build."
        : "Local read-only mode is active.";

  const connectedLabel = useMemo(() => {
    if (connectionMode === "midnight" && midnightSnapshot) {
      return midnightSnapshot.providerName;
    }

    return walletId;
  }, [connectionMode, midnightSnapshot, walletId]);

  const handleCopyRequestId = async () => {
    if (!linkedVerificationRequest?.id) {
      return;
    }

    try {
      await navigator.clipboard.writeText(linkedVerificationRequest.id);
      setCopyRequestMessage("Request ID copied.");
    } catch {
      setCopyRequestMessage("Copy failed. Select and copy the ID manually.");
    }
  };

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
      const response = await fetch(
        buildNightforceApiUrl("/api/nightforce/wallet-bindings"),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            verificationRequestId: requestIdToBind.trim(),
            midnightWalletAddress: walletId,
          }),
        },
      );

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
      setBindSuccess(
        "Wallet binding created. You can now continue to My Profile.",
      );
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
              <span className="text-xs font-mono text-zinc-500">
                Connected Wallet
              </span>
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

            {connectionMode === "midnight" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-zinc-500">Mode:</span>
                  <span className="text-xs font-mono text-cyan-300">
                    Midnight Wallet
                  </span>
                  <span className="text-xs font-mono text-zinc-600">•</span>
                  <span className="text-xs font-mono text-emerald-300">
                    {(
                      midnightSnapshot?.networkId ?? MIDNIGHT_NETWORK_ID
                    ).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-zinc-500">
                    Status:
                  </span>
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

                {verificationStatus !== "approved" && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <div className="mb-2 text-xs font-mono font-semibold text-emerald-300">
                      Bind Approved Request to This Midnight Wallet
                    </div>
                    <p className="mb-3 text-[11px] font-mono leading-relaxed text-zinc-500">
                      After admin approval, your approved request ID can be
                      detected from this connected Midnight wallet and used for
                      binding.
                    </p>

                    {isLinkedRequestLoading && (
                      <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[11px] font-mono text-zinc-400">
                        Checking for a wallet-linked verification request...
                      </div>
                    )}

                    {linkedRequestError && (
                      <div className="mb-3 rounded-xl border border-red-900/60 bg-red-950/25 px-3 py-2.5 text-[11px] font-mono leading-5 text-red-300">
                        {linkedRequestError}
                      </div>
                    )}

                    {linkedVerificationRequest?.status === "pending" && (
                      <div className="mb-3 rounded-xl border border-yellow-500/20 bg-yellow-400/10 px-3 py-2.5 text-[11px] font-mono leading-5 text-yellow-200">
                        Your verification request is pending admin review. Once
                        approved, the request ID will appear here automatically.
                      </div>
                    )}

                    {linkedVerificationRequest?.status === "approved" && (
                      <div className="mb-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                        <div className="mb-1 text-[11px] font-mono font-semibold text-emerald-300">
                          Approved request found
                        </div>
                        <div className="mb-3 break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] font-mono leading-5 text-zinc-300">
                          {linkedVerificationRequest.id}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => void handleCopyRequestId()}
                            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-mono font-semibold text-zinc-300 transition-all hover:border-emerald-300/30 hover:bg-emerald-400/10 hover:text-emerald-100"
                          >
                            Copy Request ID
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRequestIdToBind(linkedVerificationRequest.id)
                            }
                            className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-[11px] font-mono font-semibold text-emerald-100 transition-all hover:border-emerald-300/40 hover:bg-emerald-400/15 hover:text-white"
                          >
                            Use This ID
                          </button>
                        </div>
                        {copyRequestMessage && (
                          <div className="mt-2 text-[11px] font-mono text-zinc-400">
                            {copyRequestMessage}
                          </div>
                        )}
                      </div>
                    )}

                    {linkedVerificationRequest?.status === "rejected" && (
                      <div className="mb-3 rounded-xl border border-red-900/60 bg-red-950/25 px-3 py-2.5 text-[11px] font-mono leading-5 text-red-300">
                        This wallet has a rejected verification request. Contact
                        the team if you believe this should be reviewed again.
                      </div>
                    )}

                    <input
                      type="text"
                      value={requestIdToBind}
                      onChange={(event) =>
                        setRequestIdToBind(event.target.value)
                      }
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
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 space-y-3 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(9,9,11,0.96))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            {MIDNIGHT_CONNECT_ENABLED && (
              <div className="space-y-2">
                {availableMidnightWallets.length > 0 ? (
                  availableMidnightWallets.map((wallet) => {
                    const laceComingSoon = isLaceMidnightWallet(wallet);

                    return (
                      <button
                        key={wallet.providerId}
                        onClick={async () => {
                          if (laceComingSoon) {
                            return;
                          }

                          await connectMidnight(wallet.providerId);
                        }}
                        disabled={isWalletLoading || laceComingSoon}
                        className={
                          laceComingSoon
                            ? "flex w-full cursor-not-allowed items-center justify-between gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/80 px-4 py-3 text-sm font-mono font-semibold text-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] opacity-80"
                            : "flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-mono font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-emerald-300/40 hover:bg-emerald-400/15 hover:text-white hover:shadow-[0_0_22px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] disabled:opacity-50"
                        }
                        title={
                          laceComingSoon
                            ? "Lace Wallet (Midnight) is temporarily disabled while wallet compatibility testing is finalized."
                            : undefined
                        }
                      >
                        <span>
                          {isWalletLoading && !laceComingSoon
                            ? "Working..."
                            : laceComingSoon
                              ? `${wallet.providerName} — Coming soon`
                              : `Connect ${wallet.providerName}`}
                        </span>
                        <span
                          className={
                            laceComingSoon
                              ? "text-[10px] font-normal text-zinc-600"
                              : "text-[10px] font-normal text-emerald-200/70"
                          }
                        >
                          {wallet.providerId}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <button
                    disabled
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-mono font-semibold text-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] disabled:opacity-60"
                  >
                    No Midnight Wallet Detected
                  </button>
                )}

                {availableMidnightWallets.some((wallet) =>
                  isLaceMidnightWallet(wallet),
                ) && (
                  <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 px-3 py-2.5 text-[11px] font-mono leading-5 text-zinc-500">
                    <span className="font-semibold text-zinc-300">
                      Lace Wallet (Midnight):
                    </span>{" "}
                    coming soon. Lace is detected, but temporarily disabled
                    while wallet compatibility testing is finalized.
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
              <div className="mb-1 text-xs font-mono font-semibold text-emerald-300">
                {MIDNIGHT_CONNECT_ENABLED
                  ? midnightModeLabel
                  : "Midnight wallet profile access is temporarily unavailable"}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                {midnightModeHelpText}
              </div>
            </div>

            <p className="mt-3 px-1 text-[11px] font-mono leading-5 text-zinc-600">
              {MIDNIGHT_CONNECT_ENABLED
                ? "Internal wallet integration testing is enabled for the selected network."
                : "This affects new profile creation and existing wallet-linked profile access. Midnames .night identity testing does not require the wallet flow."}
            </p>
          </div>
        )}

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

          {verificationStatus === "approved" &&
            connectionMode === "midnight" && (
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
                {`Midnight ${midnightNetworkLabel} connection active`}
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                {!MIDNIGHT_CONNECT_ENABLED
                  ? "Wallet-based profile access is temporarily disabled while the mainnet deployment and integration work are completed."
                  : isMainnetWriteMode
                    ? "Mainnet integration testing is active for development only. End-user Contact Mode writes remain unavailable."
                    : isPreprodWriteMode
                      ? "Preprod integration testing is active for development only. The end-user profile flow remains unsupported in this build."
                      : "Local read-only mode is active."}
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
