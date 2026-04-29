import { and, desc, eq, lt } from "drizzle-orm";
import {
  getDb,
  profilesTable,
  verificationRequestsTable,
  visitorActivityTable,
  walletBindingsTable,
  type DatabaseEnv,
} from "@workspace/db";
import { z } from "zod";

type ProfileImagesBucket = {
  put(
    key: string,
    value: ArrayBuffer,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<{
    body: ReadableStream | null;
    httpMetadata?: {
      contentType?: string;
    };
  } | null>;
};

interface Env extends DatabaseEnv {
  PROFILE_IMAGES: ProfileImagesBucket;
  ADMIN_OWNER_EMAIL?: string;
  ADMIN_OWNER_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
}

const uuidSchema = z.string().uuid();
const verificationStatusSchema = z.enum(["pending", "approved", "rejected"]);
const publishStateSchema = z.enum(["draft", "published", "inactive"]);
const trustedVisibilitySchema = z.enum(["public", "hidden"]);
const visibilitySettingSchema = z.enum(["public", "hidden"]);

const optionalEmailInputSchema = z
  .string()
  .trim()
  .email()
  .or(z.literal(""))
  .optional()
  .nullable();

const optionalNightDomainInputSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .refine((value) => value === "" || isValidNightDomain(value), {
    message: "Enter a valid .night domain, such as 12345.night",
  })
  .optional()
  .nullable();

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

const optionalProfileLinkInputSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .superRefine((value, ctx) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return;
    }

    const message = getProfileLinkValidationMessage(value);

    if (message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
      });
    }
  });

const optionalDisplayNameInputSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .superRefine((value, ctx) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return;
    }

    const message = getDisplayNameValidationMessage(value);

    if (message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
      });
    }
  });

const optionalBioInputSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .superRefine((value, ctx) => {
    if (typeof value !== "string") {
      return;
    }

    const message = getBioValidationMessage(value);

    if (message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
      });
    }
  });

const createVerificationRequestInputSchema = z.object({
  discordHandle: z.string().trim().min(1),
  region: z.string().trim().min(1),
  note: z.string().trim().optional(),
  midnightWalletAddress: z.string().trim().min(1).optional(),
});

const reviewVerificationRequestInputSchema = z.object({
  adminNotes: z.string().trim().optional(),
});

const adminLoginInputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const createWalletBindingInputSchema = z.object({
  verificationRequestId: uuidSchema,
  midnightWalletAddress: z.string().trim().min(1),
});

const fieldVisibilitySchema = z.object({
  avatarUrl: visibilitySettingSchema,
  displayName: visibilitySettingSchema,
  region: visibilitySettingSchema,
  country: visibilitySettingSchema,
  role: visibilitySettingSchema,
  bio: visibilitySettingSchema,
  websiteUrl: visibilitySettingSchema,
  nightDomain: visibilitySettingSchema,
  email: visibilitySettingSchema,
  x: visibilitySettingSchema,
  youtube: visibilitySettingSchema,
  discord: visibilitySettingSchema,
  telegram: visibilitySettingSchema,
  realName: z.literal("hidden"),
  contact: z.literal("hidden"),
});

const encryptedHiddenPayloadSchema = z.object({
  version: z.number().int(),
  algorithm: z.literal("AES-GCM"),
  kdf: z.literal("PBKDF2"),
  hash: z.literal("SHA-256"),
  iterations: z.number().int(),
  saltBase64: z.string(),
  ivBase64: z.string(),
  ciphertextBase64: z.string(),
});

const upsertProfileInputSchema = z.object({
  walletBindingId: uuidSchema,
  publicId: optionalProfileLinkInputSchema,
  slug: optionalProfileLinkInputSchema,
  displayName: optionalDisplayNameInputSchema,
  region: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  role: z.string().trim().optional().nullable(),
  bio: optionalBioInputSchema,
  avatarUrl: z.string().trim().optional().nullable(),
  websiteUrl: z.string().trim().optional().nullable(),
  nightDomain: optionalNightDomainInputSchema,
  publicEmail: optionalEmailInputSchema,
  socials: z.array(z.string().trim()).optional(),
  fieldVisibility: fieldVisibilitySchema,
  encryptedHiddenPayload: encryptedHiddenPayloadSchema.optional().nullable(),
  requestedVisibility: trustedVisibilitySchema,
  publishState: publishStateSchema.optional(),
});

const contactModeSchema = z.enum([
  "NO_CONTACT",
  "PRIVATE_CONTACT_AVAILABLE",
  "PUBLIC_CONTACT_ALLOWED",
]);

