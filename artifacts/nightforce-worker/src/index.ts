import { and, desc, eq } from "drizzle-orm";
import {
  getDb,
  profilesTable,
  verificationRequestsTable,
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

const createVerificationRequestInputSchema = z.object({
  discordHandle: z.string().trim().min(1),
  region: z.string().trim().min(1),
  note: z.string().trim().optional(),
});

const reviewVerificationRequestInputSchema = z.object({
  adminNotes: z.string().trim().optional(),
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
  publicId: z.string().trim().min(1).optional(),
  slug: z.string().trim().optional().nullable(),
  displayName: z.string().trim().optional().nullable(),
  region: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  role: z.string().trim().optional().nullable(),
  bio: z.string().trim().optional().nullable(),
  avatarUrl: z.string().trim().optional().nullable(),
  websiteUrl: z.string().trim().optional().nullable(),
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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

function notFound(): Response {
  return json({ error: "Not found" }, 404);
}

function methodNotAllowed(): Response {
  return json({ error: "Method not allowed" }, 405);
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

  if (value.startsWith("https://x.com/")) {
    return "x";
  }

  if (value.startsWith("https://youtube.com/@")) {
    return "youtube";
  }

  if (value.startsWith("discord:")) {
    return "discord";
  }

  if (value.startsWith("https://t.me/")) {
    return "telegram";
  }

  return null;
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

    if (
      pathname === "/api/nightforce/verification-requests" &&
      request.method === "GET"
    ) {
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

        const [created] = await db
          .insert(verificationRequestsTable)
          .values({
            discordHandle: input.discordHandle,
            region: input.region,
            note: input.note ?? "",
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
      parts.length === 5 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "verification-requests" &&
      parts[4] === "approve" &&
      request.method === "POST"
    ) {
      try {
        const id = uuidSchema.parse(parts[3]);
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
      parts.length === 5 &&
      parts[0] === "api" &&
      parts[1] === "nightforce" &&
      parts[2] === "verification-requests" &&
      parts[4] === "reject" &&
      request.method === "POST"
    ) {
      try {
        const id = uuidSchema.parse(parts[3]);
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