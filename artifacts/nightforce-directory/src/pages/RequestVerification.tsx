import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useWallet } from "../hooks/useWallet";
import { buildNightforceApiUrl } from "../lib/nightforceApi";

type VerificationRequestStatus = "pending" | "approved" | "rejected";

type VerificationRequestRecord = {
  id: string;
  status: VerificationRequestStatus;
  discordHandle?: string | null;
  region?: string | null;
  note?: string | null;
  midnightWalletAddress?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  adminNotes?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVerificationRequestStatus(
  value: unknown,
): value is VerificationRequestStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function getVerificationRequestFromPayload(
  payload: unknown,
): VerificationRequestRecord | null {
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
    discordHandle:
      typeof request.discordHandle === "string"
        ? request.discordHandle
        : null,
    region: typeof request.region === "string" ? request.region : null,
    note: typeof request.note === "string" ? request.note : null,
    midnightWalletAddress:
      typeof request.midnightWalletAddress === "string"
        ? request.midnightWalletAddress
        : null,
    createdAt:
      typeof request.createdAt === "string" ? request.createdAt : null,
    updatedAt:
      typeof request.updatedAt === "string" ? request.updatedAt : null,
    reviewedAt:
      typeof request.reviewedAt === "string" ? request.reviewedAt : null,
    reviewNote:
      typeof request.reviewNote === "string" ? request.reviewNote : null,
    adminNotes:
      typeof request.adminNotes === "string" ? request.adminNotes : null,
  };
}

function getErrorMessageFromPayload(
  payload: unknown,
  fallback: string,
): string {
  if (
    isRecord(payload) &&
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error;
  }

  return fallback;
}