const updateContactModeSyncInputSchema = z
  .object({
    contactModeContractAddress: z.string().trim().min(1).nullable().optional(),
    contactModeSyncStatus: z.enum(["not_created", "synced", "failed"]),
    contactModeLastSyncedAt: z.string().trim().min(1).nullable().optional(),
    contactModeSyncError: z.string().trim().optional().nullable(),
    contactModeSyncedValue: contactModeSchema.nullable().optional(),
  })
  .superRefine((input, ctx) => {
    if (input.contactModeSyncStatus === "synced" && !input.contactModeSyncedValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactModeSyncedValue"],
        message:
          "contactModeSyncedValue is required when contactModeSyncStatus is synced.",
      });
    }
  });

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
  "access-control-allow-headers": "content-type",
};

const AVATAR_MAX_BYTES = 500 * 1024;
const AVATAR_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const AVATAR_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const VISITOR_ACTIVITY_RETENTION_DAYS = 7;
const VISITOR_ACTIVITY_DEFAULT_LIMIT = 8;
const VISITOR_ACTIVITY_MAX_LIMIT = 25;

const ADMIN_SESSION_COOKIE_NAME = "nightforce_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const PROFILE_PROOF_PREPROD_STATE = {
  contractAddress:
    "eeac83cd347cbd2f974499872508c0044540aee53aa639fa2183462d9b8c1fa3",
  network: "preprod",
  visibility: {
    name: "PUBLIC",
    value: 1,
  },
  countryCode: {
    name: "MY",
    value: 1,
  },
};

const PUBLIC_VISITOR_ACTIVITY_PATHS = new Set([
  "/",
  "/directory",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/request-verification",
]);

const visitorActivityInputSchema = z.object({
  path: z.string().trim().optional(),
});

const visitorActivityAdjectives = [
  "green",
  "blue",
  "silver",
  "amber",
  "quiet",
  "swift",
  "bright",
  "lunar",
  "hidden",
  "brave",
  "crimson",
  "violet",
  "golden",
  "coral",
  "ivory",
  "jade",
  "neon",
  "obsidian",
  "copper",
  "frost",
  "midnight",
  "electric",
  "velvet",
  "smoky",
  "wild",
  "calm",
  "tiny",
  "bold",
  "cosmic",
  "radiant",
  "sapphire",
  "emerald",
  "ruby",
  "onyx",
  "pearl",
  "bronze",
  "azure",
  "indigo",
  "scarlet",
  "mint",
  "opal",
  "plum",
  "sunny",
  "dusky",
  "misty",
  "stormy",
  "gentle",
  "rapid",
  "silent",
  "glowing",
  "shadow",
  "solar",
  "arctic",
  "tropical",
  "forest",
  "ocean",
  "desert",
  "meadow",
  "starlit",
  "nova",
];

const visitorActivityAnimals = [
  "cobra",
  "otter",
  "falcon",
  "tiger",
  "panda",
  "raven",
  "gecko",
  "lynx",
  "heron",
  "wolf",
  "fox",
  "manta",
  "owl",
  "hawk",
  "leopard",
  "panther",
  "dolphin",
  "badger",
  "sparrow",
  "beetle",
  "orca",
  "crane",
  "koi",
  "dragonfly",
  "firefly",
  "turtle",
  "jaguar",
  "ibex",
  "seal",
  "phoenix",
  "eagle",
  "whale",
  "penguin",
  "lemur",
  "macaw",
  "meerkat",
  "moose",
  "rabbit",
  "salmon",
  "yak",
  "zebra",
  "cheetah",
  "antelope",
  "bison",
  "pelican",
  "puffin",
  "swan",
  "robin",
  "lizard",
  "ferret",
  "hamster",
  "hedgehog",
  "squid",
  "octopus",
  "narwhal",
  "alpaca",
  "llama",
  "koala",
  "wallaby",
  "gazelle",
];

type CountryDisplayNames = {
  of(code: string): string | undefined;
};

type IntlWithDisplayNames = {
  DisplayNames?: new (
    locales: string | string[],
    options: { type: "region" },
  ) => CountryDisplayNames;
};

function createCountryDisplayNames(): CountryDisplayNames | null {
  try {
    const intlWithDisplayNames = (globalThis as unknown as {
      Intl?: IntlWithDisplayNames;
    }).Intl;

    if (!intlWithDisplayNames?.DisplayNames) {
      return null;
    }

    return new intlWithDisplayNames.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
}

const countryDisplayNames = createCountryDisplayNames();

function getCountryNameFromCode(countryCode: string): string {
  if (countryCode === "XX") {
    return "Unknown";
  }

  return countryDisplayNames?.of(countryCode) ?? countryCode;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

function jsonWithHeaders(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...jsonHeaders,
      ...extraHeaders,
    },
  });
}

function notFound(): Response {
  return json({ error: "Not found" }, 404);
}

function methodNotAllowed(): Response {
  return json({ error: "Method not allowed" }, 405);
}

type AdminSessionPayload = {
  email: string;
  expiresAt: number;
};

