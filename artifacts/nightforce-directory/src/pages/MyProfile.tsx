import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "../hooks/useWallet";
import { getConnectedMidnightApi, NIGHTFORCE_APP_MODE } from "../services/walletService";
import { ProfileCard } from "../components/ProfileCard";
import type { ContactMode, ProfileVisibility, PublicProfile } from "../types";
import { buildNightforceApiUrl } from "../lib/nightforceApi";

const AVATAR_MAX_BYTES = 500 * 1024;
const AVATAR_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const PROFILE_LINK_MIN_LENGTH = 3;
const PROFILE_LINK_MAX_LENGTH = 32;
const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 40;
const BIO_MAX_LENGTH = 280;
const NIGHT_DOMAIN_MAX_LENGTH = 253;
const NIGHT_DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const PUBLIC_SITE_ORIGIN = "https://nightforce.cc";

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
  nightDomain?: "public" | "hidden";
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

type PublishNotice = {
  id: number;
  kind: "success" | "error" | "pending";
  title: string;
  message: string;
} | null;

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
    nightDomain: string | null;
    publicEmail: string | null;
    contactModeContractAddress: string | null;
    contactModeSyncStatus: "not_created" | "synced" | "failed";
    contactModeLastSyncedAt: string | null;
    contactModeSyncError: string | null;
    contactModeSyncedValue: ContactMode | null;
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
    buildNightforceApiUrl(
      `/api/nightforce/profiles/${args.verificationRequestId}/contact-mode-sync`,
    ),
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
const PROFILE_PREVIEW_PUBLIC_ID = "__nightforce_preview__";
const PROFILE_PREVIEW_STORAGE_KEY = "nightforce:public-profile-preview:v1";

function writeFullProfilePreviewToStorage(profile: PublicProfile | null): void {
  if (!profile) {
    window.localStorage.removeItem(PROFILE_PREVIEW_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    PROFILE_PREVIEW_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      profile,
    }),
  );
}

const PROFILE_WRITE_SETTLE_MS = 900;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

type SocialPlatform = "x" | "youtube" | "discord" | "telegram";