export function RequestVerification() {
  const { walletId, isConnected } = useWallet();

  const [discordHandle, setDiscordHandle] = useState("");
  const [region, setRegion] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingRequest, setExistingRequest] =
    useState<VerificationRequestRecord | null>(null);
  const [loadingExistingRequest, setLoadingExistingRequest] = useState(false);
  const [lookupError, setLookupError] = useState("");


  useEffect(() => {
    let cancelled = false;

    async function loadExistingRequest() {
      setSubmitted(false);
      setError("");
      setLookupError("");

      if (!isConnected || !walletId) {
        setExistingRequest(null);
        setLoadingExistingRequest(false);
        return;
      }

      setLoadingExistingRequest(true);

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
            setExistingRequest(null);
          }

          return;
        }

        if (!response.ok) {
          throw new Error(
            getErrorMessageFromPayload(
              payload,
              "Failed to load verification request status.",
            ),
          );
        }

        const request = getVerificationRequestFromPayload(payload);

        if (!request) {
          throw new Error("Verification request status response was invalid.");
        }

        if (!cancelled) {
          setExistingRequest(request);
        }
      } catch (err) {
        if (!cancelled) {
          setExistingRequest(null);
          setLookupError(
            err instanceof Error
              ? err.message
              : "Failed to load verification request status.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingExistingRequest(false);
        }
      }
    }

    void loadExistingRequest();

    return () => {
      cancelled = true;
    };
  }, [isConnected, walletId]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isConnected || !walletId) {
      setError("Connect your Midnight wallet before submitting a verification request.");
      return;
    }

    if (!discordHandle.trim() || !region.trim()) {
      setError("Discord handle and region are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        buildNightforceApiUrl("/api/nightforce/verification-requests"),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            discordHandle: discordHandle.trim(),
            region: region.trim(),
            note: note.trim(),
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
            : "Failed to submit verification request.";

        throw new Error(message);
      }

      const request = getVerificationRequestFromPayload(payload);

      if (request) {
        setExistingRequest(request);
      }

      setSubmitted(true);
      setDiscordHandle("");
      setRegion("");
      setNote("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit verification request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected || !walletId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <div className="mb-2 text-sm font-mono font-semibold text-emerald-300">
            Connect Wallet First
          </div>
          <p className="mb-4 text-sm font-mono leading-6 text-zinc-400">
            Connect your Midnight wallet before submitting a verification request. This lets
            Nightforce Directory remember your request status when you come back later.
          </p>
          <Link
            href="/wallet"
            className="inline-flex rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-2.5 text-sm font-mono font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-emerald-300/40 hover:bg-emerald-400/15 hover:text-white hover:shadow-[0_0_18px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            Go to Wallet / Profile
          </Link>
        </div>
      </div>
    );
  }

  if (loadingExistingRequest) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <div className="mb-2 text-sm font-mono font-semibold text-zinc-300">
            Checking verification status...
          </div>
          <p className="text-sm font-mono leading-6 text-zinc-500">
            Looking for an existing request connected to your Midnight wallet.
          </p>
        </div>
      </div>
    );
  }

  if (lookupError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <div className="mb-2 text-sm font-mono font-semibold text-red-300">
            Could not check verification status
          </div>
          <p className="text-sm font-mono leading-6 text-red-200/80">
            {lookupError}
          </p>
        </div>
      </div>
    );
  }

  if (existingRequest?.status === "pending" || submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-yellow-800/70 bg-zinc-900 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <div className="mb-2 text-sm font-mono font-semibold text-yellow-400">
            ⏳ Pending Review
          </div>
          <p className="mb-3 text-sm font-mono leading-6 text-zinc-400">
            Your verification request has been submitted and is now under admin review.
          </p>
          <p className="text-xs font-mono leading-relaxed text-zinc-500">
            Wallet: {walletId}
          </p>
        </div>
      </div>
    );
  }

  if (existingRequest?.status === "approved") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-emerald-400/20 bg-zinc-900 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <div className="mb-2 text-sm font-mono font-semibold text-emerald-300">
            Approved
          </div>
          <p className="mb-4 text-sm font-mono leading-6 text-zinc-400">
            This Midnight wallet has an approved verification request.
          </p>
          <Link
            href="/wallet"
            className="inline-flex rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-2.5 text-sm font-mono font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-emerald-300/40 hover:bg-emerald-400/15 hover:text-white hover:shadow-[0_0_18px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            Continue to Wallet / Profile
          </Link>
        </div>
      </div>
    );
  }

  if (existingRequest?.status === "rejected") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <div className="mb-2 text-sm font-mono font-semibold text-red-300">
            Verification Rejected
          </div>
          <p className="text-sm font-mono leading-6 text-red-200/80">
            This wallet already has a rejected verification request. Contact the team if you
            believe this should be reviewed again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-20 pt-12 sm:pt-14">
      <div className="mb-6">
        <div className="mb-2 text-[11px] font-mono uppercase tracking-[0.24em] text-emerald-300/70">
          Directory Access
        </div>
        <h1 className="text-2xl font-mono font-bold tracking-tight text-white">
          Request Verification
        </h1>
        <p className="mt-2 max-w-xl text-sm font-mono leading-6 text-zinc-500">
          Submit your existing ambassador details and link this request to your connected Midnight wallet.
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs font-mono leading-relaxed text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
        <p className="mb-1 font-semibold text-zinc-200">Important</p>
        <p>This is not an application to become a Nightforce ambassador.</p>
        <p>This is for existing ambassadors who want access to the directory.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.045] p-4 text-xs font-mono leading-relaxed text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
        <p className="mb-1 font-semibold text-emerald-300">Wallet connected</p>
        <p>
          Your request will be linked to your currently connected Midnight wallet so this page can
          show your pending, approved, or rejected status when you return.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.82),rgba(9,9,11,0.94))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.035)]"
      >
        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500">
            Discord Handle <span className="text-emerald-300">*</span>
          </label>
          <input
            type="text"
            value={discordHandle}
            onChange={(e) => setDiscordHandle(e.target.value)}
            placeholder="username#0000"
            className="w-full rounded-xl border border-white/10 bg-black/35 px-3.5 py-3 text-sm font-mono text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-zinc-700 transition-all focus:border-emerald-300/35 focus:bg-black/45 focus:outline-none focus:ring-2 focus:ring-emerald-400/10"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500">
            Country <span className="text-emerald-300">*</span>
          </label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. Malaysia, Southeast Asia"
            className="w-full rounded-xl border border-white/10 bg-black/35 px-3.5 py-3 text-sm font-mono text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-zinc-700 transition-all focus:border-emerald-300/35 focus:bg-black/45 focus:outline-none focus:ring-2 focus:ring-emerald-400/10"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500">
            Optional Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any additional context for the reviewer..."
            rows={3}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3.5 py-3 text-sm font-mono text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-zinc-700 transition-all focus:border-emerald-300/35 focus:bg-black/45 focus:outline-none focus:ring-2 focus:ring-emerald-400/10"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/25 px-3.5 py-3 text-xs font-mono leading-5 text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-mono font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-emerald-300/40 hover:bg-emerald-400/15 hover:text-white hover:shadow-[0_0_22px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}