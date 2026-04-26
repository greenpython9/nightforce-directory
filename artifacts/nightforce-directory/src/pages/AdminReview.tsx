import { useEffect, useMemo, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { StatusBadge } from "../components/StatusBadge";
import { ADMIN_WALLET_ID } from "../services/walletService";
import { buildNightforceApiUrl } from "../lib/nightforceApi";

type Tab = "pending" | "approved" | "rejected";

type VerificationRequestRecord = {
  id: string;
  discordHandle: string;
  region: string;
  note: string;
  midnightWalletAddress?: string | null;
  status: "pending" | "approved" | "rejected";
  adminNotes: string;
  createdAt: string;
  reviewedAt: string | null;
  updatedAt: string;
};

type VerificationRequestListResponse = {
  requests: VerificationRequestRecord[];
};

type VerificationRequestResponse = {
  request: VerificationRequestRecord;
};

export function AdminReview() {
  const { walletId } = useWallet();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [requests, setRequests] = useState<VerificationRequestRecord[]>([]);
  const [selected, setSelected] = useState<VerificationRequestRecord | null>(null);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  const reload = async (selectedId?: string | null) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        buildNightforceApiUrl("/api/nightforce/verification-requests"),
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
            : "Failed to load verification requests.";

        throw new Error(message);
      }

      const data = payload as VerificationRequestListResponse;
      setRequests(data.requests);
      setSelectedRequestIds((current) =>
        current.filter((id) => data.requests.some((req) => req.id === id)),
      );

      if (selectedId) {
        const nextSelected =
          data.requests.find((req) => req.id === selectedId) ?? null;
        setSelected(nextSelected);
        setAdminNotes(nextSelected?.adminNotes ?? "");
      } else {
        setSelected(null);
        setAdminNotes("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load verification requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  if (walletId !== ADMIN_WALLET_ID) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-red-800 rounded-lg p-6 bg-zinc-900">
          <div className="text-red-400 font-mono text-sm font-semibold mb-2">
            Access Denied
          </div>
          <p className="text-zinc-400 font-mono text-sm">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const countryOptions = useMemo(() => {
    const values = requests
      .filter((req) => req.status === tab)
      .map((req) => req.region.trim())
      .filter(Boolean);

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [requests, tab]);

  const filtered = requests.filter((r) => {
    if (r.status !== tab) return false;

    if (countryFilter !== "all" && r.region !== countryFilter) {
      return false;
    }

    if (!search.trim()) return true;

    const q = search.toLowerCase();

    return (
      r.discordHandle.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.midnightWalletAddress ?? "").toLowerCase().includes(q)
    );
  });

  const filteredIds = filtered.map((req) => req.id);
  const selectedVisibleCount = selectedRequestIds.filter((id) =>
    filteredIds.includes(id),
  ).length;
  const allVisibleSelected =
    filtered.length > 0 && selectedVisibleCount === filtered.length;

  const handleSelect = (req: VerificationRequestRecord) => {
    setSelected(req);
    setAdminNotes(req.adminNotes);
  };

  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequestIds((current) =>
      current.includes(requestId)
        ? current.filter((id) => id !== requestId)
        : [...current, requestId],
    );
  };

  const toggleSelectAllVisible = () => {
    setSelectedRequestIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !filteredIds.includes(id));
      }

      return Array.from(new Set([...current, ...filteredIds]));
    });
  };

  const handleReview = async (action: "approve" | "reject") => {
    if (!selected) return;

    setActing(true);
    setError("");

    try {
      const response = await fetch(
        buildNightforceApiUrl(
          `/api/nightforce/verification-requests/${selected.id}/${action}`,
        ),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            adminNotes,
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
            : `Failed to ${action} verification request.`;

        throw new Error(message);
      }

      const data = payload as VerificationRequestResponse;
      const nextTab: Tab = data.request.status;
      setTab(nextTab);
      await reload(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} verification request.`,
      );
    } finally {
      setActing(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-xl font-mono font-bold text-white mb-6">
        Admin Review
      </h1>

      <div className="flex gap-1 mb-6 border-b border-zinc-800">
        {tabs.map((t) => {
          const count = requests.filter((r) => r.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setSelected(null);
                setSelectedRequestIds([]);
                setCountryFilter("all");
                setAdminNotes("");
              }}
              className={`px-4 py-2 text-xs font-mono border-b-2 transition-colors ${
                tab === t.key
                  ? "border-white text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 text-xs font-mono text-red-400">{error}</div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="mb-4 grid gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Discord, country/region, wallet, or request ID..."
              className="w-full rounded-xl border border-white/10 bg-black/35 px-3.5 py-3 text-sm font-mono text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-zinc-700 transition-all focus:border-emerald-300/35 focus:bg-black/45 focus:outline-none focus:ring-2 focus:ring-emerald-400/10"
            />

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/35 px-3.5 py-3 text-sm font-mono text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus:border-emerald-300/35 focus:bg-black/45 focus:outline-none focus:ring-2 focus:ring-emerald-400/10"
              >
                <option value="all">All Countries / Regions</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCountryFilter("all");
                }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-mono font-semibold text-zinc-300 transition-all hover:border-emerald-300/30 hover:bg-emerald-400/10 hover:text-emerald-100"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  className="h-4 w-4 accent-emerald-400"
                />
                Select all visible
              </label>

              <span className="text-xs font-mono text-zinc-500">
                {selectedVisibleCount} selected
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-xs font-mono text-zinc-500 py-8 text-center">
              Loading requests...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-xs font-mono text-zinc-600 py-8 text-center">
              No {tab} requests
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((req) => (
                <div
                  key={req.id}
                  className={`flex gap-3 rounded-xl border p-3 transition-colors ${
                    selected?.id === req.id
                      ? "border-emerald-400/30 bg-emerald-400/[0.05]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRequestIds.includes(req.id)}
                    onChange={() => toggleRequestSelection(req.id)}
                    className="mt-1 h-4 w-4 flex-shrink-0 accent-emerald-400"
                    aria-label={`Select request from ${req.discordHandle}`}
                  />

                  <button
                    type="button"
                    onClick={() => handleSelect(req)}
                    className="min-w-0 flex-1 text-left"
                  >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-mono text-white">
                      {req.discordHandle}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="text-xs font-mono text-zinc-500">
                    {req.region}
                  </div>
                  <div className="text-xs font-mono text-zinc-600 mt-1">
                    {formatDate(req.createdAt)}
                  </div>

                  {req.midnightWalletAddress && (
                    <div className="mt-1 truncate text-[11px] font-mono text-zinc-600">
                      Wallet: {req.midnightWalletAddress}
                    </div>
                  )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected ? (
          <div className="w-80 flex-shrink-0">
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-semibold text-white">
                  {selected.discordHandle}
                </span>
                <StatusBadge status={selected.status} />
              </div>

              <div className="flex flex-col gap-2 text-xs font-mono">
                <div>
                  <span className="text-zinc-600">Request ID: </span>
                  <span className="text-zinc-300 break-all">{selected.id}</span>
                </div>
                <div>
                  <span className="text-zinc-600">Wallet: </span>
                  <span className="text-zinc-300 break-all">
                    {selected.midnightWalletAddress ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-600">Submitted: </span>
                  <span className="text-zinc-300">
                    {formatDate(selected.createdAt)}
                  </span>
                </div>
                {selected.reviewedAt && (
                  <div>
                    <span className="text-zinc-600">Reviewed: </span>
                    <span className="text-zinc-300">
                      {formatDate(selected.reviewedAt)}
                    </span>
                  </div>
                )}
                {selected.note && (
                  <div>
                    <span className="text-zinc-600">Note: </span>
                    <span className="text-zinc-300">{selected.note}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              {selected.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleReview("approve")}
                    disabled={acting}
                    className="flex-1 font-mono text-xs bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {acting ? "Working..." : "Approve"}
                  </button>
                  <button
                    onClick={() => void handleReview("reject")}
                    disabled={acting}
                    className="flex-1 font-mono text-xs bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {acting ? "Working..." : "Reject"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-80 flex-shrink-0 border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-600">
              Select a request to review
            </span>
          </div>
        )}
      </div>
    </div>
  );
}