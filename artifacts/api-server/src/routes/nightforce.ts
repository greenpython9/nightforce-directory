import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

type JsonRecord = Record<string, unknown>;

type VerificationStatus = "pending" | "approved" | "rejected";

type VerificationRequestRecord = JsonRecord & {
  id: string;
  midnightWalletAddress: string | null;
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
  nightDomain: string | null;
  publicEmail: string | null;
  contactModeContractAddress: string | null;
  contactModeNetworkId: "preprod" | "mainnet" | null;
  contactModeSyncStatus: "not_created" | "synced" | "failed";
  contactModeLastSyncedAt: string | null;
  contactModeSyncError: string | null;
  contactModeSyncedValue:
    | "NO_CONTACT"
    | "PRIVATE_CONTACT_AVAILABLE"
    | "PUBLIC_CONTACT_ALLOWED"
    | null;

  contactModeArchitecture: "per_profile" | "global";
  contactModeProfileKey: string | null;
  contactModeOwnerCommitment: string | null;
  contactModeEntryStatus: "not_registered" | "registered" | "failed" | "rotated";
  contactModeEntryVersion: number;
  contactModeGlobalContractAddress: string | null;
  contactModeGlobalNetworkId: "preprod" | "mainnet" | null;

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

function isValidNightDomain(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  if (
    !normalized.endsWith(".night") ||
    normalized.length > NIGHT_DOMAIN_MAX_LENGTH ||
    normalized.includes("..") ||
    normalized.includes("/") ||
    normalized.includes(":")
  ) {
    return false;
  }

  const domainWithoutTld = normalized.slice(0, -".night".length);
  const labels = domainWithoutTld.split(".");

  return (
    labels.length > 0 &&
    labels.every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        NIGHT_DOMAIN_LABEL_PATTERN.test(label),
    )
  );
}

function normalizeNightDomain(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return isValidNightDomain(normalized) ? normalized : null;
}

const PROFILE_LINK_MIN_LENGTH = 3;
const PROFILE_LINK_MAX_LENGTH = 32;
const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 40;
const BIO_MAX_LENGTH = 280;
const NIGHT_DOMAIN_MAX_LENGTH = 253;
const NIGHT_DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const RESERVED_PROFILE_LINK_WORDS = new Set([
  "admin",
  "administrator",
  "mod",
  "moderator",
  "staff",
  "support",
  "help",
  "contact",
  "submit",
  "login",
  "signin",
  "signup",
  "register",
  "verify",
  "verification",
  "request",
  "dashboard",
  "settings",
  "account",
  "profile",
  "profiles",
  "directory",
  "api",
  "404",
  "500",
  "error",
  "terms",
  "privacy",
  "faq",
  "wallet",
  "midnight",
  "nightforce",
  "official",
  "team",
  "security",
  "scam",
  "phishing",
  "fraud",
  "hack",
  "hacked",
  "airdrop",
  "claim",
  "token",
  "giveaway",
  "free",
]);

function hasLetterOrNumber(value: string): boolean {
  return /[\p{L}\p{N}]/u.test(value);
}

function getProfileLinkValidationMessage(value: string): string | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.length < PROFILE_LINK_MIN_LENGTH ||
    normalized.length > PROFILE_LINK_MAX_LENGTH
  ) {
    return `Profile link must be ${PROFILE_LINK_MIN_LENGTH}–${PROFILE_LINK_MAX_LENGTH} characters.`;
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return "Profile link can only use lowercase letters, numbers, and hyphens.";
  }

  if (normalized.startsWith("-") || normalized.endsWith("-")) {
    return "Profile link cannot start or end with a hyphen.";
  }

  if (normalized.includes("--")) {
    return "Profile link cannot contain double hyphens.";
  }

  const reservedWord = normalized
    .split("-")
    .find((part) => RESERVED_PROFILE_LINK_WORDS.has(part));

  if (reservedWord) {
    return `Profile link cannot use reserved words like “${reservedWord}”.`;
  }

  return null;
}

function getDisplayNameValidationMessage(value: string): string | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.length < DISPLAY_NAME_MIN_LENGTH ||
    normalized.length > DISPLAY_NAME_MAX_LENGTH
  ) {
    return `Display name must be ${DISPLAY_NAME_MIN_LENGTH}–${DISPLAY_NAME_MAX_LENGTH} characters.`;
  }

  if (!hasLetterOrNumber(normalized)) {
    return "Display name must include at least one letter or number.";
  }

  return null;
}

function getBioValidationMessage(value: string): string | null {
  const normalized = value.trim();

  if (normalized.length > BIO_MAX_LENGTH) {
    return `Bio must be ${BIO_MAX_LENGTH} characters or less.`;
  }

  return null;
}

