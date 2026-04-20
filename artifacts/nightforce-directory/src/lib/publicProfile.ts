import type { PublicProfile, AppStore } from "../types";

export function derivePublicProfile(
  walletId: string,
  store: AppStore
): PublicProfile | null {
  const profileData = store.profiles.find((p) => p.walletId === walletId);
  const vis = store.visibilitySettings.find((v) => v.walletId === walletId);
  const isVerified = store.approvedWallets.includes(walletId);

  if (!profileData || !vis) return null;

  const publicId = walletId;

  if (vis.profileVisibility === "hidden") {
    return {
      publicId,
      walletId,
      visibility: "hidden",
      displayName: null,
      country: null,
      role: null,
      bio: null,
      isVerified,
    };
  }

  const isAnonymous = vis.profileVisibility === "anonymous";

  return {
    publicId,
    walletId,
    visibility: vis.profileVisibility,
    displayName: isAnonymous ? null : vis.showDisplayName ? profileData.displayName || null : null,
    country: vis.showCountry ? profileData.country || null : null,
    role: vis.showRole ? profileData.role || null : null,
    bio: vis.showBio ? profileData.bio || null : null,
    isVerified,
  };
}

export function getAllPublicProfiles(store: AppStore): PublicProfile[] {
  return store.approvedWallets
    .map((walletId) => derivePublicProfile(walletId, store))
    .filter((p): p is PublicProfile => p !== null && p.visibility !== "hidden");
}
