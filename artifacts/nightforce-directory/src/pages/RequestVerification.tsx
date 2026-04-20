import { useState } from "react";
import { Link } from "wouter";
import { useWallet } from "../hooks/useWallet";
import { updateStore } from "../lib/storage";
import type { VerificationRequest } from "../types";

function generateId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function RequestVerification() {
  const { walletId, isConnected, verificationStatus, refreshStatus } = useWallet();
  const [discordHandle, setDiscordHandle] = useState("");
  const [region, setRegion] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) return;
    if (!discordHandle.trim() || !region.trim()) {
      setError("Discord handle and region are required.");
      return;
    }

    const req: VerificationRequest = {
      id: generateId(),
      walletId,
      discordHandle: discordHandle.trim(),
      region: region.trim(),
      note: note.trim(),
      status: "pending",
      adminNotes: "",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };

    updateStore((store) => ({
      ...store,
      verificationRequests: [...store.verificationRequests, req],
    }));

    refreshStatus();
    setSubmitted(true);
    setError("");
  };

  if (verificationStatus === "approved") {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-emerald-800 rounded-lg p-6 bg-zinc-900">
          <div className="text-emerald-400 font-mono font-semibold text-sm mb-2">
            ✓ Already Approved
          </div>
          <p className="text-zinc-400 font-mono text-sm mb-4">
            Your verification has been approved. You can access your profile.
          </p>
          <Link
            href="/my-profile"
            className="inline-block font-mono text-sm text-emerald-400 border border-emerald-800 px-4 py-2 rounded-lg hover:border-emerald-600 transition-colors"
          >
            Go to My Profile →
          </Link>
        </div>
      </div>
    );
  }

  if (verificationStatus === "pending" || (submitted && !isConnected === false)) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-yellow-800 rounded-lg p-6 bg-zinc-900">
          <div className="text-yellow-400 font-mono font-semibold text-sm mb-2">
            ⏳ Pending Review
          </div>
          <p className="text-zinc-400 font-mono text-sm">
            Your verification request has been submitted and is under review by an admin. Check
            back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-xl font-mono font-bold text-white mb-2">Request Verification</h1>

      <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900 mb-6 text-xs font-mono text-zinc-400 leading-relaxed">
        <p className="font-semibold text-zinc-300 mb-1">Important</p>
        <p>This is not an application to become a Nightforce ambassador.</p>
        <p>This is for existing ambassadors who want access to the directory.</p>
      </div>

      {!isConnected && (
        <div className="border border-yellow-800 rounded-lg p-4 bg-zinc-900 mb-6 text-xs font-mono text-yellow-400">
          You must connect a wallet before submitting a verification request.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1.5">
            Discord Handle <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={discordHandle}
            onChange={(e) => setDiscordHandle(e.target.value)}
            placeholder="username#0000"
            disabled={!isConnected}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1.5">
            Region / Country <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. Malaysia, Southeast Asia"
            disabled={!isConnected}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1.5">
            Optional Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any additional context for the reviewer..."
            disabled={!isConnected}
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 resize-none"
          />
        </div>

        {error && (
          <div className="text-xs font-mono text-red-400">{error}</div>
        )}

        <button
          type="submit"
          disabled={!isConnected}
          className="font-mono text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}
