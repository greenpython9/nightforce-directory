import { Link, useLocation } from "wouter";
import { useWallet } from "../hooks/useWallet";
import { ADMIN_WALLET_ID } from "../services/walletService";
import { StatusBadge } from "./StatusBadge";

function shortenValue(value: string | null, left = 8, right = 6) {
  if (!value) return "—";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export function NavBar() {
  const {
    walletId,
    isConnected,
    verificationStatus,
    connectionMode,
    midnightSnapshot,
    isWalletLoading,
    disconnect,
  } = useWallet();

  const [location] = useLocation();

  const isMockAdmin = connectionMode === "mock" && walletId === ADMIN_WALLET_ID;
  const isApprovedMock = connectionMode === "mock" && verificationStatus === "approved";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/directory", label: "Directory" },
    { href: "/request-verification", label: "Request Verification" },
    ...(isMockAdmin ? [{ href: "/admin/review", label: "Admin" }] : []),
    ...(isApprovedMock ? [{ href: "/my-profile", label: "My Profile" }] : []),
  ];

  const connectedLabel =
    connectionMode === "midnight"
      ? midnightSnapshot?.providerName ?? "Midnight Wallet"
      : walletId;

  const connectedSubLabel =
    connectionMode === "midnight"
      ? shortenValue(midnightSnapshot?.shieldedAddress ?? midnightSnapshot?.unshieldedAddress ?? null)
      : null;

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="font-mono font-bold text-white text-sm tracking-wider">
            dir.
          </Link>

          <div className="hidden sm:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-mono transition-colors ${
                  location === link.href ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          {isConnected ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-right hidden sm:block min-w-0">
                <div className="text-xs font-mono text-zinc-300 truncate">
                  {connectedLabel ?? "—"}
                </div>

                {connectionMode === "mock" ? (
                  <StatusBadge status={verificationStatus} />
                ) : (
                  <div className="flex items-center justify-end gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] font-mono text-cyan-300">MIDNIGHT</span>
                    <span className="text-[11px] font-mono text-zinc-600">•</span>
                    <span className="text-[11px] font-mono text-emerald-300">
                      {(midnightSnapshot?.networkId ?? "undeployed").toUpperCase()}
                    </span>
                    {connectedSubLabel && (
                      <>
                        <span className="text-[11px] font-mono text-zinc-600">•</span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {connectedSubLabel}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => void disconnect()}
                disabled={isWalletLoading}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
              >
                {isWalletLoading ? "Working..." : "Disconnect"}
              </button>
            </div>
          ) : (
            <Link
              href="/wallet"
              className="text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-3 py-1.5 rounded transition-colors"
            >
              Wallet / Profile
            </Link>
          )}
        </div>
      </div>

      <div className="sm:hidden border-t border-zinc-800 px-4 py-2 flex gap-4 overflow-x-auto">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs font-mono whitespace-nowrap transition-colors ${
              location === link.href ? "text-white" : "text-zinc-500"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}