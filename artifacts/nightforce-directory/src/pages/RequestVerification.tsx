import { useState, type FormEvent } from "react";

const API_BASE_URL = "http://127.0.0.1:8787";

export function RequestVerification() {
  const [discordHandle, setDiscordHandle] = useState("");
  const [region, setRegion] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!discordHandle.trim() || !region.trim()) {
      setError("Discord handle and region are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/nightforce/verification-requests`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            discordHandle: discordHandle.trim(),
            region: region.trim(),
            note: note.trim(),
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

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-yellow-800 rounded-lg p-6 bg-zinc-900">
          <div className="text-yellow-400 font-mono font-semibold text-sm mb-2">
            ⏳ Pending Review
          </div>
          <p className="text-zinc-400 font-mono text-sm mb-3">
            Your verification request has been submitted and is now under admin review.
          </p>
          <p className="text-zinc-500 font-mono text-xs leading-relaxed">
            Once approved, you will connect your Midnight wallet later in the flow to bind your
            profile.
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

      <div className="border border-emerald-900 rounded-lg p-4 bg-zinc-900 mb-6 text-xs font-mono text-zinc-400 leading-relaxed">
        <p className="text-emerald-400 mb-1">Wallet not required yet</p>
        <p>
          For V1.5, you can submit your verification request first. Wallet connection happens later
          after admin approval.
        </p>
      </div>

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
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
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
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
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
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
          />
        </div>

        {error && <div className="text-xs font-mono text-red-400">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="font-mono text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}