function normalizeSocialUrlInput(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function parseHttpUrl(value: string): URL | null {
  const normalized = normalizeSocialUrlInput(value);

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function getNormalizedHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

function isAllowedSocialUrl(value: string, platform: SocialPlatform): boolean {
  const url = parseHttpUrl(value);

  if (!url) {
    return false;
  }

  const host = getNormalizedHost(url);
  const path = url.pathname.replace(/^\/+/, "");

  if (!path) {
    return false;
  }

  if (platform === "x") {
    return host === "x.com" || host === "twitter.com";
  }

  if (platform === "youtube") {
    return (
      host === "youtube.com" &&
      (path.startsWith("@") ||
        path.startsWith("channel/") ||
        path.startsWith("c/") ||
        path.startsWith("user/"))
    );
  }

  if (platform === "discord") {
    return (
      host === "discord.gg" ||
      (host === "discord.com" && path.startsWith("invite/"))
    );
  }

  if (platform === "telegram") {
    return host === "t.me" || host === "telegram.me";
  }

  return false;
}

function normalizeAllowedSocialUrl(
  value: string,
  platform: SocialPlatform,
): string | null {
  if (!isAllowedSocialUrl(value, platform)) {
    return null;
  }

  return parseHttpUrl(value)?.toString() ?? null;
}

function getSocialPlatform(value: string): SocialPlatform | null {
  if (isAllowedSocialUrl(value, "x")) return "x";
  if (isAllowedSocialUrl(value, "youtube")) return "youtube";
  if (isAllowedSocialUrl(value, "discord")) return "discord";
  if (isAllowedSocialUrl(value, "telegram")) return "telegram";

  return null;
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

    const platform = getSocialPlatform(value);

    if (platform === "x") {
      xUsername = normalizeSocialUrlInput(value);
      continue;
    }

    if (platform === "youtube") {
      youtubeHandle = normalizeSocialUrlInput(value);
      continue;
    }

    if (platform === "discord") {
      discordUsername = normalizeSocialUrlInput(value);
      continue;
    }

    if (platform === "telegram") {
      telegramUsername = normalizeSocialUrlInput(value);
    }
  }

  return {
    xUsername,
    youtubeHandle,
    discordUsername,
    telegramUsername,
  };
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

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

function normalizeNightDomainInput(value: string): string {
  return value.trim().toLowerCase();
}

function isValidNightDomain(value: string): boolean {
  const normalized = normalizeNightDomainInput(value);

  if (!normalized) {
    return true;
  }

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

function getNightDomainValidationMessage(value: string): string | null {
  const normalized = normalizeNightDomainInput(value);

  if (!normalized) {
    return null;
  }

  if (!isValidNightDomain(normalized)) {
    return "Enter a valid .night domain, such as 12345.night.";
  }

  return null;
}

function isValidEmail(value: string): boolean {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function buildSocialsArray(values: {
  xUsername: string;
  youtubeHandle: string;
  discordUsername: string;
  telegramUsername: string;
}): string[] {
  const socials: string[] = [];

  const xUrl = normalizeAllowedSocialUrl(values.xUsername, "x");
  const youtubeUrl = normalizeAllowedSocialUrl(values.youtubeHandle, "youtube");
  const discordUrl = normalizeAllowedSocialUrl(values.discordUsername, "discord");
  const telegramUrl = normalizeAllowedSocialUrl(values.telegramUsername, "telegram");

  if (xUrl) socials.push(xUrl);
  if (youtubeUrl) socials.push(youtubeUrl);
  if (discordUrl) socials.push(discordUrl);
  if (telegramUrl) socials.push(telegramUrl);

  return socials;
}

function resolveSocialVisibility(
  value: "public" | "hidden" | undefined,
  fallback: boolean,
): boolean {
  if (value) return value === "public";
  return fallback;
}

function getReadablePublishError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const maybeEffectError = error as {
      cause?: {
        failure?: {
          message?: unknown;
          _tag?: unknown;
          tokenType?: unknown;
        };
      };
    };

    const nestedMessage = maybeEffectError.cause?.failure?.message;

    if (typeof nestedMessage === "string" && nestedMessage.trim()) {
      return nestedMessage;
    }
  }

  try {
    const serialized = JSON.stringify(error);

    if (serialized && serialized !== "{}") {
      return serialized;
    }
  } catch {
    // Fall back below.
  }

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
  nightDomain: string;
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
  showNightDomain: boolean;
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
    nightDomain: normalizeNightDomainInput(input.nightDomain),
    email: input.email.trim(),
    xUsername: input.xUsername.trim(),
    youtubeHandle: input.youtubeHandle.trim(),
    discordUsername: input.discordUsername.trim(),
    telegramUsername: input.telegramUsername.trim(),
    profileVisibility: input.profileVisibility,
    showAvatarUrl: input.showAvatarUrl,
    showDisplayName: input.showDisplayName,
    showRegion: input.showRegion,
    showCountry: input.showCountry,
    showRole: input.showRole,
    showBio: input.showBio,
    showWebsiteUrl: input.showWebsiteUrl,
    showNightDomain: input.showNightDomain,
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

  const canVerifyContactModeSync = NIGHTFORCE_APP_MODE === "preprod-write";
  const publishInFlightRef = useRef(false);

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
  const [nightDomain, setNightDomain] = useState("");
  const [email, setEmail] = useState("");
  const [savedPublicEmail, setSavedPublicEmail] = useState<string | null>(null);
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
  const [showNightDomain, setShowNightDomain] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showX, setShowX] = useState(true);
  const [showYouTube, setShowYouTube] = useState(true);
  const [showDiscord, setShowDiscord] = useState(true);
  const [showTelegram, setShowTelegram] = useState(true);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishSettling, setPublishSettling] = useState(false);
  const [removingEmail, setRemovingEmail] = useState(false);
  const [lastPublishedFingerprint, setLastPublishedFingerprint] = useState<string | null>(null);
  const [contactModeContractAddress, setContactModeContractAddress] =
    useState<string | null>(null);
  const [savedEncryptedHiddenPayload, setSavedEncryptedHiddenPayload] =
    useState<EncryptedHiddenPayload | null>(null);
  const [hasSavedShieldedEmail, setHasSavedShieldedEmail] = useState(false);
  const [savedContactMode, setSavedContactMode] = useState<ContactMode | null>(null);
  const [contactModeCompareLoading, setContactModeCompareLoading] = useState(false);
  const [contactModeRepairLoading, setContactModeRepairLoading] = useState(false);
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
  const [publishNotice, setPublishNotice] = useState<PublishNotice>(null);
  const [profileLinkCopied, setProfileLinkCopied] = useState(false);

  const resetFields = useCallback(() => {
    setPublicId("");
    setDisplayName("");
    setRegion("");
    setCountry("");
    setRole("");
    setBio("");
    setAvatarUrl("");
    setWebsiteUrl("");
    setNightDomain("");
    setEmail("");
    setSavedPublicEmail(null);
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
    setShowNightDomain(true);
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
    setContactModeRepairLoading(false);
    setPublishSettling(false);
  }, []);

  const load = useCallback(async (options?: { preserveSaveMsg?: boolean }) => {
    if (!walletId || verificationStatus !== "approved" || connectionMode !== "midnight") {
      setVerificationRequestId(null);
      setWalletBindingId(null);
      return;
    }

    setLoading(true);
    setError("");

    if (!options?.preserveSaveMsg) {
      setSaveMsg("");
    }

    try {
      const bindingResponse = await fetch(
        buildNightforceApiUrl(
          `/api/nightforce/wallet-bindings/by-wallet/${encodeURIComponent(walletId)}`,
        ),
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
        buildNightforceApiUrl(
          `/api/nightforce/profiles/${bindingVerificationRequestId}`,
        ),
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
      setNightDomain(profile.nightDomain ?? "");

      const nextEmail = profile.publicEmail ?? "";
      setSavedPublicEmail(profile.publicEmail ?? null);
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
      const nextShowNightDomain = resolveSocialVisibility(
        profile.fieldVisibility.nightDomain,
        true,
      );
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
      setShowNightDomain(nextShowNightDomain);
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
          nightDomain: profile.nightDomain ?? "",
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
          showNightDomain: nextShowNightDomain,
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

  useEffect(() => {
    if (!error) {
      return;
    }

    setPublishNotice({
      id: Date.now(),
      kind: "error",
      title: "Action failed",
      message: error,
    });
  }, [error]);

  useEffect(() => {
    if (!saveMsg) {
      return;
    }

    const isPending =
      saveMsg.includes("Publishing") ||
      saveMsg.includes("Waiting") ||
      saveMsg.includes("Syncing") ||
      saveMsg.includes("Refreshing") ||
      saveMsg.includes("Removing");

    const notice = {
      id: Date.now(),
      kind: isPending ? "pending" as const : "success" as const,
      title: isPending ? "Working..." : "Success",
      message: saveMsg,
    };

    setPublishNotice(notice);

    if (isPending) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPublishNotice((currentNotice) =>
        currentNotice?.id === notice.id ? null : currentNotice,
      );
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [saveMsg]);

  const settleAfterProfileWrite = useCallback(
  async (message: string) => {
    setPublishSettling(true);
    setSaveMsg("Refreshing saved profile state...");

    try {
      await Promise.all([
        load({ preserveSaveMsg: true }),
        sleep(PROFILE_WRITE_SETTLE_MS),
      ]);

      setSaveMsg(message);
      window.setTimeout(() => setSaveMsg(""), 2500);
    } finally {
      setPublishSettling(false);
    }
  },
  [load],
);

  const hasPublicId = hasText(publicId);
  const hasAvatarUrlValue = hasText(avatarUrl);
  const hasDisplayNameValue = hasText(displayName);
  const hasRegionValue = hasText(region);
  const hasCountryValue = hasText(country);
  const hasRoleValue = hasText(role);
  const hasBioValue = hasText(bio);
  const hasWebsiteUrlValue = hasText(websiteUrl);
  const hasNightDomainValue = hasText(nightDomain);
  const nightDomainValidationMessage = getNightDomainValidationMessage(nightDomain);
  const nightDomainIsValid = nightDomainValidationMessage === null;
  const hasEmailValue = hasText(email);
  const emailIsValid = isValidEmail(email);
  const hasXValue = hasText(xUsername);
  const hasYouTubeValue = hasText(youtubeHandle);
  const hasDiscordValue = hasText(discordUsername);
  const hasTelegramValue = hasText(telegramUsername);

  const invalidSocialFields = [
    hasXValue && !isAllowedSocialUrl(xUsername, "x") ? "X URL" : null,
    hasYouTubeValue && !isAllowedSocialUrl(youtubeHandle, "youtube")
      ? "YouTube URL"
      : null,
    hasDiscordValue && !isAllowedSocialUrl(discordUsername, "discord")
      ? "Discord invite URL"
      : null,
    hasTelegramValue && !isAllowedSocialUrl(telegramUsername, "telegram")
      ? "Telegram URL"
      : null,
  ].filter((value): value is string => value !== null);

  const socialUrlsAreValid = invalidSocialFields.length === 0;

  const missingRequiredFields = [
    !hasPublicId ? "Public ID" : null,
    !hasDisplayNameValue ? "Display Name" : null,
    !hasCountryValue ? "Country" : null,
  ].filter((value): value is string => value !== null);

  const publicIdValidationMessage = getProfileLinkValidationMessage(publicId);
  const displayNameValidationMessage =
    getDisplayNameValidationMessage(displayName);
  const bioValidationMessage = getBioValidationMessage(bio);

  const fieldValidationMessages = [
    publicIdValidationMessage,
    displayNameValidationMessage,
    bioValidationMessage,
    nightDomainValidationMessage,
  ].filter((value): value is string => value !== null);

  const profileFieldsAreValid = fieldValidationMessages.length === 0;

  const normalizedPublicProfileId = publicId.trim();
  const publicProfilePath = `/profile/${
    normalizedPublicProfileId || "your-public-id"
  }`;
  const publicProfileUrl = `${PUBLIC_SITE_ORIGIN}${publicProfilePath}`;
  const canCopyProfileLink =
    Boolean(normalizedPublicProfileId) && !publicIdValidationMessage;

  const currentEditorFingerprint = buildEditorFingerprint({
    publicId,
    displayName,
    region,
    country,
    role,
    bio,
    avatarUrl,
    websiteUrl,
    nightDomain,
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
    showNightDomain,
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
    !publishSettling &&
    !removingEmail &&
    !!verificationRequestId &&
    !!walletBindingId &&
    missingRequiredFields.length === 0 &&
    profileFieldsAreValid &&
    emailIsValid &&
    socialUrlsAreValid &&
    hasChangesToPublish;

  const nextContactModeForImpact = derivePreviewContactMode({
  hasEmailValue,
  showEmail,
  hasSavedEncryptedEmail: hasSavedShieldedEmail,
});

const privateContactSignatureExpected =
  hasChangesToPublish &&
  hasEmailValue &&
  !showEmail &&
  (!savedEncryptedHiddenPayload ||
    savedContactMode !== "PRIVATE_CONTACT_AVAILABLE" ||
    email.trim() !== (savedPublicEmail ?? ""));

const contactModeTransactionExpected =
  hasChangesToPublish &&
  (!contactModeContractAddress ||
    savedContactMode !== nextContactModeForImpact);

const publishImpact = !hasChangesToPublish
  ? {
      title: "No unpublished changes",
      expectation: "Nothing to publish yet.",
      tone: "neutral",
    }
  : privateContactSignatureExpected && contactModeTransactionExpected
    ? {
        title: "Private contact + Contact Mode update",
        expectation: "Expect a wallet signature and a Midnight tx approval.",
        tone: "strong",
      }
    : privateContactSignatureExpected
      ? {
          title: "Private contact encryption",
          expectation: "Expect a wallet signature. No transaction should be needed.",
          tone: "signature",
        }
      : contactModeTransactionExpected
        ? {
            title: "Contact Mode update",
            expectation: "Expect a Midnight tx approval.",
            tone: "transaction",
          }
        : {
            title: "Profile update only",
            expectation: "No Midnight wallet prompt expected.",
            tone: "profile",
          };

const publishImpactCardClass =
  publishImpact.tone === "strong"
    ? "border-emerald-800 bg-emerald-950/25"
    : publishImpact.tone === "transaction"
      ? "border-sky-800 bg-sky-950/20"
      : publishImpact.tone === "signature"
        ? "border-amber-800 bg-amber-950/20"
        : "border-zinc-800 bg-zinc-900";

const publishImpactGuideItems = [
  {
    title: "Profile update only",
    badge: "No wallet prompt",
    desc: "Profile fields, disclosure toggles, socials, website, bio, and profile visibility.",
  },
  {
    title: "Private contact encryption",
    badge: "Wallet signature",
    desc: "Saving or replacing a private email while keeping Show email publicly OFF.",
  },
  {
    title: "Contact Mode update",
    badge: "Midnight tx",
    desc: "Changing between Public, Private, and Unavailable contact modes.",
  },
  {
    title: "Private contact + Contact Mode",
    badge: "Signature + tx",
    desc: "Making an email private when Contact Mode also needs to change.",
  },
];

const applyProfileVisibility = (nextVisibility: ProfileVisibility) => {
  setProfileVisibility(nextVisibility);

  if (nextVisibility === "public") {
    setShowDisplayName(true);
  }

  if (nextVisibility === "anonymous") {
    setShowDisplayName(false);
  }
};

  const copyPublicProfileLink = async () => {
    if (!canCopyProfileLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setProfileLinkCopied(true);
      window.setTimeout(() => setProfileLinkCopied(false), 1800);
    } catch {
      setError("Unable to copy profile link. Please copy it manually.");
    }
  };

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

      const response = await fetch(buildNightforceApiUrl("/api/nightforce/uploads/avatar"), {
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
        buildNightforceApiUrl(`/api/nightforce/profiles/${verificationRequestId}`),
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

  const retryContactModeSync = async () => {
    if (contactModeRepairLoading || contactModeCompareLoading) {
      return;
    }

    if (!verificationRequestId) {
      setContactModeCompareError("No verification request was found.");
      return;
    }

    const mismatch = contactModeCompareResult;

    if (!mismatch || mismatch.matched) {
      setContactModeCompareError("No Contact Mode mismatch was found to repair.");
      return;
    }

    setContactModeRepairLoading(true);
    setContactModeCompareError("");
    setError("");
    setSaveMsg("Retrying Contact Mode sync...");

    try {
      const updateResult = await updateContactMode(
        mismatch.contractAddress,
        mismatch.backendMode,
      );

      const midnightResult = await readContactMode(updateResult.contractAddress);
      const checkedAt = new Date().toISOString();
      const matched = midnightResult.contactMode === mismatch.backendMode;

      await updateContactModeSyncMetadata({
        verificationRequestId,
        contactModeContractAddress: updateResult.contractAddress,
        contactModeSyncStatus: matched ? "synced" : "failed",
        contactModeLastSyncedAt: matched ? checkedAt : null,
        contactModeSyncError: matched
          ? null
          : `Midnight still reports ${midnightResult.contactMode} instead of ${mismatch.backendMode}.`,
        contactModeSyncedValue: matched ? mismatch.backendMode : null,
      });

      setContactModeContractAddress(updateResult.contractAddress);
      setSavedContactMode(mismatch.backendMode);
      setContactModeCompareResult({
        backendMode: mismatch.backendMode,
        midnightMode: midnightResult.contactMode,
        contractAddress: updateResult.contractAddress,
        rawValue: midnightResult.rawValue,
        matched,
        checkedAt,
      });

      await load({ preserveSaveMsg: true });

      if (!matched) {
        throw new Error(
          `Contact Mode retry finished, but sync still mismatched. Midnight reports ${midnightResult.contactMode} instead of ${mismatch.backendMode}.`,
        );
      }

      setSaveMsg("Contact Mode sync repaired.");
      window.setTimeout(() => setSaveMsg(""), 2500);
    } catch (err) {
      const message = getReadablePublishError(
        err,
        "Failed to retry Contact Mode sync. The wallet or Midnight SDK returned no readable error.",
      );

      setError(`Contact-mode retry failed: ${message}`);
      setSaveMsg("");
    } finally {
      setContactModeRepairLoading(false);
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
      nightDomain:
        showNightDomain && hasNightDomainValue && nightDomainIsValid
          ? "public" as const
          : "hidden" as const,
      email: showEmail && hasEmailValue ? "public" as const : "hidden" as const,
      x: showX && hasXValue ? "public" as const : "hidden" as const,
      youtube: showYouTube && hasYouTubeValue ? "public" as const : "hidden" as const,
      discord: showDiscord && hasDiscordValue ? "public" as const : "hidden" as const,
      telegram: showTelegram && hasTelegramValue ? "public" as const : "hidden" as const,
      realName: "hidden" as const,
      contact: "hidden" as const,
    };

    try {
      const response = await fetch(
        buildNightforceApiUrl(`/api/nightforce/profiles/${verificationRequestId}`),
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
            nightDomain: normalizeNightDomainInput(nightDomain) || null,
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
          const syncMessage = getReadablePublishError(
            syncError,
            "Failed to update contact-mode contract. The wallet or Midnight SDK returned no readable error. Check the Lace wallet activity panel for a pending, failed, or rejected transaction.",
          );

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
      setSavedPublicEmail(null);
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
          nightDomain,
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
          showNightDomain,
          showEmail: false,
          showX,
          showYouTube,
          showDiscord,
          showTelegram,
        }),
      );
      await settleAfterProfileWrite(
        syncPending
          ? "Saved private email removed. Contact-mode sync pending."
          : "Saved private email removed.",
      );
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
    if (publishInFlightRef.current || publishing || publishSettling) {
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

    if (!socialUrlsAreValid) {
      setError(`Please enter valid social URLs for: ${invalidSocialFields.join(", ")}`);
      return;
    }

    if (!nightDomainIsValid) {
      setError(nightDomainValidationMessage ?? "Please enter a valid .night domain.");
      return;
    }

    if (!walletId) {
      setError("Midnight wallet is not connected.");
      return;
    }

    publishInFlightRef.current = true;
    setError("");
    setSaveMsg("Publishing changes...");
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
      nightDomain:
        showNightDomain && hasNightDomainValue && nightDomainIsValid
          ? "public" as const
          : "hidden" as const,
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
      const nextSavedPublicEmail = showEmail && hasEmailValue ? trimmedEmail : null;

      let encryptedHiddenPayload: EncryptedHiddenPayload | null =
        savedEncryptedHiddenPayload;

      const shouldEncryptHiddenEmail =
        hasEmailValue &&
        !showEmail &&
        (!savedEncryptedHiddenPayload ||
        savedContactMode !== "PRIVATE_CONTACT_AVAILABLE" ||
        trimmedEmail !== (savedPublicEmail ?? ""));

      if (shouldEncryptHiddenEmail) {
        setSaveMsg("Waiting for wallet approval...");
        encryptedHiddenPayload = await encryptHiddenEmail(
          trimmedEmail,
          verificationRequestId,
        );
      }

      const response = await fetch(
        buildNightforceApiUrl(`/api/nightforce/profiles/${verificationRequestId}`),
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
            nightDomain: normalizeNightDomainInput(nightDomain) || null,
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
      const nextSavedEncryptedHiddenPayload = encryptedHiddenPayload ?? null;
      const existingContactModeAddress =
        data.profile.contactModeContractAddress ?? contactModeContractAddress ?? null;

      setPublicId(data.profile.publicId ?? "");
      setSavedPublicEmail(nextSavedPublicEmail);
      setSavedEncryptedHiddenPayload(nextSavedEncryptedHiddenPayload);
      setHasSavedShieldedEmail(Boolean(nextSavedEncryptedHiddenPayload));
      setSaveMsg("Profile saved. Syncing profile state...");

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
          await settleAfterProfileWrite("Changes published.");
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
            // Keep the original wallet/transaction error as the visible publish failure.
          }

          setContactModeContractAddress(existingContactModeAddress);
          throw new Error(`Contact-mode sync failed: ${syncMessage}`);
        }

        await settleAfterProfileWrite("Changes published.");
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
      } catch (syncError) {
        const syncMessage = getReadablePublishError(
          syncError,
          "Failed to deploy contact-mode contract. The wallet or Midnight SDK returned no readable error. Check the Lace wallet activity panel for a pending, failed, or rejected transaction.",
        );

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
          // Keep the original wallet/transaction error as the visible publish failure.
        }

        setContactModeContractAddress(null);
        throw new Error(`Contact-mode sync failed: ${syncMessage}`);
      }

      await settleAfterProfileWrite("Changes published.");
    } catch (err) {
      const message = getReadablePublishError(
        err,
        "Failed to publish profile. The wallet or Midnight SDK returned no readable error.",
      );

      if (message.includes("Duplicate request")) {
        setError(
          "A wallet approval request is already pending. Please finish the open 1AM wallet prompt, then try again once.",
        );
      } else {
        setError(message);
      }

      setSaveMsg("");
    } finally {
      publishInFlightRef.current = false;
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
        nightDomain: showNightDomain && hasNightDomainValue && nightDomainIsValid
          ? normalizeNightDomainInput(nightDomain)
          : null,
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

  const saveFullProfilePreview = () => {
    writeFullProfilePreviewToStorage(livePublic);
  };

  const visibilitySummaryItems: Array<{
    label: string;
    visible: boolean;
    note?: string;
  }> = [
    {
      label: "Directory",
      visible: profileVisibility !== "hidden",
    },
    {
      label: "Public Profile Page",
      visible: profileVisibility !== "hidden",
    },
    {
      label: "Homepage Profile Card",
      visible: profileVisibility !== "hidden",
    },
    {
      label: "Map Presence",
      visible: profileVisibility !== "hidden",
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
      set: (nextValue: boolean) => {
        setShowDisplayName(nextValue);

      if (profileVisibility !== "hidden") {
        setProfileVisibility(nextValue ? "public" : "anonymous");
      }
    },
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
      label: "Show .night domain",
      value: showNightDomain,
      set: setShowNightDomain,
      disabled: !hasNightDomainValue || !nightDomainIsValid,
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
    <div className="max-w-[1180px] mx-auto py-8 px-4">
      {publishNotice && (
        <div className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
          <div
            className={
              publishNotice.kind === "error"
                ? "w-full max-w-xl rounded-2xl border border-red-400/30 bg-red-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur"
                : publishNotice.kind === "pending"
                  ? "w-full max-w-xl rounded-2xl border border-sky-400/30 bg-sky-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur"
                  : "w-full max-w-xl rounded-2xl border border-emerald-400/30 bg-emerald-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur"
            }
            role={publishNotice.kind === "error" ? "alert" : "status"}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div
                  className={
                    publishNotice.kind === "error"
                      ? "text-sm font-mono font-semibold text-red-200"
                      : publishNotice.kind === "pending"
                        ? "text-sm font-mono font-semibold text-sky-200"
                        : "text-sm font-mono font-semibold text-emerald-200"
                  }
                >
                  {publishNotice.title}
                </div>
                <div className="mt-1 break-words text-xs font-mono leading-5 text-zinc-200">
                  {publishNotice.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPublishNotice(null)}
                className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-mono text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-xl font-mono font-bold text-white mb-6">My Profile</h1>

      {error && (
        <div className="mb-4 text-xs font-mono text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,650px)_minmax(0,500px)] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <div className="text-xs font-mono text-zinc-500 mb-1">Connected Wallet</div>
            <div className="font-mono text-white text-sm break-all">{walletId}</div>
            <div className="mt-2 text-xs font-mono text-emerald-400">
              ✓ Verified Ambassador
            </div>
          </div>

          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-mono font-semibold text-white mb-1">
                  Contact Mode
                </div>
                <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                  Read-only status. This is derived from your saved contact settings and mirrored to Midnight.
                </p>
              </div>

              {canVerifyContactModeSync && (
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void compareContactModeSync()}
                    disabled={
                      contactModeCompareLoading ||
                      contactModeRepairLoading ||
                      !contactModeContractAddress
                    }
                    className="font-mono text-[11px] bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {contactModeCompareLoading ? "Verifying..." : "Verify Sync"}
                  </button>

                  {contactModeCompareResult && !contactModeCompareResult.matched && (
                    <button
                      type="button"
                      onClick={() => void retryContactModeSync()}
                      disabled={
                        contactModeCompareLoading ||
                        contactModeRepairLoading ||
                        !contactModeContractAddress
                      }
                      className="font-mono text-[11px] bg-red-950/40 hover:bg-red-950/70 text-red-200 border border-red-500/40 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {contactModeRepairLoading ? "Retrying..." : "Retry Sync"}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-2 text-[11px] font-mono">
              <div className="flex items-start justify-between gap-3">
                <span className="text-zinc-500">Saved mode</span>
                <span className="text-white text-right">
                  {savedContactMode ?? "Not synced yet"}
                </span>
              </div>

              {canVerifyContactModeSync && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-zinc-500">Sync check</span>
                  <span
                    className={
                      contactModeCompareResult
                        ? contactModeCompareResult.matched
                          ? "text-emerald-300 text-right"
                          : "text-red-300 text-right"
                        : "text-zinc-400 text-right"
                    }
                  >
                    {contactModeCompareResult
                      ? contactModeCompareResult.matched
                        ? "Verified"
                        : "Mismatch"
                      : contactModeContractAddress
                        ? "Ready to verify"
                        : "No contract yet"}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <span className="text-zinc-500">Contract</span>
                <span className="text-zinc-500 text-right break-all">
                  {contactModeContractAddress ?? "Not created yet"}
                </span>
              </div>
            </div>

            {canVerifyContactModeSync && contactModeCompareError && (
              <div className="mt-3 text-[11px] font-mono text-red-300">
                {contactModeCompareError}
              </div>
            )}

            {canVerifyContactModeSync && contactModeCompareResult && (
              <div className="mt-4 border-t border-zinc-800 pt-3 grid gap-1 text-[11px] font-mono text-zinc-400">
                <div>
                  Backend-derived fallback:{" "}
                  <span className="text-white">
                    {contactModeCompareResult.backendMode}
                  </span>
                </div>
                <div>
                  Midnight synced value:{" "}
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
                    onChange={(e) =>
                      setPublicId(e.target.value.slice(0, PROFILE_LINK_MAX_LENGTH))
                    }
                    maxLength={PROFILE_LINK_MAX_LENGTH}
                    placeholder="3–32 lowercase letters, numbers, or hyphens"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />

                  <p className="mt-1.5 text-[11px] font-mono leading-relaxed text-zinc-600">
                    This becomes your public profile link. Use lowercase letters,
                    numbers, and hyphens only.
                  </p>

                  <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                    <div className="mb-1 text-[10px] font-mono uppercase tracking-wide text-zinc-600">
                      Public profile link preview
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-black/30 px-3 py-2 text-[11px] font-mono text-zinc-400">
                        <span className="block truncate">
                          {publicProfileUrl}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => void copyPublicProfileLink()}
                        disabled={!canCopyProfileLink}
                        className="shrink-0 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] font-mono text-zinc-300 transition-colors hover:border-emerald-700 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {profileLinkCopied ? "Copied" : "Copy"}
                      </button>
                    </div>

                    {!canCopyProfileLink && (
                      <div className="mt-2 text-[10px] font-mono text-zinc-600">
                        Enter a valid Public ID before copying the link.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className="block text-xs font-mono text-zinc-500">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        displayName.length >= DISPLAY_NAME_MAX_LENGTH
                          ? "text-amber-300"
                          : "text-zinc-600"
                      }`}
                    >
                      {displayName.length}/{DISPLAY_NAME_MAX_LENGTH}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) =>
                      setDisplayName(e.target.value.slice(0, DISPLAY_NAME_MAX_LENGTH))
                    }
                    maxLength={DISPLAY_NAME_MAX_LENGTH}
                    placeholder="2–40 characters, e.g. John Doe"
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
                    placeholder="e.g. Nightforce Recruit"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className="block text-xs font-mono text-zinc-500">
                      Short Bio
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        bio.length >= BIO_MAX_LENGTH
                          ? "text-amber-300"
                          : "text-zinc-600"
                      }`}
                    >
                      {bio.length}/{BIO_MAX_LENGTH}
                    </span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
                    maxLength={BIO_MAX_LENGTH}
                    placeholder="Optional. Max 280 characters."
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
                    .night domain
                  </label>
                  <input
                    type="text"
                    value={nightDomain}
                    onChange={(e) => setNightDomain(e.target.value)}
                    onBlur={() => setNightDomain((value) => normalizeNightDomainInput(value))}
                    placeholder="12345.night"
                    className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none ${
                      nightDomainIsValid
                        ? "border-zinc-700 focus:border-zinc-500"
                        : "border-red-800 focus:border-red-600"
                    }`}
                  />
                  <p className="mt-2 text-[11px] font-mono text-zinc-600 leading-relaxed">
                    Optional. Add your Midnames .night domain to show a public identity card.
                    Preprod/testnet data may change or reset.
                  </p>
                  {!nightDomainIsValid && (
                    <p className="mt-2 text-[11px] font-mono text-red-400">
                      {nightDomainValidationMessage}
                    </p>
                  )}
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
                    X URL
                  </label>
                  <input
                    type="text"
                    value={xUsername}
                    onChange={(e) => setXUsername(e.target.value)}
                    placeholder="https://x.com/yourhandle"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    YouTube URL
                  </label>
                  <input
                    type="text"
                    value={youtubeHandle}
                    onChange={(e) => setYouTubeHandle(e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Discord invite URL
                  </label>
                  <input
                    type="text"
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    placeholder="https://discord.gg/yourinvite"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5">
                    Telegram URL
                  </label>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="https://t.me/yourchannel"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {invalidSocialFields.length > 0 && (
                  <p className="text-[11px] font-mono text-red-400 sm:col-span-2">
                    Please use real platform URLs only: X, YouTube, Discord invite, or Telegram.
                  </p>
                )}
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
  <div className="flex items-start justify-between gap-3 mb-4">
    <div>
      <h2 className="text-sm font-mono font-semibold text-white">
        Profile Visibility
      </h2>
      <p className="mt-1 text-[11px] font-mono leading-relaxed text-zinc-600">
        Public and Anonymous are tied to display-name visibility. Hidden is a
        manual override and does not erase your disclosure choices.
      </p>
    </div>

    <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[10px] font-mono text-zinc-400">
      {profileVisibility === "hidden"
        ? "Hidden"
        : showDisplayName
          ? "Public"
          : "Anonymous"}
    </span>
  </div>

  <div className="flex flex-col gap-2">
    {(
      [
        {
          value: "public",
          label: "Public profile",
          desc: "Profile is visible and display name is shown.",
        },
        {
          value: "anonymous",
          label: "Anonymous public profile",
          desc: "Profile is visible, but display name is hidden.",
        },
        {
          value: "hidden",
          label: "Hidden from public pages",
          desc: "Profile is unavailable publicly and removed from directory-style surfaces.",
        },
      ] as {
        value: ProfileVisibility;
        label: string;
        desc: string;
      }[]
    ).map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => applyProfileVisibility(opt.value)}
        className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
          profileVisibility === opt.value
            ? "border-zinc-500 bg-zinc-800"
            : "border-zinc-800 hover:border-zinc-700"
        }`}
      >
        <span
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            profileVisibility === opt.value
              ? "border-white"
              : "border-zinc-600"
          }`}
        >
          {profileVisibility === opt.value && (
            <span className="h-2 w-2 rounded-full bg-white" />
          )}
        </span>

        <span>
          <span className="block text-sm font-mono text-white">
            {opt.label}
          </span>
          <span className="mt-0.5 block text-xs font-mono leading-relaxed text-zinc-500">
            {opt.desc}
          </span>
        </span>
      </button>
    ))}
  </div>

  <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
    <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">
      Automatic behavior
    </div>
    <p className="mt-1 text-[11px] font-mono leading-relaxed text-zinc-500">
      Turning Show display name ON selects Public. Turning it OFF selects
      Anonymous. Hidden is only selected when you choose it here.
    </p>
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

          {fieldValidationMessages.length > 0 && (
            <div className="border border-red-900/70 rounded-lg p-4 bg-zinc-900">
              <div className="text-xs font-mono text-red-300 mb-2">
                Fix before publish
              </div>
              <ul className="list-disc space-y-1 pl-4 text-[11px] font-mono text-zinc-400">
                {fieldValidationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => void publishChanges()}
              disabled={!canPublish}
              className="font-mono text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Loading..."
                : publishSettling
                  ? "Refreshing..."
                  : publishing
                    ? "Publishing..."
                    : "Publish Changes"}
            </button>
            {saveMsg && (
              <span className="text-xs font-mono text-emerald-400">
                {saveMsg}
              </span>
            )}
          </div>
        </div>

<div className="lg:sticky lg:top-24 lg:self-start">
  <div className="flex flex-col gap-4">
    <div className={`border rounded-lg p-4 ${publishImpactCardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-500">
            Current publish impact
          </div>
          <div className="mt-1 text-sm font-mono font-semibold text-white">
            {publishImpact.title}
          </div>
          <p className="mt-2 text-[11px] font-mono leading-relaxed text-zinc-400">
            {publishImpact.expectation}
          </p>
        </div>

        <div className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-mono text-zinc-400">
          {hasChangesToPublish ? "Unsaved changes" : "Clean"}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {publishImpactGuideItems.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[11px] font-mono font-semibold text-zinc-200">
                {item.title}
              </div>
              <span className="shrink-0 rounded-full border border-zinc-800 px-2 py-0.5 text-[9px] font-mono text-zinc-500">
                {item.badge}
              </span>
            </div>
            <p className="mt-2 text-[10px] font-mono leading-relaxed text-zinc-600">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>

    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 lg:w-[320px]">
      <h2 className="text-sm font-mono font-semibold text-white mb-4">
        Public Card Preview
      </h2>
      {livePublic && livePublic.visibility !== "hidden" ? (
        <ProfileCard
          profile={livePublic}
          viewHref={`/profile/${PROFILE_PREVIEW_PUBLIC_ID}`}
          viewLabel="Full preview →"
          viewTarget="_blank"
          onViewClick={saveFullProfilePreview}
          nightIdentityMode="interactive"
        />
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
    </div>
  );
}