function getProfileValidationErrors(input: {
  publicId: string | null;
  slug: string | null;
  displayName: string | null;
  bio: string | null;
}): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  const publicIdMessage = input.publicId
    ? getProfileLinkValidationMessage(input.publicId)
    : null;

  if (publicIdMessage) {
    errors.publicId = [publicIdMessage];
  }

  const slugMessage = input.slug
    ? getProfileLinkValidationMessage(input.slug)
    : null;

  if (slugMessage) {
    errors.slug = [slugMessage];
  }

  const displayNameMessage = input.displayName
    ? getDisplayNameValidationMessage(input.displayName)
    : null;

  if (displayNameMessage) {
    errors.displayName = [displayNameMessage];
  }

  const bioMessage = input.bio ? getBioValidationMessage(input.bio) : null;

  if (bioMessage) {
    errors.bio = [bioMessage];
  }

  return errors;
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

function findVerificationRequestByWallet(
  walletAddress: string,
): VerificationRequestRecord | null {
  for (const request of verificationRequests.values()) {
    if (request.midnightWalletAddress === walletAddress) {
      return request;
    }
  }

  return null;
}

router.post("/nightforce/verification-requests", (req, res) => {
  const body = asRecord(req.body);
  const timestamp = nowIso();
  const midnightWalletAddress = getWalletAddressFromBody(body);

  if (midnightWalletAddress) {
    const existingRequest = findVerificationRequestByWallet(midnightWalletAddress);

    if (existingRequest) {
      res.json({
        request: existingRequest,
      });
      return;
    }
  }

  const request: VerificationRequestRecord = {
    ...body,
    id: randomUUID(),
    midnightWalletAddress,
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

function listVerificationRequests(_req: Request, res: Response) {
  res.json({
    requests: Array.from(verificationRequests.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
  });
}

router.get("/nightforce/verification-requests", listVerificationRequests);
router.get("/nightforce/admin/verification-requests", listVerificationRequests);

router.get("/nightforce/verification-requests/by-wallet/:walletAddress", (req, res) => {
  const walletAddress = asString(req.params.walletAddress);

  if (!walletAddress) {
    res.status(400).json({
      error: "walletAddress is required.",
    });
    return;
  }

  const request = findVerificationRequestByWallet(walletAddress);

  if (!request) {
    res.status(404).json({
      error: "Verification request not found.",
    });
    return;
  }

  res.json({
    request,
  });
});

function reviewVerificationRequest(
  req: Request,
  res: Response,
  actionOverride?: "approve" | "reject",
) {
  const id = asString(req.params.id);
  const action = actionOverride ?? asString(req.params.action);

  if (!id) {
    res.status(400).json({
      error: "Verification request id is required.",
    });
    return;
  }

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
}

router.post("/nightforce/verification-requests/:id/:action", (req, res) => {
  reviewVerificationRequest(req, res);
});

router.post("/nightforce/admin/verification-requests/:id/approve", (req, res) => {
  reviewVerificationRequest(req, res, "approve");
});

router.post("/nightforce/admin/verification-requests/:id/reject", (req, res) => {
  reviewVerificationRequest(req, res, "reject");
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

  if (
    request.midnightWalletAddress &&
    request.midnightWalletAddress !== midnightWalletAddress
  ) {
    res.status(409).json({
      error:
        "This verification request belongs to a different Midnight wallet address.",
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

  const requestedPublicId = asString(body.publicId);
  const requestedSlug = asString(body.slug);
  const requestedDisplayName = asString(body.displayName);
  const requestedBio = asString(body.bio);

  const validationErrors = getProfileValidationErrors({
    publicId: requestedPublicId ?? requestedSlug,
    slug: requestedSlug,
    displayName: requestedDisplayName,
    bio: requestedBio,
  });

  if (Object.keys(validationErrors).length > 0) {
    res.status(400).json({
      error: "Invalid profile input",
      details: {
        formErrors: [],
        fieldErrors: validationErrors,
      },
    });
    return;
  }

  const publicId =
    requestedPublicId ??
    requestedSlug ??
    existingProfile?.publicId ??
    makePublicId(verificationRequestId);

  const slug = requestedSlug ?? publicId;

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
    slug,
    displayName: requestedDisplayName,
    region: asString(body.region),
    country: asString(body.country),
    role: asString(body.role),
    bio: requestedBio,
    avatarUrl: asString(body.avatarUrl),
    websiteUrl: asString(body.websiteUrl),
    nightDomain:
      body.nightDomain === undefined
        ? (existingProfile?.nightDomain ?? null)
        : normalizeNightDomain(body.nightDomain),
    publicEmail: asString(body.publicEmail),
    contactModeContractAddress:
      existingProfile?.contactModeContractAddress ?? null,
    contactModeNetworkId: existingProfile?.contactModeNetworkId ?? null,
    contactModeSyncStatus: existingProfile?.contactModeSyncStatus ?? "not_created",
    contactModeLastSyncedAt: existingProfile?.contactModeLastSyncedAt ?? null,
    contactModeSyncError: existingProfile?.contactModeSyncError ?? null,
    contactModeSyncedValue: existingProfile?.contactModeSyncedValue ?? null,

    contactModeArchitecture:
      existingProfile?.contactModeArchitecture ?? "per_profile",
    contactModeProfileKey: existingProfile?.contactModeProfileKey ?? null,
    contactModeOwnerCommitment:
      existingProfile?.contactModeOwnerCommitment ?? null,
    contactModeEntryStatus:
      existingProfile?.contactModeEntryStatus ?? "not_registered",
    contactModeEntryVersion: existingProfile?.contactModeEntryVersion ?? 0,
    contactModeGlobalContractAddress:
      existingProfile?.contactModeGlobalContractAddress ?? null,
    contactModeGlobalNetworkId:
      existingProfile?.contactModeGlobalNetworkId ?? null,

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

  const networkId = asString(body.contactModeNetworkId);
  const validNetworkId =
    networkId === "preprod" || networkId === "mainnet" ? networkId : null;

  const syncedValue = asString(body.contactModeSyncedValue);

  const validSyncedValue =
    syncedValue === "NO_CONTACT" ||
    syncedValue === "PRIVATE_CONTACT_AVAILABLE" ||
    syncedValue === "PUBLIC_CONTACT_ALLOWED"
      ? syncedValue
      : null;

  const architecture = asString(body.contactModeArchitecture);
  const validArchitecture =
    architecture === "per_profile" || architecture === "global"
      ? architecture
      : null;

  const entryStatus = asString(body.contactModeEntryStatus);
  const validEntryStatus =
    entryStatus === "not_registered" ||
    entryStatus === "registered" ||
    entryStatus === "failed" ||
    entryStatus === "rotated"
      ? entryStatus
      : null;

  const entryVersion =
    typeof body.contactModeEntryVersion === "number" &&
    Number.isInteger(body.contactModeEntryVersion) &&
    body.contactModeEntryVersion >= 0
      ? body.contactModeEntryVersion
      : null;

  const globalNetworkId = asString(body.contactModeGlobalNetworkId);
  const validGlobalNetworkId =
    globalNetworkId === "preprod" || globalNetworkId === "mainnet"
      ? globalNetworkId
      : null;

  if (syncStatus === "synced" && !validSyncedValue) {
    res.status(400).json({
      error: "contactModeSyncedValue is required when contactModeSyncStatus is synced.",
    });
    return;
  }

  if (syncStatus === "synced" && !validNetworkId) {
    res.status(400).json({
      error: "contactModeNetworkId is required when contactModeSyncStatus is synced.",
    });
    return;
  }

  profile.contactModeContractAddress =
    asString(body.contactModeContractAddress) ?? null;
  profile.contactModeNetworkId =
    validNetworkId ??
    (profile.contactModeContractAddress
      ? profile.contactModeNetworkId ?? "preprod"
      : null);
  profile.contactModeSyncStatus = syncStatus;
  profile.contactModeLastSyncedAt =
    asString(body.contactModeLastSyncedAt) ?? null;
  profile.contactModeSyncError = asString(body.contactModeSyncError);
  profile.contactModeSyncedValue =
    syncStatus === "synced"
      ? validSyncedValue
      : profile.contactModeSyncedValue ?? null;

  profile.contactModeArchitecture =
    validArchitecture ?? profile.contactModeArchitecture ?? "per_profile";
  profile.contactModeProfileKey =
    body.contactModeProfileKey === undefined
      ? profile.contactModeProfileKey ?? null
      : asString(body.contactModeProfileKey);
  profile.contactModeOwnerCommitment =
    body.contactModeOwnerCommitment === undefined
      ? profile.contactModeOwnerCommitment ?? null
      : asString(body.contactModeOwnerCommitment);
  profile.contactModeEntryStatus =
    validEntryStatus ?? profile.contactModeEntryStatus ?? "not_registered";
  profile.contactModeEntryVersion =
    entryVersion ?? profile.contactModeEntryVersion ?? 0;
  profile.contactModeGlobalContractAddress =
    body.contactModeGlobalContractAddress === undefined
      ? profile.contactModeGlobalContractAddress ?? null
      : asString(body.contactModeGlobalContractAddress);
  profile.contactModeGlobalNetworkId =
    body.contactModeGlobalNetworkId === undefined
      ? profile.contactModeGlobalNetworkId ?? null
      : validGlobalNetworkId;

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

  if (
    !profile ||
    profile.publishState !== "published" ||
    profile.requestedVisibility !== "public"
  ) {
    res.status(404).json({
      error: "Public profile not found.",
    });
    return;
  }

  res.json({
    profile: toPublicProfile(profile),
  });
});

type ContactMode =
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED";

function isContactMode(value: unknown): value is ContactMode {
  return (
    value === "NO_CONTACT" ||
    value === "PRIVATE_CONTACT_AVAILABLE" ||
    value === "PUBLIC_CONTACT_ALLOWED"
  );
}

function deriveContactMode(profile: ProfileRecord): ContactMode {
  if (profile.publicEmail) {
    return "PUBLIC_CONTACT_ALLOWED";
  }

  if (profile.encryptedHiddenPayload) {
    return "PRIVATE_CONTACT_AVAILABLE";
  }

  return "NO_CONTACT";
}

function getPublicContactMode(profile: ProfileRecord): ContactMode {
  if (
    profile.contactModeSyncStatus === "synced" &&
    isContactMode(profile.contactModeSyncedValue)
  ) {
    return profile.contactModeSyncedValue;
  }

  return deriveContactMode(profile);
}

type FieldVisibilityKey =
  | "avatarUrl"
  | "displayName"
  | "region"
  | "country"
  | "role"
  | "bio"
  | "websiteUrl"
  | "nightDomain"
  | "email"
  | "x"
  | "youtube"
  | "discord"
  | "telegram";

function isPublicField(profile: ProfileRecord, key: FieldVisibilityKey): boolean {
  return asRecord(profile.fieldVisibility)[key] === "public";
}

function getSocialVisibilityKey(
  social: string,
): "x" | "youtube" | "discord" | "telegram" | null {
  const value = social.trim();

  if (!value) {
    return null;
  }

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.replace(/^\/+/, "");

    if ((host === "x.com" || host === "twitter.com") && path) {
      return "x";
    }

    if (
      host === "youtube.com" &&
      (path.startsWith("@") ||
        path.startsWith("channel/") ||
        path.startsWith("c/") ||
        path.startsWith("user/"))
    ) {
      return "youtube";
    }

    if (
      host === "discord.gg" ||
      (host === "discord.com" && path.startsWith("invite/"))
    ) {
      return "discord";
    }

    if ((host === "t.me" || host === "telegram.me") && path) {
      return "telegram";
    }

    return null;
  } catch {
    return null;
  }
}

function filterPublicSocials(profile: ProfileRecord): string[] {
  return profile.socials.filter((social) => {
    const key = getSocialVisibilityKey(social);

    if (!key) {
      return false;
    }

    return isPublicField(profile, key);
  });
}

function getSanitizedPublicContactMode(profile: ProfileRecord): ContactMode {
  if (isPublicField(profile, "email") && profile.publicEmail) {
    return "PUBLIC_CONTACT_ALLOWED";
  }

  const currentMode = getPublicContactMode(profile);

  if (currentMode === "PRIVATE_CONTACT_AVAILABLE") {
    return "PRIVATE_CONTACT_AVAILABLE";
  }

  if (profile.encryptedHiddenPayload) {
    return "PRIVATE_CONTACT_AVAILABLE";
  }

  return "NO_CONTACT";
}

function toPublicProfile(profile: ProfileRecord) {
  return {
    publicId: profile.publicId,
    slug: profile.slug,
    displayName: isPublicField(profile, "displayName")
      ? profile.displayName
      : null,
    region: isPublicField(profile, "region") ? profile.region : null,
    country: isPublicField(profile, "country") ? profile.country : null,
    role: isPublicField(profile, "role") ? profile.role : null,
    bio: isPublicField(profile, "bio") ? profile.bio : null,
    avatarUrl: isPublicField(profile, "avatarUrl") ? profile.avatarUrl : null,
    websiteUrl: isPublicField(profile, "websiteUrl")
      ? profile.websiteUrl
      : null,
    nightDomain: isPublicField(profile, "nightDomain")
      ? profile.nightDomain
      : null,
    publicEmail: isPublicField(profile, "email") ? profile.publicEmail : null,
    contactMode: getSanitizedPublicContactMode(profile),
    socials: filterPublicSocials(profile),
    requestedVisibility: profile.requestedVisibility,
    publishState: profile.publishState,
  };
}

function getPublishedDirectoryProfiles() {
  return Array.from(profilesByVerificationRequestId.values())
    .filter(
      (profile) =>
        profile.publishState === "published" &&
        profile.requestedVisibility === "public",
    )
    .map(toPublicProfile);
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