function getConfiguredAdminSecret(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlEncodeString(value: string): string {
  return base64UrlEncode(new TextEncoder().encode(value));
}

function base64UrlDecodeToString(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    Math.ceil(normalized.length / 4) * 4,
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

function safeStringEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

async function signAdminSessionValue(
  secret: string,
  value: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );

  return base64UrlEncode(new Uint8Array(signature));
}

async function createAdminSessionToken(
  env: Env,
  email: string,
): Promise<string> {
  const secret = getConfiguredAdminSecret(env.ADMIN_SESSION_SECRET);

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }

  const payload: AdminSessionPayload = {
    email,
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
  };

  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload));
  const signature = await signAdminSessionValue(secret, encodedPayload);

  return `${encodedPayload}.${signature}`;
}

async function verifyAdminSessionToken(
  env: Env,
  token: string,
): Promise<AdminSessionPayload | null> {
  const secret = getConfiguredAdminSecret(env.ADMIN_SESSION_SECRET);

  if (!secret) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await signAdminSessionValue(secret, encodedPayload);

  if (!safeStringEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecodeToString(encodedPayload),
    ) as Partial<AdminSessionPayload>;

    if (
      typeof payload.email !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt < Date.now()
    ) {
      return null;
    }

    return {
      email: payload.email,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");

    if (rawName === name) {
      return rawValueParts.join("=") || null;
    }
  }

  return null;
}

