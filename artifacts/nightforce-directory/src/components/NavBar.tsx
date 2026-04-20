import { Link, useLocation } from "wouter";
import { useWallet } from "../hooks/useWallet";
import { MOCK_WALLETS, ADMIN_WALLET_ID } from "../services/walletService";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

export function NavBar() {
  const { walletId, isConnected, verificationStatus, connect, disconnect } = useWallet();
  const [location] = useLocation();
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/directory", label: "Directory" },
    { href: "/request-verification", label: "Request Verification" },
    ...(walletId === ADMIN_WALLET_ID ? [{ href: "/admin/review", label: "Admin" }] : []),
    ...(verificationStatus === "approved" ? [{ href: "/my-profile", label: "My Profile" }] : []),
  ];

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-mono font-bold text-white text-sm tracking-wider">
            NIGHTFORCE DIR
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-mono transition-colors ${
                  location === link.href
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-mono text-zinc-400">{walletId}</div>
                <StatusBadge status={verificationStatus} />
              </div>
              <button
                onClick={() => disconnect()}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-700 px-2 py-1 rounded transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowWalletPicker(!showWalletPicker)}
                className="text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-3 py-1.5 rounded transition-colors"
              >
                Connect Wallet
              </button>
              {showWalletPicker && (
                <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-52">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <span className="text-xs font-mono text-zinc-500">Select mock wallet</span>
                  </div>
                  {MOCK_WALLETS.map((wId) => (
                    <button
                      key={wId}
                      onClick={async () => {
                        await connect(wId);
                        setShowWalletPicker(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-between"
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
          )}
        </div>
      </div>

      {/* Mobile nav */}
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
