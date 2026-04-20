import type { AppStore, VerificationRequest, ProfileData, VisibilitySettings } from "../types";

const STORAGE_KEY = "nightforce_store";

export function generateOpaquePublicId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pub_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }

  return `pub_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function ensureOpaquePublicIds(store: AppStore): AppStore {
  const walletToExistingPublicId = new Map<string, string>();

  for (const profile of store.profiles) {
    if (profile.publicId && profile.publicId.trim()) {
      walletToExistingPublicId.set(profile.walletId, profile.publicId);
    }
  }

  let mutated = false;

  const profiles = store.profiles.map((profile) => {
    if (profile.publicId && profile.publicId.trim()) {
      return profile;
    }

    mutated = true;
    const publicId = walletToExistingPublicId.get(profile.walletId) ?? generateOpaquePublicId();
    walletToExistingPublicId.set(profile.walletId, publicId);

    return {
      ...profile,
      publicId,
    };
  });

  return mutated ? { ...store, profiles } : store;
}

export function loadStore(): AppStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppStore;
      const normalized = ensureOpaquePublicIds(parsed);
      if (normalized !== parsed) {
        saveStore(normalized);
      }
      return normalized;
    }
  } catch {
  }
  return getDefaultStore();
}

export function saveStore(store: AppStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function updateStore(updater: (store: AppStore) => AppStore): AppStore {
  const current = loadStore();
  const next = ensureOpaquePublicIds(updater(current));
  saveStore(next);
  return next;
}

function getDefaultStore(): AppStore {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

  const verificationRequests: VerificationRequest[] = [
    {
      id: "req-seed-001",
      walletId: "member-wallet-003",
      discordHandle: "ShadowLynx#4477",
      region: "Japan",
      note: "I have been an ambassador since early beta.",
      status: "approved",
      adminNotes: "Verified via Discord check.",
      createdAt: twoDaysAgo,
      reviewedAt: yesterday,
    },
    {
      id: "req-seed-002",
      walletId: "member-wallet-004",
      discordHandle: "NeonRaven#2211",
      region: "Germany",
      note: "",
      status: "approved",
      adminNotes: "Long-standing community member.",
      createdAt: twoDaysAgo,
      reviewedAt: yesterday,
    },
    {
      id: "req-seed-003",
      walletId: "member-wallet-005",
      discordHandle: "Cipher_X#9901",
      region: "Brazil",
      note: "Active in the South America region.",
      status: "rejected",
      adminNotes: "Could not verify ambassador status.",
      createdAt: twoDaysAgo,
      reviewedAt: yesterday,
    },
    {
      id: "req-seed-004",
      walletId: "member-wallet-006",
      discordHandle: "Vesper#0044",
      region: "Australia",
      note: "Joined through the official Nightforce program.",
      status: "pending",
      adminNotes: "",
      createdAt: now,
      reviewedAt: null,
    },
  ];

  const profiles: ProfileData[] = [
    {
      walletId: "member-wallet-003",
      publicId: "pub_seed_shadowlynx",
      displayName: "ShadowLynx",
      country: "Japan",
      role: "Node Operator",
      bio: "Running nodes across the Asia-Pacific region since day one.",
    },
    {
      walletId: "member-wallet-004",
      publicId: "pub_seed_neonraven",
      displayName: "NeonRaven",
      country: "Germany",
      role: "Developer Advocate",
      bio: "Building integrations and helping devs onboard to Midnight.",
    },
    {
      walletId: "member-wallet-005",
      publicId: "pub_seed_cipherx",
      displayName: "Cipher_X",
      country: "Brazil",
      role: "Community Lead",
      bio: "Leading the South American ambassador collective.",
    },
  ];

  const visibilitySettings: VisibilitySettings[] = [
    {
      walletId: "member-wallet-003",
      profileVisibility: "public",
      showDisplayName: true,
      showCountry: true,
      showRole: true,
      showBio: true,
    },
    {
      walletId: "member-wallet-004",
      profileVisibility: "anonymous",
      showDisplayName: false,
      showCountry: true,
      showRole: true,
      showBio: true,
    },
    {
      walletId: "member-wallet-005",
      profileVisibility: "hidden",
      showDisplayName: true,
      showCountry: true,
      showRole: true,
      showBio: true,
    },
  ];

  const approvedWallets = ["member-wallet-003", "member-wallet-004"];

  return {
    verificationRequests,
    profiles,
    visibilitySettings,
    approvedWallets,
  };
}