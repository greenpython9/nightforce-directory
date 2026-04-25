import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";

export type VerificationStatus = "pending" | "approved" | "rejected";
export type PublishState = "draft" | "published" | "inactive";
export type TrustedVisibility = "public" | "hidden";

export interface FieldVisibility {
  avatarUrl: "public" | "hidden";
  displayName: "public" | "hidden";
  region: "public" | "hidden";
  country: "public" | "hidden";
  role: "public" | "hidden";
  bio: "public" | "hidden";
  websiteUrl: "public" | "hidden";
  email: "public" | "hidden";
  x: "public" | "hidden";
  youtube: "public" | "hidden";
  discord: "public" | "hidden";
  telegram: "public" | "hidden";
  realName: "hidden";
  contact: "hidden";
}

export interface EncryptedHiddenPayload {
  version: number;
  algorithm: "AES-GCM";
  kdf: "PBKDF2";
  hash: "SHA-256";
  iterations: number;
  saltBase64: string;
  ivBase64: string;
  ciphertextBase64: string;
}

const createId = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();

export const verificationRequestsTable = sqliteTable("verification_requests", {
  id: text("id").primaryKey().$defaultFn(createId),
  discordHandle: text("discord_handle").notNull(),
  region: text("region").notNull(),
  note: text("note").notNull().$defaultFn(() => ""),
  status: text("status")
    .$type<VerificationStatus>()
    .notNull()
    .$defaultFn(() => "pending"),
  adminNotes: text("admin_notes").notNull().$defaultFn(() => ""),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
  reviewedAt: text("reviewed_at"),
  updatedAt: text("updated_at").notNull().$defaultFn(nowIso),
});

export const walletBindingsTable = sqliteTable("wallet_bindings", {
  id: text("id").primaryKey().$defaultFn(createId),
  verificationRequestId: text("verification_request_id")
    .notNull()
    .unique()
    .references(() => verificationRequestsTable.id, {
      onDelete: "cascade",
    }),
  midnightWalletAddress: text("midnight_wallet_address").notNull().unique(),
  boundAt: text("bound_at").notNull().$defaultFn(nowIso),
  isActive: text("is_active")
    .$type<"true" | "false">()
    .notNull()
    .$defaultFn(() => "true"),
  updatedAt: text("updated_at").notNull().$defaultFn(nowIso),
});

export const profilesTable = sqliteTable("profiles", {
  id: text("id").primaryKey().$defaultFn(createId),
  verificationRequestId: text("verification_request_id")
    .notNull()
    .unique()
    .references(() => verificationRequestsTable.id, {
      onDelete: "cascade",
    }),
  walletBindingId: text("wallet_binding_id")
    .notNull()
    .unique()
    .references(() => walletBindingsTable.id, {
      onDelete: "cascade",
    }),

  publicId: text("public_id").notNull().unique(),
  slug: text("slug").unique(),

  displayName: text("display_name"),
  region: text("region"),
  country: text("country"),
  role: text("role"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  websiteUrl: text("website_url"),
  publicEmail: text("public_email"),
  contactModeContractAddress: text("contact_mode_contract_address"),
  contactModeSyncStatus: text("contact_mode_sync_status")
    .notNull()
    .default("not_created"),
  contactModeLastSyncedAt: text("contact_mode_last_synced_at"),
  contactModeSyncError: text("contact_mode_sync_error"),
  contactModeSyncedValue: text("contact_mode_synced_value").$type<
    "NO_CONTACT" | "PRIVATE_CONTACT_AVAILABLE" | "PUBLIC_CONTACT_ALLOWED" | null
  >(),
  socials: text("socials", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),

  fieldVisibility: text("field_visibility", { mode: "json" })
    .$type<FieldVisibility>()
    .notNull(),
  encryptedHiddenPayload: text("encrypted_hidden_payload", { mode: "json" })
    .$type<EncryptedHiddenPayload | null>(),

  publishState: text("publish_state")
    .$type<PublishState>()
    .notNull()
    .$defaultFn(() => "draft"),
  requestedVisibility: text("requested_visibility")
    .$type<TrustedVisibility>()
    .notNull()
    .$defaultFn(() => "public"),

  createdAt: text("created_at").notNull().$defaultFn(nowIso),
  updatedAt: text("updated_at").notNull().$defaultFn(nowIso),
  publishedAt: text("published_at"),
  inactiveAt: text("inactive_at"),
});

export const visitorActivityTable = sqliteTable("visitor_activity", {
  id: text("id").primaryKey().$defaultFn(createId),
  alias: text("alias").notNull(),
  countryCode: text("country_code").notNull().$defaultFn(() => "XX"),
  countryName: text("country_name").notNull().$defaultFn(() => "Unknown"),
  path: text("path").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
});

export const insertVerificationRequestSchema = createInsertSchema(
  verificationRequestsTable,
).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  updatedAt: true,
});

export const insertWalletBindingSchema = createInsertSchema(
  walletBindingsTable,
).omit({
  id: true,
  boundAt: true,
  updatedAt: true,
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  inactiveAt: true,
});

export const insertVisitorActivitySchema = createInsertSchema(
  visitorActivityTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertVerificationRequest = z.infer<
  typeof insertVerificationRequestSchema
>;
export type VerificationRequest =
  typeof verificationRequestsTable.$inferSelect;

export type InsertWalletBinding = z.infer<typeof insertWalletBindingSchema>;
export type WalletBinding = typeof walletBindingsTable.$inferSelect;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;

export type InsertVisitorActivity = z.infer<
  typeof insertVisitorActivitySchema
>;
export type VisitorActivity = typeof visitorActivityTable.$inferSelect;