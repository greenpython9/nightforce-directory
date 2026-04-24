import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../hooks/useWallet";
import { getConnectedMidnightApi } from "../services/walletService";
import { ProfileCard } from "../components/ProfileCard";
import type { ContactMode, ProfileVisibility, PublicProfile } from "../types";

const API_BASE_URL = "http://127.0.0.1:8787";
const AVATAR_MAX_BYTES = 500 * 1024;
const AVATAR_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const REGION_OPTIONS = [
  "APAC",
  "EMEA",
  "LATAM",
  "NA",
] as const;

const COUNTRY_OPTIONS = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
] as const;

type WalletBindingResponse = {
  binding: {
    id: string;
    verificationRequestId: string;
    midnightWalletAddress: string;
    boundAt: string;
    isActive: "true" | "false";
    updatedAt: string;
  };
};

type FieldVisibility = {
  avatarUrl: "public" | "hidden";
  displayName: "public" | "hidden";
  region?: "public" | "hidden";
  country: "public" | "hidden";
  role: "public" | "hidden";
  bio: "public" | "hidden";
  websiteUrl: "public" | "hidden";
  email?: "public" | "hidden";
  x?: "public" | "hidden";
  youtube?: "public" | "hidden";
  discord?: "public" | "hidden";
  telegram?: "public" | "hidden";
  realName: "hidden";
  contact: "hidden";
};

type EncryptedHiddenPayload = {
  version: 1;
  algorithm: "AES-GCM";
  kdf: "PBKDF2";
  hash: "SHA-256";
  iterations: number;
  saltBase64: string;
  ivBase64: string;
  ciphertextBase64: string;
};

type HiddenProfilePayload = {
  email: string;
};

type ProfileResponse = {
  profile: {
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
    socials: string[];
    fieldVisibility: FieldVisibility;
    encryptedHiddenPayload: unknown;
    publishState: "draft" | "published" | "inactive";
    requestedVisibility: "public" | "hidden";
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
    inactiveAt: string | null;
  };
};

const HIDDEN_EMAIL_SIGNATURE_CONTEXT = "nightforce:hidden-email:v1";
const HIDDEN_EMAIL_KDF_ITERATIONS = 250_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function isEncryptedHiddenPayload(value: unknown): value is EncryptedHiddenPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<EncryptedHiddenPayload>;

  return (
    payload.version === 1 &&
    payload.algorithm === "AES-GCM" &&
    payload.kdf === "PBKDF2" &&
    payload.hash === "SHA-256" &&
    typeof payload.iterations === "number" &&
    typeof payload.saltBase64 === "string" &&
    typeof payload.ivBase64 === "string" &&
    typeof payload.ciphertextBase64 === "string"
  );
}

