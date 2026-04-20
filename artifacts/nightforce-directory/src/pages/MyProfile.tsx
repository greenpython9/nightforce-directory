import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../hooks/useWallet";
import { generateOpaquePublicId, loadStore, updateStore } from "../lib/storage";
import { derivePublicProfile } from "../lib/publicProfile";
import { ProfileCard } from "../components/ProfileCard";
import type { ProfileData, VisibilitySettings, ProfileVisibility } from "../types";

const DEFAULT_VISIBILITY: Omit<VisibilitySettings, "walletId"> = {
  profileVisibility: "public",
  showDisplayName: true,
  showCountry: true,
  showRole: true,
  showBio: true,
};

export function MyProfile() {
  const { walletId, verificationStatus } = useWallet();
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>("public");
  const [showDisplayName, setShowDisplayName] = useState(true);
  const [showCountry, setShowCountry] = useState(true);
  const [showRole, setShowRole] = useState(true);
  const [showBio, setShowBio] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");

  const load = useCallback(() => {
    if (!walletId) return;
    const store = loadStore();
    const profile = store.profiles.find((p) => p.walletId === walletId);
    const vis = store.visibilitySettings.find((v) => v.walletId === walletId);
    if (profile) {
      setDisplayName(profile.displayName);
      setCountry(profile.country);
      setRole(profile.role);
      setBio(profile.bio);
    }
    if (vis) {
      setProfileVisibility(vis.profileVisibility);
      setShowDisplayName(vis.showDisplayName);
      setShowCountry(vis.showCountry);
      setShowRole(vis.showRole);
      setShowBio(vis.showBio);
    } else {
      setProfileVisibility(DEFAULT_VISIBILITY.profileVisibility);
      setShowDisplayName(DEFAULT_VISIBILITY.showDisplayName);
      setShowCountry(DEFAULT_VISIBILITY.showCountry);
      setShowRole(DEFAULT_VISIBILITY.showRole);
      setShowBio(DEFAULT_VISIBILITY.showBio);
    }
  }, [walletId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!walletId) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-900">
          <p className="text-zinc-400 font-mono text-sm">Connect a wallet to view your profile.</p>
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

  const publishChanges = () => {
    if (!walletId) return;

    updateStore((store) => {
      const existingProfile = store.profiles.find((p) => p.walletId === walletId);
      const profileData: ProfileData = {
        walletId,
        publicId: existingProfile?.publicId ?? generateOpaquePublicId(),
        displayName,
        country,
        role,
        bio,
      };
      const vis: VisibilitySettings = {
        walletId,
        profileVisibility,
        showDisplayName,
        showCountry,
        showRole,
        showBio,
      };
      const newProfiles = store.profiles.filter((p) => p.walletId !== walletId);
      const newVis = store.visibilitySettings.filter((v) => v.walletId !== walletId);
      const newApproved = store.approvedWallets.includes(walletId)
        ? store.approvedWallets
        : [...store.approvedWallets, walletId];
      return {
        ...store,
        profiles: [...newProfiles, profileData],
        visibilitySettings: [...newVis, vis],
        approvedWallets: newApproved,
      };
    });

    setSaveMsg("Changes published.");
    setTimeout(() => setSaveMsg(""), 2500);
  };

  // Compute live preview
  const store = loadStore();
  const tempStore = {
    ...store,
    profiles: [...store.profiles.filter((p) => p.walletId !== walletId), { walletId, publicId: store.profiles.find((p) => p.walletId === walletId)?.publicId ?? "preview-public-id", displayName, country, role, bio }],
    visibilitySettings: [
      ...store.visibilitySettings.filter((v) => v.walletId !== walletId),
      { walletId, profileVisibility, showDisplayName, showCountry, showRole, showBio },
    ],
    approvedWallets: store.approvedWallets.includes(walletId)
      ? store.approvedWallets
      : [...store.approvedWallets, walletId],
  };
  const livePublic = derivePublicProfile(walletId, tempStore);

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-xl font-mono font-bold text-white mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Wallet/status card */}
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <div className="text-xs font-mono text-zinc-500 mb-1">Connected Wallet</div>
            <div className="font-mono text-white text-sm">{walletId}</div>
            <div className="mt-2 text-xs font-mono text-emerald-400">✓ Verified Ambassador</div>
          </div>

          {/* Profile fields */}
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <h2 className="text-sm font-mono font-semibold text-white mb-4">Profile Details</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your public display name"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Malaysia"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5">Role / Focus</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Community Builder"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief description of your ambassador work..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Visibility controls */}
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <h2 className="text-sm font-mono font-semibold text-white mb-4">Profile Visibility</h2>
            <div className="flex flex-col gap-2 mb-5">
              {(
                [
                  { value: "public", label: "Public profile", desc: "Full name and all disclosed fields are visible" },
                  { value: "anonymous", label: "Anonymous public profile", desc: "Profile appears but name shows as 'Anonymous'" },
                  { value: "hidden", label: "Hidden from public pages", desc: "Profile does not appear anywhere publicly" },
                ] as { value: ProfileVisibility; label: string; desc: string }[]
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
                    <div className="text-xs font-mono text-zinc-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <h3 className="text-xs font-mono font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
              Field Disclosure
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { label: "Show display name", value: showDisplayName, set: setShowDisplayName },
                { label: "Show country", value: showCountry, set: setShowCountry },
                { label: "Show role / focus", value: showRole, set: setShowRole },
                { label: "Show short bio", value: showBio, set: setShowBio },
              ].map((field) => (
                <label
                  key={field.label}
                  className="flex items-center justify-between p-2.5 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors"
                >
                  <span className="text-sm font-mono text-zinc-300">{field.label}</span>
                  <div
                    onClick={() => field.set(!field.value)}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                      field.value ? "bg-emerald-600" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        field.value ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Visibility summary */}
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <h2 className="text-sm font-mono font-semibold text-white mb-4">Visibility Summary</h2>
            <div className="flex flex-col gap-2">
              {visibilitySummaryItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs font-mono">
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

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={publishChanges}
              className="font-mono text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 px-4 py-2 rounded-lg transition-colors"
            >
              Publish Changes
            </button>
            {saveMsg && (
              <span className="text-xs font-mono text-emerald-400">{saveMsg}</span>
            )}
          </div>
        </div>

        {/* Right column — live preview */}
        <div className="flex flex-col gap-4">
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
            <h2 className="text-sm font-mono font-semibold text-white mb-4">Live Public Preview</h2>
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