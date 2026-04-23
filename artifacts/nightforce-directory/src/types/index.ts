export type WalletStatus = "disconnected" | "connected";

export type VerificationStatus =
  | "not_verified"
  | "pending"
  | "approved"
  | "rejected";

export type ProfileVisibility =
  | "public"
  | "anonymous"
  | "hidden";

export type ContactMode =
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED";

export interface WalletState {
  walletId: string | null;
  status: WalletStatus;
}

export interface VerificationRequest {
  id: string;
  walletId: string;
  discordHandle: string;
  region: string;
  note: string;
  status: VerificationStatus;
  adminNotes: string;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ProfileData {
  walletId: string;
  publicId: string;
  displayName: string;
  country: string;
  role: string;
  bio: string;
}

export interface VisibilitySettings {
  walletId: string;
  profileVisibility: ProfileVisibility;
  showDisplayName: boolean;
  showCountry: boolean;
  showRole: boolean;
  showBio: boolean;
}

export interface PublicProfile {
  publicId: string;
  walletId: string;
  visibility: ProfileVisibility;
  displayName: string | null;
  region: string | null;
  country: string | null;
  role: string | null;
  bio: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
  publicEmail?: string | null;
  contactMode?: ContactMode;
  socials?: string[];
  isVerified: boolean;
}

export interface AppStore {
  verificationRequests: VerificationRequest[];
  profiles: ProfileData[];
  visibilitySettings: VisibilitySettings[];
  approvedWallets: string[];
}