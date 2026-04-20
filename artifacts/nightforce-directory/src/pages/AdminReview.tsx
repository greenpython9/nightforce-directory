import { useState, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { loadStore, updateStore } from "../lib/storage";
import { StatusBadge } from "../components/StatusBadge";
import type { VerificationRequest, VerificationStatus } from "../types";
import { ADMIN_WALLET_ID } from "../services/walletService";

type Tab = "pending" | "approved" | "rejected";

export function AdminReview() {
  const { walletId } = useWallet();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selected, setSelected] = useState<VerificationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const reload = () => {
    const store = loadStore();
    setRequests(store.verificationRequests);
  };

  useEffect(() => {
    reload();
  }, []);

  if (walletId !== ADMIN_WALLET_ID) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-red-800 rounded-lg p-6 bg-zinc-900">
          <div className="text-red-400 font-mono text-sm font-semibold mb-2">Access Denied</div>
          <p className="text-zinc-400 font-mono text-sm">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const filtered = requests.filter((r) => {
    if (r.status !== tab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.discordHandle.toLowerCase().includes(q) || r.walletId.toLowerCase().includes(q)
    );
  });

  const handleSelect = (req: VerificationRequest) => {
    setSelected(req);
    setAdminNotes(req.adminNotes);
  };

  const handleApprove = () => {
    if (!selected) return;
    updateStore((store) => ({
      ...store,
      verificationRequests: store.verificationRequests.map((r) =>
        r.id === selected.id
          ? { ...r, status: "approved" as VerificationStatus, adminNotes, reviewedAt: new Date().toISOString() }
          : r
      ),
      approvedWallets: store.approvedWallets.includes(selected.walletId)
        ? store.approvedWallets
        : [...store.approvedWallets, selected.walletId],
    }));
    reload();
    setSelected(null);
    setTab("approved");
  };

  const handleReject = () => {
    if (!selected) return;
    updateStore((store) => ({
      ...store,
      verificationRequests: store.verificationRequests.map((r) =>
        r.id === selected.id
          ? { ...r, status: "rejected" as VerificationStatus, adminNotes, reviewedAt: new Date().toISOString() }
          : r
      ),
    }));
    reload();
    setSelected(null);
    setTab("rejected");
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
      <h1 className="text-xl font-mono font-bold text-white mb-6">Admin Review</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-800">
        {tabs.map((t) => {
          const count = requests.filter((r) => r.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelected(null); }}
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

      <div className="flex gap-6">
        {/* List panel */}
        <div className="flex-1 min-w-0">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Discord handle or wallet ID..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 mb-4"
          />

          {filtered.length === 0 ? (
            <div className="text-xs font-mono text-zinc-600 py-8 text-center">
              No {tab} requests
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((req) => (
                <button
                  key={req.id}
                  onClick={() => handleSelect(req)}
                  className={`w-full text-left border rounded-lg p-3 transition-colors ${
                    selected?.id === req.id
                      ? "border-zinc-500 bg-zinc-800"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-mono text-white">{req.discordHandle}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="text-xs font-mono text-zinc-500">{req.walletId}</div>
                  <div className="text-xs font-mono text-zinc-600 mt-1">
                    {formatDate(req.createdAt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
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
                  <span className="text-zinc-600">Wallet: </span>
                  <span className="text-zinc-300">{selected.walletId}</span>
                </div>
                <div>
                  <span className="text-zinc-600">Region: </span>
                  <span className="text-zinc-300">{selected.region}</span>
                </div>
                <div>
                  <span className="text-zinc-600">Submitted: </span>
                  <span className="text-zinc-300">{formatDate(selected.createdAt)}</span>
                </div>
                {selected.reviewedAt && (
                  <div>
                    <span className="text-zinc-600">Reviewed: </span>
                    <span className="text-zinc-300">{formatDate(selected.reviewedAt)}</span>
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
                    onClick={handleApprove}
                    className="flex-1 font-mono text-xs bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 px-3 py-2 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 font-mono text-xs bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 px-3 py-2 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-80 flex-shrink-0 border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-600">Select a request to review</span>
          </div>
        )}
      </div>
    </div>
  );
}