function parseEncryptedHiddenPayload(value: unknown): EncryptedHiddenPayload | null {
  if (isEncryptedHiddenPayload(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return isEncryptedHiddenPayload(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

function deriveContactModeForSync(args: {
  publicEmail: string | null;
  encryptedHiddenPayload: EncryptedHiddenPayload | null;
}): ContactMode {
  if (args.publicEmail) {
    return "PUBLIC_CONTACT_ALLOWED";
  }

  if (args.encryptedHiddenPayload) {
    return "PRIVATE_CONTACT_AVAILABLE";
  }

  return "NO_CONTACT";
}

async function updateContactModeSyncMetadata(args: {
  verificationRequestId: string;
  contactModeContractAddress: string | null;
  contactModeSyncStatus: "not_created" | "synced" | "failed";
  contactModeLastSyncedAt: string | null;
  contactModeSyncError: string | null;
  contactModeSyncedValue: ContactMode | null;
}): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/nightforce/profiles/${args.verificationRequestId}/contact-mode-sync`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contactModeContractAddress: args.contactModeContractAddress,
        contactModeSyncStatus: args.contactModeSyncStatus,
        contactModeLastSyncedAt: args.contactModeLastSyncedAt,
        contactModeSyncError: args.contactModeSyncError,
        contactModeSyncedValue: args.contactModeSyncedValue,
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
        : "Failed to update contact-mode sync metadata.";

    throw new Error(message);
  }
}

async function getHiddenEmailSecret(signingScope: string): Promise<string> {
  const midnightApi = getConnectedMidnightApi();

  if (!midnightApi?.signData) {
    throw new Error("Connected Midnight wallet does not support hidden email signing.");
  }

  const signature = await midnightApi.signData(
    `${HIDDEN_EMAIL_SIGNATURE_CONTEXT}:${signingScope}`,
    {
      encoding: "text",
      keyType: "unshielded",
    },
  );

  return signature.signature;
}

async function deriveHiddenEmailKey(
  secret: string,
  salt: ArrayBuffer,
  iterations: number,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(secretBytes),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptHiddenEmail(
  email: string,
  signingScope: string,
): Promise<EncryptedHiddenPayload> {
  const secret = await getHiddenEmailSecret(signingScope);
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveHiddenEmailKey(
    secret,
    toArrayBuffer(salt),
    HIDDEN_EMAIL_KDF_ITERATIONS,
  );

  const hiddenPayload: HiddenProfilePayload = { email };
  const plaintextBytes = encoder.encode(JSON.stringify(hiddenPayload));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(iv),
    },
    key,
    toArrayBuffer(plaintextBytes),
  );

  return {
    version: 1,
    algorithm: "AES-GCM",
    kdf: "PBKDF2",
    hash: "SHA-256",
    iterations: HIDDEN_EMAIL_KDF_ITERATIONS,
    saltBase64: bytesToBase64(salt),
    ivBase64: bytesToBase64(iv),
    ciphertextBase64: bytesToBase64(new Uint8Array(encryptedBuffer)),
  };
}

const DEFAULT_PROFILE_VISIBILITY: ProfileVisibility = "public";

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, "");
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function isValidEmail(value: string): boolean {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function parseSocials(
  socials: string[] | undefined,
): {
  xUsername: string;
  youtubeHandle: string;
  discordUsername: string;
  telegramUsername: string;
} {
  let xUsername = "";
  let youtubeHandle = "";
  let discordUsername = "";
  let telegramUsername = "";

  for (const raw of socials ?? []) {
    const value = raw.trim();
    if (!value) continue;

    if (value.startsWith("https://x.com/")) {
      xUsername = value.replace("https://x.com/", "").trim();
      continue;
    }

    if (value.startsWith("https://youtube.com/@")) {
      youtubeHandle = value.replace("https://youtube.com/@", "").trim();
      continue;
    }

    if (value.startsWith("discord:")) {
      discordUsername = value.replace("discord:", "").trim();
      continue;
    }

    if (value.startsWith("https://t.me/")) {
      telegramUsername = value.replace("https://t.me/", "").trim();
      continue;
    }
  }

  return {
    xUsername,
    youtubeHandle,
    discordUsername,
    telegramUsername,
  };
}

function buildSocialsArray(values: {
  xUsername: string;
  youtubeHandle: string;
  discordUsername: string;
  telegramUsername: string;
}): string[] {
  const socials: string[] = [];

  const xUsername = normalizeUsername(values.xUsername);
  const youtubeHandle = normalizeUsername(values.youtubeHandle);
  const discordUsername = normalizeUsername(values.discordUsername);
  const telegramUsername = normalizeUsername(values.telegramUsername);

  if (xUsername) {
    socials.push(`https://x.com/${xUsername}`);
  }

  if (youtubeHandle) {
    socials.push(`https://youtube.com/@${youtubeHandle}`);
  }

  if (discordUsername) {
    socials.push(`discord:${discordUsername}`);
  }

  if (telegramUsername) {
    socials.push(`https://t.me/${telegramUsername}`);
  }

  return socials;
}

function resolveSocialVisibility(
  value: "public" | "hidden" | undefined,
  fallback: boolean,
): boolean {
  if (value) return value === "public";
  return fallback;
}

function derivePreviewContactMode(input: {
  hasEmailValue: boolean;
  showEmail: boolean;
  hasSavedEncryptedEmail: boolean;
}): ContactMode {
  if (input.showEmail && input.hasEmailValue) {
    return "PUBLIC_CONTACT_ALLOWED";
  }

  if (input.hasEmailValue || input.hasSavedEncryptedEmail) {
    return "PRIVATE_CONTACT_AVAILABLE";
  }

  return "NO_CONTACT";
}

type ProfileEditorFingerprintInput = {
  publicId: string;
  displayName: string;
  region: string;
  country: string;
  role: string;
  bio: string;
  avatarUrl: string;
  websiteUrl: string;
  email: string;
  xUsername: string;
  youtubeHandle: string;
  discordUsername: string;
  telegramUsername: string;
  profileVisibility: ProfileVisibility;
  showAvatarUrl: boolean;
  showDisplayName: boolean;
  showRegion: boolean;
  showCountry: boolean;
  showRole: boolean;
  showBio: boolean;
  showWebsiteUrl: boolean;
  showEmail: boolean;
  showX: boolean;
  showYouTube: boolean;
  showDiscord: boolean;
  showTelegram: boolean;
};

function buildEditorFingerprint(input: ProfileEditorFingerprintInput): string {
  return JSON.stringify({
    publicId: input.publicId.trim(),
    displayName: input.displayName.trim(),
    region: input.region,
    country: input.country,
    role: input.role.trim(),
    bio: input.bio.trim(),
    avatarUrl: input.avatarUrl.trim(),
    websiteUrl: input.websiteUrl.trim(),
    email: input.email.trim(),
    xUsername: normalizeUsername(input.xUsername),
    youtubeHandle: normalizeUsername(input.youtubeHandle),
    discordUsername: normalizeUsername(input.discordUsername),
    telegramUsername: normalizeUsername(input.telegramUsername),
    profileVisibility: input.profileVisibility,
    showAvatarUrl: input.showAvatarUrl,
    showDisplayName: input.showDisplayName,
    showRegion: input.showRegion,
    showCountry: input.showCountry,
    showRole: input.showRole,
    showBio: input.showBio,
    showWebsiteUrl: input.showWebsiteUrl,
    showEmail: input.showEmail,
    showX: input.showX,
    showYouTube: input.showYouTube,
    showDiscord: input.showDiscord,
    showTelegram: input.showTelegram,
  });
}

export function MyProfile() {
  const {
    walletId,
    verificationStatus,
    connectionMode,
    deployContactMode,
    updateContactMode,
    readContactMode,
  } = useWallet();

  const [verificationRequestId, setVerificationRequestId] = useState<string | null>(null);
  const [walletBindingId, setWalletBindingId] = useState<string | null>(null);
  const [publicId, setPublicId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [xUsername, setXUsername] = useState("");
  const [youtubeHandle, setYouTubeHandle] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [profileVisibility, setProfileVisibility] =
    useState<ProfileVisibility>(DEFAULT_PROFILE_VISIBILITY);
  const [showAvatarUrl, setShowAvatarUrl] = useState(true);
  const [showDisplayName, setShowDisplayName] = useState(true);
  const [showRegion, setShowRegion] = useState(true);
  const [showCountry, setShowCountry] = useState(true);
  const [showRole, setShowRole] = useState(true);
  const [showBio, setShowBio] = useState(true);
  const [showWebsiteUrl, setShowWebsiteUrl] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showX, setShowX] = useState(true);
  const [showYouTube, setShowYouTube] = useState(true);
  const [showDiscord, setShowDiscord] = useState(true);
  const [showTelegram, setShowTelegram] = useState(true);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [removingEmail, setRemovingEmail] = useState(false);
  const [lastPublishedFingerprint, setLastPublishedFingerprint] = useState<string | null>(null);
  const [contactModeContractAddress, setContactModeContractAddress] =
    useState<string | null>(null);
  const [savedEncryptedHiddenPayload, setSavedEncryptedHiddenPayload] =
    useState<EncryptedHiddenPayload | null>(null);
  const [hasSavedShieldedEmail, setHasSavedShieldedEmail] = useState(false);
  const [savedContactMode, setSavedContactMode] = useState<ContactMode | null>(null);
  const [contactModeCompareLoading, setContactModeCompareLoading] = useState(false);
  const [contactModeCompareResult, setContactModeCompareResult] = useState<{
    backendMode: ContactMode;
    midnightMode: ContactMode;
    contractAddress: string;
    rawValue: number | string;
    matched: boolean;
    checkedAt: string;
  } | null>(null);
  const [contactModeCompareError, setContactModeCompareError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState("");

  const resetFields = useCallback(() => {
    setPublicId("");
    setDisplayName("");
    setRegion("");
    setCountry("");
    setRole("");
    setBio("");
    setAvatarUrl("");
    setWebsiteUrl("");
    setEmail("");
    setXUsername("");
    setYouTubeHandle("");
    setDiscordUsername("");
    setTelegramUsername("");
    setProfileVisibility(DEFAULT_PROFILE_VISIBILITY);
    setShowAvatarUrl(true);
    setShowDisplayName(true);
    setShowRegion(true);
    setShowCountry(true);
    setShowRole(true);
    setShowBio(true);
    setShowWebsiteUrl(true);
    setShowEmail(false);
    setShowX(true);
    setShowYouTube(true);
    setShowDiscord(true);
    setShowTelegram(true);
    setLastPublishedFingerprint(null);
    setContactModeContractAddress(null);
    setSavedEncryptedHiddenPayload(null);
    setHasSavedShieldedEmail(false);
    setSavedContactMode(null);
    setContactModeCompareResult(null);
    setContactModeCompareError("");
  }, []);

  const load = useCallback(async () => {
    if (!walletId || verificationStatus !== "approved" || connectionMode !== "midnight") {
      setVerificationRequestId(null);
      setWalletBindingId(null);
      return;
    }

    setLoading(true);
    setError("");
    setSaveMsg("");

    try {
      const bindingResponse = await fetch(
        `${API_BASE_URL}/api/nightforce/wallet-bindings/by-wallet/${encodeURIComponent(walletId)}`,
      );

      let bindingPayload: unknown = null;

      try {
        bindingPayload = await bindingResponse.json();
      } catch {
        bindingPayload = null;
      }

      if (bindingResponse.status === 404) {
        setVerificationRequestId(null);
        setWalletBindingId(null);
        resetFields();
        return;
      }

      if (!bindingResponse.ok) {
        const message =
          typeof bindingPayload === "object" &&
          bindingPayload !== null &&
          "error" in bindingPayload &&
          typeof bindingPayload.error === "string"
            ? bindingPayload.error
            : "Failed to load wallet binding.";

        throw new Error(message);
      }

      const bindingData = bindingPayload as WalletBindingResponse;
      const bindingId = bindingData.binding.id;
      const bindingVerificationRequestId = bindingData.binding.verificationRequestId;

      setVerificationRequestId(bindingVerificationRequestId);
      setWalletBindingId(bindingId);

      const profileResponse = await fetch(
        `${API_BASE_URL}/api/nightforce/profiles/${bindingVerificationRequestId}`,
      );

      let profilePayload: unknown = null;

      try {
        profilePayload = await profileResponse.json();
      } catch {
        profilePayload = null;
      }

      if (profileResponse.status === 404) {
        resetFields();
        return;
      }

      if (!profileResponse.ok) {
        const message =
          typeof profilePayload === "object" &&
          profilePayload !== null &&
          "error" in profilePayload &&
          typeof profilePayload.error === "string"
            ? profilePayload.error
            : "Failed to load profile.";

        throw new Error(message);
      }

      const data = profilePayload as ProfileResponse;
      const profile = data.profile;
      const parsedSocials = parseSocials(profile.socials ?? []);

      setContactModeContractAddress(profile.contactModeContractAddress ?? null);

      setPublicId(profile.publicId ?? "");
      setDisplayName(profile.displayName ?? "");
      setRegion(profile.region ?? "");
      setCountry(profile.country ?? "");
      setRole(profile.role ?? "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");
      setWebsiteUrl(profile.websiteUrl ?? "");

      const nextEmail = profile.publicEmail ?? "";
      const nextEncryptedHiddenPayload = parseEncryptedHiddenPayload(
        profile.encryptedHiddenPayload,
      );

      setSavedEncryptedHiddenPayload(nextEncryptedHiddenPayload);
      setHasSavedShieldedEmail(Boolean(nextEncryptedHiddenPayload));
      setSavedContactMode(
        deriveContactModeForSync({
          publicEmail: profile.publicEmail,
          encryptedHiddenPayload: nextEncryptedHiddenPayload,
        }),
      );
      setEmail(nextEmail);

      setXUsername(parsedSocials.xUsername);
      setYouTubeHandle(parsedSocials.youtubeHandle);
      setDiscordUsername(parsedSocials.discordUsername);
      setTelegramUsername(parsedSocials.telegramUsername);

      const nextVisibility: ProfileVisibility =
        profile.requestedVisibility === "hidden"
          ? "hidden"
          : profile.fieldVisibility.displayName === "hidden"
            ? "anonymous"
            : "public";

      const nextShowAvatarUrl = profile.fieldVisibility.avatarUrl === "public";
      const nextShowDisplayName = profile.fieldVisibility.displayName === "public";
      const nextShowRegion = resolveSocialVisibility(profile.fieldVisibility.region, true);
      const nextShowCountry = profile.fieldVisibility.country === "public";
      const nextShowRole = profile.fieldVisibility.role === "public";
      const nextShowBio = profile.fieldVisibility.bio === "public";
      const nextShowWebsiteUrl = profile.fieldVisibility.websiteUrl === "public";
      const nextShowEmail = resolveSocialVisibility(profile.fieldVisibility.email, false);
      const nextShowX = resolveSocialVisibility(profile.fieldVisibility.x, true);
      const nextShowYouTube = resolveSocialVisibility(profile.fieldVisibility.youtube, true);
      const nextShowDiscord = resolveSocialVisibility(profile.fieldVisibility.discord, true);
      const nextShowTelegram = resolveSocialVisibility(profile.fieldVisibility.telegram, true);

      setProfileVisibility(nextVisibility);
      setShowAvatarUrl(nextShowAvatarUrl);
      setShowDisplayName(nextShowDisplayName);
      setShowRegion(nextShowRegion);
      setShowCountry(nextShowCountry);
      setShowRole(nextShowRole);
      setShowBio(nextShowBio);
      setShowWebsiteUrl(nextShowWebsiteUrl);
      setShowEmail(nextShowEmail);
      setShowX(nextShowX);
      setShowYouTube(nextShowYouTube);
      setShowDiscord(nextShowDiscord);
      setShowTelegram(nextShowTelegram);

      setLastPublishedFingerprint(
        buildEditorFingerprint({
          publicId: profile.publicId ?? "",
          displayName: profile.displayName ?? "",
          region: profile.region ?? "",
          country: profile.country ?? "",
          role: profile.role ?? "",
          bio: profile.bio ?? "",
          avatarUrl: profile.avatarUrl ?? "",
          websiteUrl: profile.websiteUrl ?? "",
          email: nextEmail,
          xUsername: parsedSocials.xUsername,
          youtubeHandle: parsedSocials.youtubeHandle,
          discordUsername: parsedSocials.discordUsername,
          telegramUsername: parsedSocials.telegramUsername,
          profileVisibility: nextVisibility,
          showAvatarUrl: nextShowAvatarUrl,
          showDisplayName: nextShowDisplayName,
          showRegion: nextShowRegion,
          showCountry: nextShowCountry,
          showRole: nextShowRole,
          showBio: nextShowBio,
          showWebsiteUrl: nextShowWebsiteUrl,
          showEmail: nextShowEmail,
          showX: nextShowX,
          showYouTube: nextShowYouTube,
          showDiscord: nextShowDiscord,
          showTelegram: nextShowTelegram,
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [walletId, verificationStatus, connectionMode, resetFields]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasPublicId = hasText(publicId);
  const hasAvatarUrlValue = hasText(avatarUrl);
  const hasDisplayNameValue = hasText(displayName);
  const hasRegionValue = hasText(region);
  const hasCountryValue = hasText(country);
  const hasRoleValue = hasText(role);
  const hasBioValue = hasText(bio);
  const hasWebsiteUrlValue = hasText(websiteUrl);
  const hasEmailValue = hasText(email);
  const emailIsValid = isValidEmail(email);
  const hasXValue = hasText(xUsername);
  const hasYouTubeValue = hasText(youtubeHandle);
  const hasDiscordValue = hasText(discordUsername);
  const hasTelegramValue = hasText(telegramUsername);

  const missingRequiredFields = [
    !hasPublicId ? "Public ID" : null,
    !hasDisplayNameValue ? "Display Name" : null,
    !hasCountryValue ? "Country" : null,
  ].filter((value): value is string => value !== null);

  const currentEditorFingerprint = buildEditorFingerprint({
    publicId,
    displayName,
    region,
    country,
    role,
    bio,
    avatarUrl,
    websiteUrl,
    email,
    xUsername,
    youtubeHandle,
    discordUsername,
    telegramUsername,
    profileVisibility,
    showAvatarUrl,
    showDisplayName,
    showRegion,
    showCountry,
    showRole,
    showBio,
    showWebsiteUrl,
    showEmail,
    showX,
    showYouTube,
    showDiscord,
    showTelegram,
  });

  const hasChangesToPublish = currentEditorFingerprint !== lastPublishedFingerprint;

  const canPublish =
    !loading &&
    !avatarUploading &&
    !publishing &&
    !removingEmail &&
    !!verificationRequestId &&
    !!walletBindingId &&
    missingRequiredFields.length === 0 &&
    emailIsValid &&
    hasChangesToPublish;

  const uploadAvatarFile = async (file: File) => {
    if (!AVATAR_ALLOWED_TYPES.has(file.type)) {
      setError("Invalid avatar file type. Accepted types: JPG, PNG, WebP.");
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setError("Avatar file is too large. Maximum size is 500 KB.");
      return;
    }

    setError("");
    setSaveMsg("");
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/nightforce/uploads/avatar`, {
        method: "POST",
        body: formData,
      });

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
            : "Failed to upload avatar.";

        throw new Error(message);
      }

      const data = payload as { avatarUrl: string };
      setAvatarUrl(data.avatarUrl);
      setShowAvatarUrl(true);
      setSaveMsg("Avatar uploaded.");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload avatar.",
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const compareContactModeSync = async () => {
    if (contactModeCompareLoading) {
      return;
    }

    if (!verificationRequestId) {
      setContactModeCompareError("No verification request was found.");
      return;
    }

    setContactModeCompareLoading(true);
    setContactModeCompareError("");
    setContactModeCompareResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/nightforce/profiles/${verificationRequestId}`,
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
            : "Failed to load profile for Contact Mode comparison.";

        throw new Error(message);
      }

      const data = payload as ProfileResponse;
      const contractAddress = data.profile.contactModeContractAddress;

      if (!contractAddress) {
        throw new Error("No Contact Mode contract address is stored for this profile.");
      }

      const backendMode = deriveContactModeForSync({
        publicEmail: data.profile.publicEmail,
        encryptedHiddenPayload: parseEncryptedHiddenPayload(
          data.profile.encryptedHiddenPayload,
        ),
      });

      const midnightResult = await readContactMode(contractAddress);
      const checkedAt = new Date().toISOString();

      setContactModeCompareResult({
        backendMode,
        midnightMode: midnightResult.contactMode,
        contractAddress: midnightResult.contractAddress,
        rawValue: midnightResult.rawValue,
        matched: backendMode === midnightResult.contactMode,
        checkedAt,
      });
    } catch (err) {
      setContactModeCompareError(
        err instanceof Error
          ? err.message
          : "Failed to compare Contact Mode sync.",
      );
    } finally {
      setContactModeCompareLoading(false);
    }
  };

  const removeSavedEmail = async () => {
    if (removingEmail) {
      return;
    }

    if (!verificationRequestId || !walletBindingId) {
      setError("No wallet binding was found for this wallet.");
      return;
    }

    if (!hasSavedShieldedEmail) {
      setError("No saved private email was found for this profile.");
      return;
    }

    setError("");
    setSaveMsg("Removing saved private email...");
    setRemovingEmail(true);

    const requestedVisibility = profileVisibility === "hidden" ? "hidden" : "public";

    const fieldVisibility = {
      avatarUrl: showAvatarUrl && hasAvatarUrlValue ? "public" as const : "hidden" as const,
      displayName:
        profileVisibility === "anonymous" || !showDisplayName || !hasDisplayNameValue
          ? "hidden"
          : "public",
      region: showRegion && hasRegionValue ? "public" as const : "hidden" as const,
      country: showCountry && hasCountryValue ? "public" : "hidden",
      role: showRole && hasRoleValue ? "public" : "hidden",
      bio: showBio && hasBioValue ? "public" : "hidden",
      websiteUrl: showWebsiteUrl && hasWebsiteUrlValue ? "public" as const : "hidden" as const,
      email: "hidden" as const,
      x: showX && hasXValue ? "public" as const : "hidden" as const,
      youtube: showYouTube && hasYouTubeValue ? "public" as const : "hidden" as const,
      discord: showDiscord && hasDiscordValue ? "public" as const : "hidden" as const,
      telegram: showTelegram && hasTelegramValue ? "public" as const : "hidden" as const,
      realName: "hidden" as const,
      contact: "hidden" as const,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/nightforce/profiles/${verificationRequestId}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            walletBindingId,
            publicId: publicId.trim() || undefined,
            slug: publicId.trim() || null,
            displayName: displayName.trim() || null,
            region: region || null,
            country: country || null,
            role: role.trim() || null,
            bio: bio.trim() || null,
            avatarUrl: avatarUrl.trim() || null,
            websiteUrl: websiteUrl.trim() || null,
            publicEmail: null,
            socials: buildSocialsArray({
              xUsername,
              youtubeHandle,
              discordUsername,
              telegramUsername,
            }),
            fieldVisibility,
            encryptedHiddenPayload: null,
            requestedVisibility,
            publishState: "published",
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
            : "Failed to remove saved private email.";

        throw new Error(message);
      }

      const data = payload as ProfileResponse;
      const existingContactModeAddress =
        data.profile.contactModeContractAddress ?? contactModeContractAddress ?? null;
      const nextMode: ContactMode = "NO_CONTACT";

      let syncPending = false;

      if (existingContactModeAddress && savedContactMode !== nextMode) {
        try {
          const updateResult = await updateContactMode(
            existingContactModeAddress,
            nextMode,
          );
          const syncedAt = new Date().toISOString();

          await updateContactModeSyncMetadata({
            verificationRequestId,
            contactModeContractAddress: updateResult.contractAddress,
            contactModeSyncStatus: "synced",
            contactModeLastSyncedAt: syncedAt,
            contactModeSyncError: null,
            contactModeSyncedValue: nextMode,
          });

          setContactModeContractAddress(updateResult.contractAddress);
          setSavedContactMode(nextMode);
        } catch (syncError) {
          const syncMessage =
            syncError instanceof Error
              ? syncError.message
              : "Failed to update contact-mode contract.";

          syncPending = true;

          try {
            await updateContactModeSyncMetadata({
              verificationRequestId,
              contactModeContractAddress: existingContactModeAddress,
              contactModeSyncStatus: "failed",
              contactModeLastSyncedAt:
                data.profile.contactModeLastSyncedAt ?? null,
              contactModeSyncError: syncMessage,
              contactModeSyncedValue: null,
            });
          } catch {
            // Keep backend removal success even if sync metadata update also fails.
          }

          setContactModeContractAddress(existingContactModeAddress);
        }
      } else {
        setSavedContactMode(nextMode);
      }

      setEmail("");
      setShowEmail(false);
      setSavedEncryptedHiddenPayload(null);
      setHasSavedShieldedEmail(false);
      setLastPublishedFingerprint(
        buildEditorFingerprint({
          publicId,
          displayName,
          region,
          country,
          role,
          bio,
          avatarUrl,
          websiteUrl,
          email: "",
          xUsername,
          youtubeHandle,
          discordUsername,
          telegramUsername,
          profileVisibility,
          showAvatarUrl,
          showDisplayName,
          showRegion,
          showCountry,
          showRole,
          showBio,
          showWebsiteUrl,
          showEmail: false,
          showX,
          showYouTube,
          showDiscord,
          showTelegram,
        }),
      );
      setSaveMsg(
        syncPending
          ? "Saved private email removed. Contact-mode sync pending."
          : "Saved private email removed.",
      );
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove saved private email.",
      );
      setSaveMsg("");
    } finally {
      setRemovingEmail(false);
    }
  };


  if (!walletId) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-900">
          <p className="text-zinc-400 font-mono text-sm">
            Connect a wallet to view your profile.
          </p>
        </div>
      </div>
    );
  }

  if (verificationStatus !== "approved") {
    const messages: Record<string, string> = {
      not_verified: "You have not submitted a verification request yet.",
      pending: "Your verification request is pending admin review.",
      rejected: "Your verification request was rejected.",
    };

    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-900">
          <div className="text-zinc-300 font-mono font-semibold text-sm mb-2">
            Profile Locked
          </div>
          <p className="text-zinc-400 font-mono text-sm mb-4">
            {messages[verificationStatus] ?? "Verification required."}
          </p>
          <a
            href="/request-verification"
            className="inline-block text-xs font-mono text-zinc-400 border border-zinc-700 px-3 py-1.5 rounded hover:text-white transition-colors"
          >
            Request Verification
          </a>
        </div>
      </div>
    );
  }

  if (connectionMode !== "midnight") {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-900">
          <div className="text-zinc-300 font-mono font-semibold text-sm mb-2">
            Midnight Wallet Required
          </div>
          <p className="text-zinc-400 font-mono text-sm">
            Your profile is now backend-driven. Connect your Midnight wallet to load your bound
            profile data.
          </p>
        </div>
      </div>
    );
  }

  const publishChanges = async () => {
    if (publishing) {
      return;
    }

    if (!verificationRequestId || !walletBindingId) {
      setError("No wallet binding was found for this wallet.");
      return;
    }

    if (!hasChangesToPublish) {
      setError("");
      setSaveMsg("No changes to publish.");
      setTimeout(() => setSaveMsg(""), 2000);
      return;
    }

    if (missingRequiredFields.length > 0) {
      setError(`Please fill in all required fields: ${missingRequiredFields.join(", ")}`);
      return;
    }

    if (!emailIsValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!walletId) {
      setError("Midnight wallet is not connected.");
      return;
    }

    setError("");
    setSaveMsg("Waiting for wallet approval...");
    setPublishing(true);

    const requestedVisibility = profileVisibility === "hidden" ? "hidden" : "public";

    const fieldVisibility = {
      avatarUrl: showAvatarUrl && hasAvatarUrlValue ? "public" as const : "hidden" as const,
      displayName:
        profileVisibility === "anonymous" || !showDisplayName || !hasDisplayNameValue
          ? "hidden"
          : "public",
      region: showRegion && hasRegionValue ? "public" as const : "hidden" as const,
      country: showCountry && hasCountryValue ? "public" : "hidden",
      role: showRole && hasRoleValue ? "public" : "hidden",
      bio: showBio && hasBioValue ? "public" : "hidden",
      websiteUrl: showWebsiteUrl && hasWebsiteUrlValue ? "public" as const : "hidden" as const,
      email: showEmail && hasEmailValue ? "public" as const : "hidden" as const,
      x: showX && hasXValue ? "public" as const : "hidden" as const,
      youtube: showYouTube && hasYouTubeValue ? "public" as const : "hidden" as const,
      discord: showDiscord && hasDiscordValue ? "public" as const : "hidden" as const,
      telegram: showTelegram && hasTelegramValue ? "public" as const : "hidden" as const,
      realName: "hidden" as const,
      contact: "hidden" as const,
    };

    try {
      const trimmedEmail = email.trim();
      const encryptedHiddenPayload = hasEmailValue
        ? await encryptHiddenEmail(trimmedEmail, verificationRequestId)
        : savedEncryptedHiddenPayload;

      const response = await fetch(
        `${API_BASE_URL}/api/nightforce/profiles/${verificationRequestId}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            walletBindingId,
            publicId: publicId.trim() || undefined,
            slug: publicId.trim() || null,
            displayName: displayName.trim() || null,
            region: region || null,
            country: country || null,
            role: role.trim() || null,
            bio: bio.trim() || null,
            avatarUrl: avatarUrl.trim() || null,
            websiteUrl: websiteUrl.trim() || null,
            publicEmail: showEmail && hasEmailValue ? trimmedEmail : null,
            socials: buildSocialsArray({
              xUsername,
              youtubeHandle,
              discordUsername,
              telegramUsername,
            }),
            fieldVisibility,
            encryptedHiddenPayload,
            requestedVisibility,
            publishState: "published",
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
            : "Failed to publish profile.";

        throw new Error(message);
      }

      const data = payload as ProfileResponse;
      const nextSavedPublicEmail = showEmail && hasEmailValue ? trimmedEmail : null;
      const nextSavedEncryptedHiddenPayload = encryptedHiddenPayload ?? null;
      const existingContactModeAddress =
        data.profile.contactModeContractAddress ?? contactModeContractAddress ?? null;

      setPublicId(data.profile.publicId ?? "");
      setSavedEncryptedHiddenPayload(nextSavedEncryptedHiddenPayload);
      setHasSavedShieldedEmail(Boolean(nextSavedEncryptedHiddenPayload));
      setLastPublishedFingerprint(currentEditorFingerprint);

      if (existingContactModeAddress) {
        const nextMode = deriveContactModeForSync({
          publicEmail: nextSavedPublicEmail,
          encryptedHiddenPayload: nextSavedEncryptedHiddenPayload,
        });

        const previousMode =
          savedContactMode ??
          deriveContactModeForSync({
            publicEmail: data.profile.publicEmail,
            encryptedHiddenPayload: parseEncryptedHiddenPayload(
              data.profile.encryptedHiddenPayload,
            ),
          });

        if (previousMode === nextMode) {
          setContactModeContractAddress(existingContactModeAddress);
          setSavedContactMode(nextMode);
          setSaveMsg("Changes published.");
          setTimeout(() => setSaveMsg(""), 2500);
          return;
        }

        try {
          const updateResult = await updateContactMode(
            existingContactModeAddress,
            nextMode,
          );
          const syncedAt = new Date().toISOString();

          await updateContactModeSyncMetadata({
            verificationRequestId,
            contactModeContractAddress: updateResult.contractAddress,
            contactModeSyncStatus: "synced",
            contactModeLastSyncedAt: syncedAt,
            contactModeSyncError: null,
            contactModeSyncedValue: nextMode,
          });

          setContactModeContractAddress(updateResult.contractAddress);
          setSavedContactMode(nextMode);
          setSaveMsg("Changes published.");
        } catch (syncError) {
          const syncMessage =
            syncError instanceof Error
              ? syncError.message
              : "Failed to update contact-mode contract.";

          try {
            await updateContactModeSyncMetadata({
              verificationRequestId,
              contactModeContractAddress: existingContactModeAddress,
              contactModeSyncStatus: "failed",
              contactModeLastSyncedAt:
                data.profile.contactModeLastSyncedAt ?? null,
              contactModeSyncError: syncMessage,
              contactModeSyncedValue: null,
            });
          } catch {
            // Keep backend publish success even if sync metadata update also fails.
          }

          setContactModeContractAddress(existingContactModeAddress);
          setSaveMsg("Changes published. Contact-mode sync pending.");
        }

        setTimeout(() => setSaveMsg(""), 2500);
        return;
      }

      try {
        const initialMode = deriveContactModeForSync({
          publicEmail: nextSavedPublicEmail,
          encryptedHiddenPayload: nextSavedEncryptedHiddenPayload,
        });

        const deployResult = await deployContactMode(initialMode);

        await updateContactModeSyncMetadata({
          verificationRequestId,
          contactModeContractAddress: deployResult.contractAddress,
          contactModeSyncStatus: "synced",
          contactModeLastSyncedAt: new Date().toISOString(),
          contactModeSyncError: null,
          contactModeSyncedValue: initialMode,
        });

        setContactModeContractAddress(deployResult.contractAddress);
        setSavedContactMode(initialMode);
        setSaveMsg("Changes published.");
      } catch (syncError) {
        const syncMessage =
          syncError instanceof Error
            ? syncError.message
            : "Failed to deploy contact-mode contract.";

        try {
          await updateContactModeSyncMetadata({
            verificationRequestId,
            contactModeContractAddress: null,
            contactModeSyncStatus: "failed",
            contactModeLastSyncedAt: null,
            contactModeSyncError: syncMessage,
            contactModeSyncedValue: null,
          });
        } catch {
          // Keep backend publish success even if sync metadata update also fails.
        }

        setContactModeContractAddress(null);
        setSaveMsg("Changes published. Contact-mode sync pending.");
      }

      setTimeout(() => setSaveMsg(""), 2500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to publish profile.";

      if (message.includes("Duplicate request")) {
        setError(
          "A wallet approval request is already pending. Please finish the open 1AM wallet prompt, then try again once.",
        );
      } else {
        setError(message);
      }

      setSaveMsg("");
    } finally {
      setPublishing(false);
    }
  };

  const livePublic: PublicProfile | null =
    profileVisibility === "hidden"
      ? null
      : {
          publicId: publicId || "preview-public-id",
          walletId,
          visibility: profileVisibility === "anonymous" ? "anonymous" : "public",
          displayName:
          profileVisibility === "anonymous" || !showDisplayName || !hasDisplayNameValue
            ? null
            : displayName || null,
        region: showRegion && hasRegionValue ? region || null : null,
        country: showCountry && hasCountryValue ? country || null : null,
        role: showRole && hasRoleValue ? role || null : null,
        bio: showBio && hasBioValue ? bio || null : null,
        avatarUrl: showAvatarUrl && hasAvatarUrlValue ? avatarUrl || null : null,
        websiteUrl: showWebsiteUrl && hasWebsiteUrlValue ? websiteUrl || null : null,
        publicEmail: showEmail && hasEmailValue ? email || null : null,
        contactMode: derivePreviewContactMode({
          hasEmailValue,
          showEmail,
          hasSavedEncryptedEmail: hasSavedShieldedEmail,
        }),
        socials: buildSocialsArray({
          xUsername: showX && hasXValue ? xUsername : "",
          youtubeHandle: showYouTube && hasYouTubeValue ? youtubeHandle : "",
          discordUsername: showDiscord && hasDiscordValue ? discordUsername : "",
          telegramUsername: showTelegram && hasTelegramValue ? telegramUsername : "",
        }),
        isVerified: true,
        };

  const visibilitySummaryItems = [
    {
      label: "Directory",
      visible: profileVisibility !== "hidden",
    },
    {
      label: "Public Profile Page",
      visible: profileVisibility !== "hidden",
    },
    {
      label: "Homepage Card",
      visible: profileVisibility !== "hidden",
      note: "(not built yet)",
    },
    {
      label: "Map Presence",
      visible: profileVisibility !== "hidden",
      note: "(not built yet)",
    },
  ];

  const disclosureFields = [
    {
      label: "Show avatar",
      value: showAvatarUrl,
      set: setShowAvatarUrl,
      disabled: !hasAvatarUrlValue,
    },
    {
      label: "Show display name",
      value: showDisplayName,
      set: setShowDisplayName,
      disabled: !hasDisplayNameValue,
    },
    {
      label: "Show region",
      value: showRegion,
      set: setShowRegion,
      disabled: !hasRegionValue,
    },
    {
      label: "Show country",
      value: showCountry,
      set: setShowCountry,
      disabled: !hasCountryValue,
    },
    {
      label: "Show role / focus",
      value: showRole,
      set: setShowRole,
      disabled: !hasRoleValue,
    },
    {
      label: "Show short bio",
      value: showBio,
      set: setShowBio,
      disabled: !hasBioValue,
    },
    {
      label: "Show website URL",
      value: showWebsiteUrl,
      set: setShowWebsiteUrl,
      disabled: !hasWebsiteUrlValue,
    },
    {
      label: "Show email publicly",
      value: showEmail,
      set: setShowEmail,
      disabled: !hasEmailValue,
    },
    {
      label: "Show X",
      value: showX,
      set: setShowX,
      disabled: !hasXValue,
    },
    {
      label: "Show YouTube",
      value: showYouTube,
      set: setShowYouTube,
      disabled: !hasYouTubeValue,
    },
    {
      label: "Show Discord",
      value: showDiscord,
      set: setShowDiscord,
      disabled: !hasDiscordValue,
    },
    {
      label: "Show Telegram",
      value: showTelegram,
      set: setShowTelegram,
      disabled: !hasTelegramValue,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-xl font-mono font-bold text-white mb-6">My Profile</h1>

      {error && (
        <div className="mb-4 text-xs font-mono text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <div className="text-xs font-mono text-zinc-500 mb-1">Connected Wallet</div>
            <div className="font-mono text-white text-sm break-all">{walletId}</div>
            <div className="mt-2 text-xs font-mono text-emerald-400">
              ✓ Verified Ambassador
            </div>
          </div>

          <div className="border border-cyan-900 rounded-lg p-4 bg-cyan-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-cyan-300 mb-1">
                  Temporary Contact Mode Sync Check
                </div>
                <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                  Testing-only debug check. Public UI still uses backend-derived Contact Mode.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void compareContactModeSync()}
                disabled={contactModeCompareLoading || !contactModeContractAddress}
                className="shrink-0 font-mono text-[11px] bg-cyan-950/60 hover:bg-cyan-950 text-cyan-200 border border-cyan-800 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {contactModeCompareLoading ? "Checking..." : "Compare"}
              </button>
            </div>

            {contactModeCompareError && (
              <div className="mt-3 text-[11px] font-mono text-red-300">
                {contactModeCompareError}
              </div>
            )}

            {contactModeCompareResult && (
              <div className="mt-3 grid gap-1 text-[11px] font-mono text-zinc-400">
                <div>
                  Backend-derived:{" "}
                  <span className="text-white">
                    {contactModeCompareResult.backendMode}
                  </span>
                </div>
                <div>
                  Midnight contract:{" "}
                  <span className="text-white">
                    {contactModeCompareResult.midnightMode}
                  </span>
                  <span className="text-zinc-600">
                    {" "}
                    raw {String(contactModeCompareResult.rawValue)}
                  </span>
                </div>
                <div>
                  Match:{" "}
                  <span
                    className={
                      contactModeCompareResult.matched
                        ? "text-emerald-300"
                        : "text-red-300"
                    }
                  >
                    {contactModeCompareResult.matched ? "yes" : "no"}
                  </span>
                </div>
                <div className="text-zinc-600 break-all">
                  Contract: {contactModeCompareResult.contractAddress}
                </div>
                <div className="text-zinc-600">
                  Checked: {contactModeCompareResult.checkedAt}
                </div>
              </div>
            )}
          </div>

          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <h2 className="text-sm font-mono font-semibold text-white mb-4">
              Profile Details
            </h2>

            {loading ? (
              <div className="text-xs font-mono text-zinc-500">
                Loading profile...
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/40">
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Avatar
                  </label>
                  <p className="text-[11px] font-mono text-zinc-600 mb-3 leading-relaxed">
                    You can paste an image URL or upload from device. Recommended image:
                    512×512 square. Max file size: 500 KB. Accepted types: JPG, PNG, WebP.
                  </p>

                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                    />

                    <div className="border border-dashed border-zinc-700 rounded-lg p-3 bg-zinc-950">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          if (file) {
                            void uploadAvatarFile(file);
                            e.currentTarget.value = "";
                          }
                        }}
                        className="block w-full text-xs font-mono text-zinc-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:font-mono file:text-white hover:file:bg-zinc-700"
                      />
                      <div className="mt-2 text-[11px] font-mono text-zinc-600">
                        {avatarUploading ? "Uploading avatar..." : "Upload from device"}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Public ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={publicId}
                    onChange={(e) => setPublicId(e.target.value)}
                    placeholder="e.g. casper-test-profile"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your public display name"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Region
                    <span
                      title="APAC = Asia Pacific | EMEA = Europe, Middle East, and Africa | LATAM = Latin America | NA = North America"
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full border border-zinc-700 text-[10px] text-zinc-400 cursor-help align-middle"
                    >
                      i
                    </span>
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                  >
                    <option value="">Select region</option>
                    {REGION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Role / Focus
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Community Builder"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Short Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief description of your ambassador work..."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>


                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none ${
                      emailIsValid
                        ? "border-zinc-700 focus:border-zinc-500"
                        : "border-red-800 focus:border-red-600"
                    }`}
                  />
                  {hasSavedShieldedEmail && !hasEmailValue && (
                    <div className="mt-2">
                      <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                        An encrypted email is already saved privately. Leave this field blank to keep
                        your current private email unchanged, or enter a new email here to replace it.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Remove the saved private email from this profile completely?",
                          );

                          if (confirmed) {
                            void removeSavedEmail();
                          }
                        }}
                        disabled={removingEmail || publishing || loading}
                        className="mt-2 inline-flex items-center rounded border border-red-900 px-3 py-1.5 text-[11px] font-mono text-red-300 hover:text-red-200 hover:border-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {removingEmail ? "Removing private email..." : "Remove saved private email"}
                      </button>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] font-mono text-zinc-600 leading-relaxed">
                    Email is stored in encrypted form by default for privacy. This field is meant
                    for replacing your private email or choosing to make an email public. To show
                    an email publicly, enter it here first, then turn on
                    <span className="text-zinc-400"> Show email publicly</span> in Field Disclosure below.
                  </p>
                  {!emailIsValid && (
                    <p className="mt-2 text-[11px] font-mono text-red-400">
                      Please enter a valid email address.
                    </p>
                  )}
                </div>      


                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    X Username
                  </label>
                  <input
                    type="text"
                    value={xUsername}
                    onChange={(e) => setXUsername(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    YouTube Handle
                  </label>
                  <input
                    type="text"
                    value={youtubeHandle}
                    onChange={(e) => setYouTubeHandle(e.target.value)}
                    placeholder="@yourchannel"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Discord Username
                  </label>
                  <input
                    type="text"
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    placeholder="yourname"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Telegram Username
                  </label>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="@yourname"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <h2 className="text-sm font-mono font-semibold text-white mb-4">
              Field Disclosure
            </h2>

            <div className="flex flex-col gap-2">
              {disclosureFields.map((field) => {
                const effectiveValue = !field.disabled && field.value;

                return (
                  <label
                    key={field.label}
                    className={`flex items-center justify-between p-2.5 border rounded-lg transition-colors ${
                      field.disabled
                        ? "border-zinc-900 bg-zinc-950/40 cursor-not-allowed"
                        : "border-zinc-800 cursor-pointer hover:border-zinc-700"
                    }`}
                  >
                    <span
                      className={`text-sm font-mono ${
                        field.disabled ? "text-zinc-600" : "text-zinc-300"
                      }`}
                    >
                      {field.label}
                    </span>
                    <div
                      onClick={() => {
                        if (!field.disabled) {
                          field.set(!field.value);
                        }
                      }}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        field.disabled
                          ? "bg-zinc-800 cursor-not-allowed"
                          : effectiveValue
                            ? "bg-emerald-600 cursor-pointer"
                            : "bg-zinc-700 cursor-pointer"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          effectiveValue ? "translate-x-5" : "translate-x-0"
                        } ${field.disabled ? "opacity-60" : ""}`}
                      />
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-3 text-[11px] font-mono text-zinc-600">
              Empty fields are automatically hidden until you fill them in. For email, the public
              toggle becomes available only when an email is entered in the field above.
            </div>
          </div>

          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <h2 className="text-sm font-mono font-semibold text-white mb-4">
              Profile Visibility
            </h2>

            <div className="flex flex-col gap-2 mb-5">
              {(
                [
                  {
                    value: "public",
                    label: "Public profile",
                    desc: "Name and disclosed fields are visible",
                  },
                  {
                    value: "anonymous",
                    label: "Anonymous public profile",
                    desc: "Profile appears but display name is hidden",
                  },
                  {
                    value: "hidden",
                    label: "Hidden from public pages",
                    desc: "Profile does not appear anywhere publicly",
                  },
                ] as {
                  value: ProfileVisibility;
                  label: string;
                  desc: string;
                }[]
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    profileVisibility === opt.value
                      ? "border-zinc-500 bg-zinc-800"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={opt.value}
                    checked={profileVisibility === opt.value}
                    onChange={() => setProfileVisibility(opt.value)}
                    className="mt-0.5 accent-white"
                  />
                  <div>
                    <div className="text-sm font-mono text-white">{opt.label}</div>
                    <div className="text-xs font-mono text-zinc-500 mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <h2 className="text-sm font-mono font-semibold text-white mb-4">
              Visibility Summary
            </h2>
            <div className="flex flex-col gap-2">
              {visibilitySummaryItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-xs font-mono"
                >
                  <span className="text-zinc-400">
                    {item.label}
                    {item.note && <span className="text-zinc-600 ml-1">{item.note}</span>}
                  </span>
                  <span className={item.visible ? "text-emerald-400" : "text-zinc-600"}>
                    {item.visible ? "Visible" : "Hidden"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {missingRequiredFields.length > 0 && (
            <div className="border border-amber-900 rounded-lg p-4 bg-zinc-900">
              <div className="text-xs font-mono text-amber-300 mb-1">
                Required before publish
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                Fill in: {missingRequiredFields.join(", ")}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => void publishChanges()}
              disabled={!canPublish}
              className="font-mono text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : publishing ? "Waiting for wallet..." : "Publish Changes"}
            </button>
            {saveMsg && (
              <span className="text-xs font-mono text-emerald-400">
                {saveMsg}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <h2 className="text-sm font-mono font-semibold text-white mb-4">
              Live Public Preview
            </h2>
            {livePublic && livePublic.visibility !== "hidden" ? (
              <ProfileCard profile={livePublic} />
            ) : (
              <div className="border border-zinc-800 rounded-lg p-4 text-center">
                <div className="text-xs font-mono text-zinc-600">
                  Profile is hidden from public pages
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}