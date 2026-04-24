import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

type JsonRecord = Record<string, unknown>;

type VerificationStatus = "pending" | "approved" | "rejected";

type VerificationRequestRecord = JsonRecord & {
  id: string;
  status: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

type WalletBindingRecord = {
  id: string;
  verificationRequestId: string;
  midnightWalletAddress: string;
  boundAt: string;
  isActive: "true" | "false";
  updatedAt: string;
};

type ProfileRecord = JsonRecord & {
  id: string;
  verificationRequestId: string;
  walletBindingId: string;
  publicId: string;
  slug: string | null;
  displayName: string | null;
  region: string | null;
  country: string | null;
  role: string | null;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  contactModeContractAddress: string | null;
  contactModeSyncStatus: "not_created" | "synced" | "failed";
  contactModeLastSyncedAt: string | null;
  contactModeSyncError: string | null;
  contactModeSyncedValue:
    | "NO_CONTACT"
    | "PRIVATE_CONTACT_AVAILABLE"
    | "PUBLIC_CONTACT_ALLOWED"
    | null;
  socials: string[];
  fieldVisibility: unknown;
  encryptedHiddenPayload: unknown;
  publishState: "draft" | "published" | "inactive";
  requestedVisibility: "public" | "hidden";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  inactiveAt: string | null;
};

const verificationRequests = new Map<string, VerificationRequestRecord>();
const walletBindingsById = new Map<string, WalletBindingRecord>();
const walletBindingIdsByWallet = new Map<string, string>();
const profilesByVerificationRequestId = new Map<string, ProfileRecord>();

function nowIso(): string {
  return new Date().toISOString();
}

function asRecord(value: unknown): JsonRecord {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonRecord;
  }

  return {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function makePublicId(verificationRequestId: string): string {
  return `profile-${verificationRequestId.slice(0, 8)}`;
}

function getWalletAddressFromBody(body: JsonRecord): string | null {
  return (
    asString(body.midnightWalletAddress) ??
    asString(body.walletAddress) ??
    asString(body.walletId)
  );
}

router.post("/nightforce/verification-requests", (req, res) => {
  const body = asRecord(req.body);
  const timestamp = nowIso();

  const request: VerificationRequestRecord = {
    ...body,
    id: randomUUID(),
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
    reviewedAt: null,
    reviewNote: null,
  };

  verificationRequests.set(request.id, request);

  res.status(201).json({
    request,
  });
});

router.get("/nightforce/verification-requests", (_req, res) => {
  res.json({
    requests: Array.from(verificationRequests.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
  });
});

router.post("/nightforce/verification-requests/:id/:action", (req, res) => {
  const { id, action } = req.params;
  const request = verificationRequests.get(id);

  if (!request) {
    res.status(404).json({
      error: "Verification request not found.",
    });
    return;
  }

  if (action !== "approve" && action !== "reject") {
    res.status(400).json({
      error: "Unsupported verification action.",
    });
    return;
  }

  const body = asRecord(req.body);
  const timestamp = nowIso();

  request.status = action === "approve" ? "approved" : "rejected";
  request.updatedAt = timestamp;
  request.reviewedAt = timestamp;
  request.reviewNote = asString(body.reviewNote) ?? asString(body.note);

  verificationRequests.set(request.id, request);

  res.json({
    request,
  });
});

router.post("/nightforce/wallet-bindings", (req, res) => {
  const body = asRecord(req.body);
  const verificationRequestId = asString(body.verificationRequestId);
  const midnightWalletAddress = getWalletAddressFromBody(body);

  if (!verificationRequestId) {
    res.status(400).json({
      error: "verificationRequestId is required.",
    });
    return;
  }

  if (!midnightWalletAddress) {
    res.status(400).json({
      error: "midnightWalletAddress is required.",
    });
    return;
  }

  const request = verificationRequests.get(verificationRequestId);

  if (!request) {
    res.status(404).json({
      error: "Verification request not found.",
    });
    return;
  }

  if (request.status !== "approved") {
    res.status(409).json({
      error: "Verification request must be approved before wallet binding.",
    });
    return;
  }

  const existingBindingId = walletBindingIdsByWallet.get(midnightWalletAddress);

  if (existingBindingId) {
    const existingBinding = walletBindingsById.get(existingBindingId);

    if (existingBinding) {
      res.json({
        binding: existingBinding,
      });
      return;
    }
  }

  const timestamp = nowIso();
  const binding: WalletBindingRecord = {
    id: randomUUID(),
    verificationRequestId,
    midnightWalletAddress,
    boundAt: timestamp,
    isActive: "true",
    updatedAt: timestamp,
  };

  walletBindingsById.set(binding.id, binding);
  walletBindingIdsByWallet.set(midnightWalletAddress, binding.id);

  res.status(201).json({
    binding,
  });
});

router.get("/nightforce/wallet-bindings/by-wallet/:walletAddress", (req, res) => {
  const walletAddress = req.params.walletAddress;
  const bindingId = walletBindingIdsByWallet.get(walletAddress);

  if (!bindingId) {
    res.status(404).json({
      error: "Wallet binding not found.",
    });
    return;
  }

  const binding = walletBindingsById.get(bindingId);

  if (!binding) {
    res.status(404).json({
      error: "Wallet binding not found.",
    });
    return;
  }

  res.json({
    binding,
  });
});

router.get("/nightforce/profiles/:verificationRequestId", (req, res) => {
  const profile = profilesByVerificationRequestId.get(
    req.params.verificationRequestId,
  );

  if (!profile) {
    res.status(404).json({
      error: "Profile not found.",
    });
    return;
  }

  res.json({
    profile,
  });
});

router.put("/nightforce/profiles/:verificationRequestId", (req, res) => {
  const verificationRequestId = req.params.verificationRequestId;
  const body = asRecord(req.body);
  const timestamp = nowIso();
  const existingProfile =
    profilesByVerificationRequestId.get(verificationRequestId) ?? null;

  const walletBindingId = asString(body.walletBindingId);

  if (!walletBindingId) {
    res.status(400).json({
      error: "walletBindingId is required.",
    });
    return;
  }

  const publicId =
    asString(body.publicId) ??
    asString(body.slug) ??
    existingProfile?.publicId ??
    makePublicId(verificationRequestId);

  const publishState =
    body.publishState === "inactive" || body.publishState === "draft"
      ? body.publishState
      : "published";

  const requestedVisibility =
    body.requestedVisibility === "hidden" ? "hidden" : "public";

  const profile: ProfileRecord = {
    id: existingProfile?.id ?? randomUUID(),
    verificationRequestId,
    walletBindingId,
    publicId,
    slug: asString(body.slug) ?? publicId,
    displayName: asString(body.displayName),
    region: asString(body.region),
    country: asString(body.country),
    role: asString(body.role),
    bio: asString(body.bio),
    avatarUrl: asString(body.avatarUrl),
    websiteUrl: asString(body.websiteUrl),
    publicEmail: asString(body.publicEmail),
    contactModeContractAddress:
      existingProfile?.contactModeContractAddress ?? null,
    contactModeSyncStatus: existingProfile?.contactModeSyncStatus ?? "not_created",
    contactModeLastSyncedAt: existingProfile?.contactModeLastSyncedAt ?? null,
    contactModeSyncError: existingProfile?.contactModeSyncError ?? null,
    contactModeSyncedValue: existingProfile?.contactModeSyncedValue ?? null,
    socials: asStringArray(body.socials),
    fieldVisibility: body.fieldVisibility ?? {},
    encryptedHiddenPayload: body.encryptedHiddenPayload ?? null,
    publishState,
    requestedVisibility,
    createdAt: existingProfile?.createdAt ?? timestamp,
    updatedAt: timestamp,
    publishedAt: publishState === "published" ? timestamp : existingProfile?.publishedAt ?? null,
    inactiveAt: publishState === "inactive" ? timestamp : null,
  };

  profilesByVerificationRequestId.set(verificationRequestId, profile);

  res.json({
    profile,
  });
});

router.post("/nightforce/profiles/:verificationRequestId/contact-mode-sync", (req, res) => {
  const verificationRequestId = req.params.verificationRequestId;
  const body = asRecord(req.body);
  const profile = profilesByVerificationRequestId.get(verificationRequestId);

  if (!profile) {
    res.status(404).json({
      error: "Profile not found.",
    });
    return;
  }

  const syncStatus = body.contactModeSyncStatus;

  if (
    syncStatus !== "not_created" &&
    syncStatus !== "synced" &&
    syncStatus !== "failed"
  ) {
    res.status(400).json({
      error: "Invalid contactModeSyncStatus.",
    });
    return;
  }

  const syncedValue = asString(body.contactModeSyncedValue);

  const validSyncedValue =
    syncedValue === "NO_CONTACT" ||
    syncedValue === "PRIVATE_CONTACT_AVAILABLE" ||
    syncedValue === "PUBLIC_CONTACT_ALLOWED"
      ? syncedValue
      : null;

  profile.contactModeContractAddress =
    asString(body.contactModeContractAddress) ?? null;
  profile.contactModeSyncStatus = syncStatus;
  profile.contactModeLastSyncedAt =
    asString(body.contactModeLastSyncedAt) ?? null;
  profile.contactModeSyncError = asString(body.contactModeSyncError);
  profile.contactModeSyncedValue =
    syncStatus === "synced"
      ? validSyncedValue
      : profile.contactModeSyncedValue ?? null;
  profile.updatedAt = nowIso();

  profilesByVerificationRequestId.set(verificationRequestId, profile);

  res.json({
    profile,
  });
});

router.get("/nightforce/public-profiles/:publicId", (req, res) => {
  const publicId = req.params.publicId;
  const profile = Array.from(profilesByVerificationRequestId.values()).find(
    (item) => item.publicId === publicId || item.slug === publicId,
  );

  if (!profile || profile.publishState !== "published") {
    res.status(404).json({
      error: "Public profile not found.",
    });
    return;
  }

  res.json({
    profile,
  });
});

function deriveContactMode(profile: ProfileRecord):
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED" {
  if (profile.publicEmail) {
    return "PUBLIC_CONTACT_ALLOWED";
  }

  if (profile.encryptedHiddenPayload) {
    return "PRIVATE_CONTACT_AVAILABLE";
  }

  return "NO_CONTACT";
}

function getPublishedDirectoryProfiles() {
  return Array.from(profilesByVerificationRequestId.values())
    .filter((profile) => profile.publishState === "published")
    .map((profile) => ({
      ...profile,
      contactMode: deriveContactMode(profile),
    }));
}

router.get("/nightforce/public-profiles", (_req, res) => {
  res.json({
    profiles: getPublishedDirectoryProfiles(),
  });
});

router.get("/nightforce/directory", (_req, res) => {
  res.json({
    profiles: getPublishedDirectoryProfiles(),
  });
});

export default router;