async function getAdminSession(
  request: Request,
  env: Env,
): Promise<AdminSessionPayload | null> {
  const token = getCookieValue(request, ADMIN_SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  return verifyAdminSessionToken(env, token);
}

async function requireAdminSession(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const session = await getAdminSession(request, env);

  if (!session) {
    return json({ error: "Admin login required" }, 401);
  }

  return null;
}

function buildAdminSessionCookie(token: string): string {
  return [
    `${ADMIN_SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    `Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

function buildClearAdminSessionCookie(): string {
  return [
    `${ADMIN_SESSION_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

function getProfileProofStateResponse(url: URL): Response {
  const target = url.searchParams.get("target") ?? "preprod";

  if (target !== "preprod") {
    return json(
      {
        error: "Unsupported profile-proof target",
        details: `Only target=preprod is available in the Cloudflare Worker runtime. Received target=${target}.`,
      },
      400,
    );
  }

  return json(PROFILE_PROOF_PREPROD_STATE);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function isSqliteUniqueError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("unique constraint failed")
  );
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
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

function normalizeNightDomain(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalString(value)?.toLowerCase();

  if (!normalized) {
    return null;
  }

  return isValidNightDomain(normalized) ? normalized : null;
}

function normalizeSlug(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSocials(value: string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  const cleaned = value
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return Array.from(new Set(cleaned));
}

function createPublicId(): string {
  return `nf_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function createAvatarObjectKey(contentType: string): string {
  const extension = AVATAR_EXTENSION_BY_TYPE[contentType] ?? "bin";
  return `avatar_${crypto.randomUUID()}.${extension}`;
}

function buildAvatarImageUrl(requestUrl: URL, objectKey: string): string {
  return `${requestUrl.origin}/api/nightforce/images/${encodeURIComponent(objectKey)}`;
}

function normalizeCountryCode(value: string | null | undefined): string {
  if (!value) {
    return "XX";
  }

  const countryCode = value.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(countryCode) || countryCode === "T1") {
    return "XX";
  }

  return countryCode;
}

function getCountryFromRequest(request: Request): {
  countryCode: string;
  countryName: string;
} {
  const requestWithCloudflareData = request as Request & {
    cf?: {
      country?: string;
    };
  };

  const countryCode = normalizeCountryCode(
    requestWithCloudflareData.cf?.country ??
      request.headers.get("CF-IPCountry") ??
      request.headers.get("x-country-code"),
  );

  return {
    countryCode,
    countryName: getCountryNameFromCode(countryCode),
  };
}

function normalizeVisitorActivityPath(value: unknown): string {
  const rawPath =
    typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : "/";

  const pathOnly = rawPath.split("?")[0]?.split("#")[0] || "/";
  const normalizedPath = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  return normalizedPath.slice(0, 120);
}

function shouldStoreVisitorActivityPath(path: string): boolean {
  return PUBLIC_VISITOR_ACTIVITY_PATHS.has(path);
}

function createVisitorAlias(): string {
  const adjective =
    visitorActivityAdjectives[
      Math.floor(Math.random() * visitorActivityAdjectives.length)
    ] ?? "green";

  const animal =
    visitorActivityAnimals[
      Math.floor(Math.random() * visitorActivityAnimals.length)
    ] ?? "cobra";

  return `${adjective} ${animal}`;
}

async function pruneOldVisitorActivity(
  db: ReturnType<typeof getDb>,
): Promise<void> {
  const cutoff = new Date(
    Date.now() - VISITOR_ACTIVITY_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  await db
    .delete(visitorActivityTable)
    .where(lt(visitorActivityTable.createdAt, cutoff));
}

function getVisitorActivityLimit(url: URL): number {
  const requestedLimit = Number.parseInt(
    url.searchParams.get("limit") ?? "",
    10,
  );

  if (!Number.isFinite(requestedLimit)) {
    return VISITOR_ACTIVITY_DEFAULT_LIMIT;
  }

  return Math.min(
    Math.max(requestedLimit, 1),
    VISITOR_ACTIVITY_MAX_LIMIT,
  );
}

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

function deriveContactMode(profile: typeof profilesTable.$inferSelect): ContactMode {
  if (profile.publicEmail) {
    return "PUBLIC_CONTACT_ALLOWED";
  }

  if (profile.encryptedHiddenPayload) {
    return "PRIVATE_CONTACT_AVAILABLE";
  }

  return "NO_CONTACT";
}

function getPublicContactMode(profile: typeof profilesTable.$inferSelect): ContactMode {
  if (
    profile.contactModeSyncStatus === "synced" &&
    isContactMode(profile.contactModeSyncedValue)
  ) {
    return profile.contactModeSyncedValue;
  }

  return deriveContactMode(profile);
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

function filterPublicSocials(profile: typeof profilesTable.$inferSelect): string[] {
  return (profile.socials ?? []).filter((social) => {
    const key = getSocialVisibilityKey(social);

    if (!key) {
      return false;
    }

    return profile.fieldVisibility[key] === "public";
  });
}

function toPublicProfile(profile: typeof profilesTable.$inferSelect) {
  return {
    publicId: profile.publicId,
    slug: profile.slug,
    displayName:
      profile.fieldVisibility.displayName === "public"
        ? profile.displayName
        : null,
    region:
      profile.fieldVisibility.region === "public"
        ? profile.region
        : null,
    country:
      profile.fieldVisibility.country === "public"
        ? profile.country
        : null,
    role:
      profile.fieldVisibility.role === "public"
        ? profile.role
        : null,
    bio:
      profile.fieldVisibility.bio === "public"
        ? profile.bio
        : null,
    avatarUrl:
      profile.fieldVisibility.avatarUrl === "public"
        ? profile.avatarUrl
        : null,
    websiteUrl:
      profile.fieldVisibility.websiteUrl === "public"
        ? profile.websiteUrl
        : null,
    nightDomain:
      (profile.fieldVisibility as unknown as Record<string, string>).nightDomain === "public"
        ? profile.nightDomain
        : null,
    publicEmail:
      profile.fieldVisibility.email === "public"
        ? profile.publicEmail
        : null,
    contactMode: getPublicContactMode(profile),
    socials: filterPublicSocials(profile),
    requestedVisibility: profile.requestedVisibility,
    publishState: profile.publishState,
  };
}

function pathParts(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: jsonHeaders,
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const parts = pathParts(pathname);
    const db = getDb(env);

    if (pathname === "/api/healthz") {
      return json({ status: "ok", service: "nightforce-worker" });
    }

    if (pathname === "/api/profile-proof/state") {
      if (request.method !== "GET") {
        return methodNotAllowed();
      }

      return getProfileProofStateResponse(url);
    }

    if (pathname === "/api/nightforce/admin/session") {
      if (request.method !== "GET") {
        return methodNotAllowed();
      }

      const session = await getAdminSession(request, env);

      if (!session) {
        return json({ authenticated: false }, 401);
      }

      return json({
        authenticated: true,
        email: session.email,
        expiresAt: session.expiresAt,
      });
    }

    if (pathname === "/api/nightforce/admin/login") {
      if (request.method !== "POST") {
        return methodNotAllowed();
      }

      try {
        let rawBody: unknown;

        try {
          rawBody = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const input = adminLoginInputSchema.parse(rawBody);
        const ownerEmail = getConfiguredAdminSecret(env.ADMIN_OWNER_EMAIL);
        const ownerPassword = getConfiguredAdminSecret(env.ADMIN_OWNER_PASSWORD);

        if (!ownerEmail || !ownerPassword) {
          return json(
            {
              error: "Admin login is not configured",
            },
            500,
          );
        }

        const emailMatches =
          input.email.trim().toLowerCase() === ownerEmail.toLowerCase();
        const passwordMatches = safeStringEqual(input.password, ownerPassword);

        if (!emailMatches || !passwordMatches) {
          return json({ error: "Invalid admin email or password" }, 401);
        }

        const token = await createAdminSessionToken(env, ownerEmail);

        return jsonWithHeaders(
          {
            authenticated: true,
            email: ownerEmail,
          },
          200,
          {
            "set-cookie": buildAdminSessionCookie(token),
          },
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid admin login input",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to log in",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (pathname === "/api/nightforce/admin/logout") {
      if (request.method !== "POST") {
        return methodNotAllowed();
      }

      return jsonWithHeaders(
        {
          authenticated: false,
        },
        200,
        {
          "set-cookie": buildClearAdminSessionCookie(),
        },
      );
    }

    if (
      pathname === "/api/nightforce/visitor-activity" &&
      request.method === "POST"
    ) {
      try {
        let rawBody: unknown = {};

        try {
          rawBody = await request.json();
        } catch {}

        const input = visitorActivityInputSchema.parse(rawBody);
        const path = normalizeVisitorActivityPath(input.path);

        if (!shouldStoreVisitorActivityPath(path)) {
          return json({
            skipped: true,
            reason: "Path is not eligible for public visitor activity.",
          });
        }

        const { countryCode, countryName } = getCountryFromRequest(request);
        const now = new Date().toISOString();

        await pruneOldVisitorActivity(db);

        const [activity] = await db
          .insert(visitorActivityTable)
          .values({
            alias: createVisitorAlias(),
            countryCode,
            countryName,
            path,
            createdAt: now,
          })
          .returning();

        return json({ activity }, 201);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid visitor activity input",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to create visitor activity",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      pathname === "/api/nightforce/visitor-activity/recent" &&
      request.method === "GET"
    ) {
      try {
        const limit = getVisitorActivityLimit(url);

        await pruneOldVisitorActivity(db);

        const activities = await db
          .select()
          .from(visitorActivityTable)
          .orderBy(desc(visitorActivityTable.createdAt))
          .limit(limit);

        return json({ activities });
      } catch (error) {
        return json(
          {
            error: "Failed to list visitor activity",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      pathname === "/api/nightforce/admin/verification-requests" &&
      request.method === "GET"
    ) {
      const adminError = await requireAdminSession(request, env);

      if (adminError) {
        return adminError;
      }

      try {
        const requests = await db
          .select()
          .from(verificationRequestsTable)
          .orderBy(desc(verificationRequestsTable.createdAt));

        return json({ requests });
      } catch (error) {
        return json(
          {
            error: "Failed to list verification requests",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      pathname === "/api/nightforce/verification-requests" &&
      request.method === "POST"
    ) {
      try {
        let rawBody: unknown;

        try {
          rawBody = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const input = createVerificationRequestInputSchema.parse(rawBody);

        if (input.midnightWalletAddress) {
          const [existingRequest] = await db
            .select()
            .from(verificationRequestsTable)
            .where(
              eq(
                verificationRequestsTable.midnightWalletAddress,
                input.midnightWalletAddress,
              ),
            )
            .limit(1);

          if (existingRequest) {
            return json({ request: existingRequest });
          }
        }

        const [created] = await db
          .insert(verificationRequestsTable)
          .values({
            discordHandle: input.discordHandle,
            region: input.region,
            note: input.note ?? "",
            midnightWalletAddress: input.midnightWalletAddress ?? null,
            status: "pending",
            adminNotes: "",
          })
          .returning();

        return json({ request: created });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid verification request input",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to create verification request",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      pathname === "/api/nightforce/uploads/avatar" &&
      request.method === "POST"
    ) {
      try {
        let formData: FormData;

        try {
          formData = await request.formData();
        } catch {
          return json({ error: "Invalid multipart form data" }, 400);
        }

        const file = formData.get("file");

        if (!(file instanceof File)) {
          return json({ error: "Avatar file is required" }, 400);
        }

        if (!AVATAR_ALLOWED_TYPES.has(file.type)) {
          return json(
            {
              error: "Invalid avatar file type",
              details: "Accepted file types: JPG, PNG, WebP",
            },
            400,
          );
        }

        if (file.size > AVATAR_MAX_BYTES) {
          return json(
            {
              error: "Avatar file is too large",
              details: "Maximum file size is 500 KB",
            },
            400,
          );
        }

        const objectKey = createAvatarObjectKey(file.type);

        await env.PROFILE_IMAGES.put(objectKey, await file.arrayBuffer(), {
          httpMetadata: {
            contentType: file.type,
          },
          customMetadata: {
            uploadedAt: new Date().toISOString(),
          },
        });

        return json({
          avatarUrl: buildAvatarImageUrl(url, objectKey),
          objectKey,
        });
      } catch (error) {
        return json(
          {
            error: "Failed to upload avatar",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }


    if (
      parts.length === 5 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "verification-requests" &&
      parts[3] === "by-wallet" &&
      request.method === "GET"
    ) {
      try {
        const walletAddress = z.string().trim().min(1).parse(parts[4]);

        const [requestRecord] = await db
          .select()
          .from(verificationRequestsTable)
          .where(eq(verificationRequestsTable.midnightWalletAddress, walletAddress))
          .limit(1);

        if (!requestRecord) {
          return json({ error: "Verification request not found" }, 404);
        }

        return json({ request: requestRecord });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid wallet address",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to get verification request by wallet",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }


    if (
      parts.length === 4 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "images" &&
      request.method === "GET"
    ) {
      try {
        const objectKey = z.string().trim().min(1).parse(parts[3]);
        const object = await env.PROFILE_IMAGES.get(objectKey);

        if (!object || !object.body) {
          return json({ error: "Image not found" }, 404);
        }

        const headers = new Headers();
        headers.set("access-control-allow-origin", "*");
        headers.set("cache-control", "public, max-age=31536000, immutable");
        headers.set(
          "content-type",
          object.httpMetadata?.contentType ?? "application/octet-stream",
        );

        return new Response(object.body, {
          status: 200,
          headers,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid image key",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to load image",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      parts.length === 4 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "verification-requests" &&
      request.method === "GET"
    ) {
      try {
        const id = uuidSchema.parse(parts[3]);

        const [record] = await db
          .select()
          .from(verificationRequestsTable)
          .where(eq(verificationRequestsTable.id, id))
          .limit(1);

        if (!record) {
          return json({ error: "Verification request not found" }, 404);
        }

        return json({ request: record });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid verification request id",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to get verification request",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      parts.length === 6 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "admin" &&
      parts[3] === "verification-requests" &&
      parts[5] === "approve" &&
      request.method === "POST"
    ) {
      const adminError = await requireAdminSession(request, env);

      if (adminError) {
        return adminError;
      }

      try {
        const id = uuidSchema.parse(parts[4]);
        let rawBody: unknown = {};

        try {
          rawBody = await request.json();
        } catch {}

        const input = reviewVerificationRequestInputSchema.parse(rawBody);
        const now = new Date().toISOString();

        const [existing] = await db
          .select()
          .from(verificationRequestsTable)
          .where(eq(verificationRequestsTable.id, id))
          .limit(1);

        if (!existing) {
          return json({ error: "Verification request not found" }, 404);
        }

        const [updated] = await db
          .update(verificationRequestsTable)
          .set({
            status: verificationStatusSchema.parse("approved"),
            adminNotes: input.adminNotes ?? "",
            reviewedAt: now,
            updatedAt: now,
          })
          .where(eq(verificationRequestsTable.id, id))
          .returning();

        return json({ request: updated });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid approval input",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to approve verification request",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      parts.length === 6 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "admin" &&
      parts[3] === "verification-requests" &&
      parts[5] === "reject" &&
      request.method === "POST"
    ) {
      const adminError = await requireAdminSession(request, env);

      if (adminError) {
        return adminError;
      }

      try {
        const id = uuidSchema.parse(parts[4]);
        let rawBody: unknown = {};

        try {
          rawBody = await request.json();
        } catch {}

        const input = reviewVerificationRequestInputSchema.parse(rawBody);
        const now = new Date().toISOString();

        const [existing] = await db
          .select()
          .from(verificationRequestsTable)
          .where(eq(verificationRequestsTable.id, id))
          .limit(1);

        if (!existing) {
          return json({ error: "Verification request not found" }, 404);
        }

        const [updated] = await db
          .update(verificationRequestsTable)
          .set({
            status: verificationStatusSchema.parse("rejected"),
            adminNotes: input.adminNotes ?? "",
            reviewedAt: now,
            updatedAt: now,
          })
          .where(eq(verificationRequestsTable.id, id))
          .returning();

        return json({ request: updated });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid rejection input",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to reject verification request",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      pathname === "/api/nightforce/wallet-bindings" &&
      request.method === "POST"
    ) {
      try {
        let rawBody: unknown;

        try {
          rawBody = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const input = createWalletBindingInputSchema.parse(rawBody);

        const [requestRecord] = await db
          .select()
          .from(verificationRequestsTable)
          .where(eq(verificationRequestsTable.id, input.verificationRequestId))
          .limit(1);

        if (!requestRecord) {
          return json({ error: "Verification request not found" }, 404);
        }

        if (requestRecord.status !== "approved") {
          return json(
            {
              error: "Only approved verification requests can bind a wallet",
            },
            400,
          );
        }

        if (
          requestRecord.midnightWalletAddress &&
          requestRecord.midnightWalletAddress !== input.midnightWalletAddress
        ) {
          return json(
            {
              error:
                "This verification request belongs to a different Midnight wallet address.",
            },
            409,
          );
        }

        const [binding] = await db
          .insert(walletBindingsTable)
          .values({
            verificationRequestId: input.verificationRequestId,
            midnightWalletAddress: input.midnightWalletAddress,
            isActive: "true",
          })
          .returning();

        return json({ binding });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid wallet binding input",
              details: error.flatten(),
            },
            400,
          );
        }

        if (isSqliteUniqueError(error)) {
          return json(
            {
              error: "Wallet binding already exists",
              details: getErrorMessage(error),
            },
            409,
          );
        }

        return json(
          {
            error: "Failed to create wallet binding",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      parts.length === 5 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "wallet-bindings" &&
      parts[3] === "by-wallet" &&
      request.method === "GET"
    ) {
      try {
        const walletAddress = z.string().trim().min(1).parse(parts[4]);

        const [binding] = await db
          .select()
          .from(walletBindingsTable)
          .where(eq(walletBindingsTable.midnightWalletAddress, walletAddress))
          .limit(1);

        if (!binding) {
          return json({ error: "Wallet binding not found" }, 404);
        }

        return json({ binding });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid wallet address",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to get wallet binding",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      parts.length === 4 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "profiles" &&
      request.method === "GET"
    ) {
      try {
        const verificationRequestId = uuidSchema.parse(parts[3]);

        const [profile] = await db
          .select()
          .from(profilesTable)
          .where(eq(profilesTable.verificationRequestId, verificationRequestId))
          .limit(1);

        if (!profile) {
          return json({ error: "Profile not found" }, 404);
        }

        return json({ profile });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid verification request id",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to get profile",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      parts.length === 4 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "profiles" &&
      request.method === "PUT"
    ) {
      try {
        const verificationRequestId = uuidSchema.parse(parts[3]);
        let rawBody: unknown;

        try {
          rawBody = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const input = upsertProfileInputSchema.parse(rawBody);
        const now = new Date().toISOString();

        const [requestRecord] = await db
          .select()
          .from(verificationRequestsTable)
          .where(eq(verificationRequestsTable.id, verificationRequestId))
          .limit(1);

        if (!requestRecord) {
          return json({ error: "Verification request not found" }, 404);
        }

        if (requestRecord.status !== "approved") {
          return json(
            {
              error:
                "Only approved verification requests can create or update a profile",
            },
            400,
          );
        }

        const [binding] = await db
          .select()
          .from(walletBindingsTable)
          .where(eq(walletBindingsTable.id, input.walletBindingId))
          .limit(1);

        if (!binding) {
          return json({ error: "Wallet binding not found" }, 404);
        }

        if (binding.verificationRequestId !== verificationRequestId) {
          return json(
            {
              error: "Wallet binding does not belong to this verification request",
            },
            400,
          );
        }

        if (binding.isActive !== "true") {
          return json({ error: "Wallet binding is inactive" }, 400);
        }

        const [existingProfile] = await db
          .select()
          .from(profilesTable)
          .where(eq(profilesTable.verificationRequestId, verificationRequestId))
          .limit(1);

        const nextPublicId =
          normalizeOptionalString(input.publicId) ??
          existingProfile?.publicId ??
          createPublicId();

        const nextSlug =
          input.slug === undefined
            ? (existingProfile?.slug ?? null)
            : normalizeSlug(input.slug);

        const nextDisplayName =
          input.displayName === undefined
            ? (existingProfile?.displayName ?? null)
            : normalizeOptionalString(input.displayName);

        const nextRegion =
          input.region === undefined
            ? (existingProfile?.region ?? null)
            : normalizeOptionalString(input.region);

        const nextCountry =
          input.country === undefined
            ? (existingProfile?.country ?? null)
            : normalizeOptionalString(input.country);

        const nextRole =
          input.role === undefined
            ? (existingProfile?.role ?? null)
            : normalizeOptionalString(input.role);

        const nextBio =
          input.bio === undefined
            ? (existingProfile?.bio ?? null)
            : normalizeOptionalString(input.bio);

        const nextAvatarUrl =
          input.avatarUrl === undefined
            ? (existingProfile?.avatarUrl ?? null)
            : normalizeOptionalString(input.avatarUrl);

        const nextWebsiteUrl =
          input.websiteUrl === undefined
            ? (existingProfile?.websiteUrl ?? null)
            : normalizeOptionalString(input.websiteUrl);

        const nextNightDomain =
          input.nightDomain === undefined
            ? (existingProfile?.nightDomain ?? null)
            : normalizeNightDomain(input.nightDomain);

        const nextPublicEmail =
          input.publicEmail === undefined
            ? (existingProfile?.publicEmail ?? null)
            : normalizeOptionalString(input.publicEmail);

        const nextSocials =
          input.socials === undefined
            ? (existingProfile?.socials ?? [])
            : normalizeSocials(input.socials);

        const nextEncryptedHiddenPayload =
          input.encryptedHiddenPayload === undefined
            ? (existingProfile?.encryptedHiddenPayload ?? null)
            : input.encryptedHiddenPayload;

        const nextPublishState =
          input.publishState ?? existingProfile?.publishState ?? "draft";

        if (existingProfile) {
          const [updated] = await db
            .update(profilesTable)
            .set({
              walletBindingId: input.walletBindingId,
              publicId: nextPublicId,
              slug: nextSlug,
              displayName: nextDisplayName,
              region: nextRegion,
              country: nextCountry,
              role: nextRole,
              bio: nextBio,
              avatarUrl: nextAvatarUrl,
              websiteUrl: nextWebsiteUrl,
              nightDomain: nextNightDomain,
              publicEmail: nextPublicEmail,
              socials: nextSocials,
              fieldVisibility: input.fieldVisibility,
              encryptedHiddenPayload: nextEncryptedHiddenPayload,
              requestedVisibility: input.requestedVisibility,
              publishState: nextPublishState,
              updatedAt: now,
              publishedAt:
                nextPublishState === "published"
                  ? (existingProfile.publishedAt ?? now)
                  : null,
              inactiveAt:
                nextPublishState === "inactive"
                  ? (existingProfile.inactiveAt ?? now)
                  : null,
            })
            .where(eq(profilesTable.id, existingProfile.id))
            .returning();

          return json({ profile: updated });
        }

        const [created] = await db
          .insert(profilesTable)
          .values({
            verificationRequestId,
            walletBindingId: input.walletBindingId,
            publicId: nextPublicId,
            slug: nextSlug,
            displayName: nextDisplayName,
            region: nextRegion,
            country: nextCountry,
            role: nextRole,
            bio: nextBio,
            avatarUrl: nextAvatarUrl,
            websiteUrl: nextWebsiteUrl,
            nightDomain: nextNightDomain,
            publicEmail: nextPublicEmail,
            contactModeContractAddress: null,
            contactModeSyncStatus: "not_created",
            contactModeLastSyncedAt: null,
            contactModeSyncError: null,
            contactModeSyncedValue: null,
            socials: nextSocials,
            fieldVisibility: input.fieldVisibility,
            encryptedHiddenPayload: nextEncryptedHiddenPayload,
            requestedVisibility: input.requestedVisibility,
            publishState: nextPublishState,
            publishedAt: nextPublishState === "published" ? now : null,
            inactiveAt: nextPublishState === "inactive" ? now : null,
          })
          .returning();

        return json({ profile: created });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid profile input",
              details: error.flatten(),
            },
            400,
          );
        }

        if (isSqliteUniqueError(error)) {
          return json(
            {
              error: "Profile publicId or slug already exists",
              details: getErrorMessage(error),
            },
            409,
          );
        }

        return json(
          {
            error: "Failed to create or update profile",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      parts.length === 5 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "profiles" &&
      parts[4] === "contact-mode-sync" &&
      request.method === "POST"
    ) {
      try {
        const verificationRequestId = uuidSchema.parse(parts[3]);
        let rawBody: unknown;

        try {
          rawBody = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const input = updateContactModeSyncInputSchema.parse(rawBody);
        const now = new Date().toISOString();

        const [existingProfile] = await db
          .select()
          .from(profilesTable)
          .where(eq(profilesTable.verificationRequestId, verificationRequestId))
          .limit(1);

        if (!existingProfile) {
          return json({ error: "Profile not found" }, 404);
        }

        const [updated] = await db
          .update(profilesTable)
          .set({
            contactModeContractAddress: input.contactModeContractAddress ?? null,
            contactModeSyncStatus: input.contactModeSyncStatus,
            contactModeLastSyncedAt: input.contactModeLastSyncedAt ?? null,
            contactModeSyncError: input.contactModeSyncError ?? null,
            contactModeSyncedValue:
              input.contactModeSyncStatus === "synced"
                ? input.contactModeSyncedValue ?? null
                : existingProfile.contactModeSyncedValue ?? null,
            updatedAt: now,
          })
          .where(eq(profilesTable.id, existingProfile.id))
          .returning();

        return json({ profile: updated });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid contact-mode sync input",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to update contact-mode sync metadata",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (pathname === "/api/nightforce/directory" && request.method === "GET") {
      try {
        const profiles = await db
          .select()
          .from(profilesTable)
          .where(
            and(
              eq(profilesTable.publishState, "published"),
              eq(profilesTable.requestedVisibility, "public"),
            ),
          )
          .orderBy(desc(profilesTable.publishedAt), desc(profilesTable.updatedAt));

        return json({
          profiles: profiles.map(toPublicProfile),
        });
      } catch (error) {
        return json(
          {
            error: "Failed to list directory profiles",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (
      parts.length === 4 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "public-profiles" &&
      request.method === "GET"
    ) {
      try {
        const publicId = z.string().trim().min(1).parse(parts[3]);

        const [profile] = await db
          .select()
          .from(profilesTable)
          .where(
            and(
              eq(profilesTable.publicId, publicId),
              eq(profilesTable.publishState, "published"),
              eq(profilesTable.requestedVisibility, "public"),
            ),
          )
          .limit(1);

        if (!profile) {
          return json({ error: "Public profile not found" }, 404);
        }

        return json({
          profile: toPublicProfile(profile),
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: "Invalid public id",
              details: error.flatten(),
            },
            400,
          );
        }

        return json(
          {
            error: "Failed to get public profile",
            details: getErrorMessage(error),
          },
          500,
        );
      }
    }

    if (pathname.startsWith("/api/nightforce/")) {
      return methodNotAllowed();
    }

    return notFound();
  },
};