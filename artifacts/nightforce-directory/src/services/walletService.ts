export interface WalletAdapter {
  connect(walletId: string): Promise<{ walletId: string }>;
  disconnect(): Promise<void>;
  getConnectedWallet(): string | null;
}

// ============================================================
// MOCK WALLET IMPLEMENTATION
// Replace this file's implementation with real Midnight DApp
// Connector integration when ready.
//
// Available mock wallets for testing:
//   admin-wallet-001   → Admin access to /admin/review
//   member-wallet-001  → Test member A
//   member-wallet-002  → Test member B
//
// Real integration entry point:
//   1. Install @midnight-ntwrk/dapp-connector-api
//   2. Implement MidnightWalletAdapter below
//   3. Swap createWalletService() to return MidnightWalletAdapter
// ============================================================

export const MOCK_WALLETS = [
  "admin-wallet-001",
  "member-wallet-001",
  "member-wallet-002",
  "member-wallet-003",
  "member-wallet-004",
  "member-wallet-005",
  "member-wallet-006",
];

export const ADMIN_WALLET_ID = "admin-wallet-001";

const WALLET_STORAGE_KEY = "nightforce_wallet";

class MockWalletAdapter implements WalletAdapter {
  private connectedWalletId: string | null = null;

  constructor() {
    const saved = localStorage.getItem(WALLET_STORAGE_KEY);
    if (saved && MOCK_WALLETS.includes(saved)) {
      this.connectedWalletId = saved;
    }
  }

  async connect(walletId: string): Promise<{ walletId: string }> {
    this.connectedWalletId = walletId;
    localStorage.setItem(WALLET_STORAGE_KEY, walletId);
    return { walletId };
  }

  async disconnect(): Promise<void> {
    this.connectedWalletId = null;
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }

  getConnectedWallet(): string | null {
    return this.connectedWalletId;
  }
}

let _adapter: WalletAdapter | null = null;

export function getWalletAdapter(): WalletAdapter {
  if (!_adapter) {
    _adapter = new MockWalletAdapter();
  }
  return _adapter;
}
