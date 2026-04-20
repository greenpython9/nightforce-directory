import { Link } from "wouter";
import { useWallet } from "../hooks/useWallet";
import { MOCK_WALLETS } from "../services/walletService";
import { StatusBadge } from "../components/StatusBadge";
import { useState } from "react";

export function Landing() {
  const { walletId, isConnected, verificationStatus, connect, disconnect } = useWallet();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-mono font-bold text-white tracking-wider mb-3">
            NIGHTFORCE DIRECTORY
          </h1>
          <p className="text-sm font-mono text-zinc-400">
            Unofficial directory for existing Nightforce ambassadors
          </p>
        </div>

        {isConnected ? (
          <div className="border border-zinc-800 rounded-lg p-5 bg-zinc-900 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-500">Connected Wallet</span>
              <button
                onClick={() => disconnect()}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Disconnect
              </button>
            </div>
            <div className="font-mono text-white text-sm mb-3">{walletId}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-500">Status:</span>
              <StatusBadge status={verificationStatus} />
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="w-full font-mono text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-4 py-3 rounded-lg transition-colors"
              >
                Connect Wallet
              </button>
              {showPicker && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <span className="text-xs font-mono text-zinc-500">Select mock wallet</span>
                  </div>
                  {MOCK_WALLETS.map((wId) => (
                    <button
                      key={wId}
                      onClick={async () => {
                        await connect(wId);
                        setShowPicker(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      {wId}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
          {verificationStatus === "approved" && (
            <Link
              href="/my-profile"
              className="block text-center font-mono text-sm text-emerald-400 border border-emerald-800 px-4 py-3 rounded-lg hover:border-emerald-600 transition-colors"
            >
              My Profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
