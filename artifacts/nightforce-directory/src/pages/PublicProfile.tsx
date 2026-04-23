import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import type { PublicProfile as PublicProfileType } from "../types";

const API_BASE_URL = "http://127.0.0.1:8787";

type BackendPublicProfile = {
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
  contactMode: "NO_CONTACT" | "PRIVATE_CONTACT_AVAILABLE" | "PUBLIC_CONTACT_ALLOWED";
  socials: string[];
  requestedVisibility: "public" | "hidden";
  publishState: "draft" | "published" | "inactive";
};

type PublicProfileResponse = {
  profile: BackendPublicProfile;
};

function toPublicProfile(profile: BackendPublicProfile): PublicProfileType {
  return {
    publicId: profile.publicId,
    walletId: "",
    visibility: profile.displayName ? "public" : "anonymous",
    displayName: profile.displayName,
    region: profile.region,
    country: profile.country,
    role: profile.role,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    websiteUrl: profile.websiteUrl,
    publicEmail: profile.publicEmail,
    contactMode: profile.contactMode,
    socials: profile.socials,
    isVerified: true,
  };
}

function formatContactMode(value: PublicProfileType["contactMode"]): string {
  switch (value) {
    case "PRIVATE_CONTACT_AVAILABLE":
      return "Private contact available";
    case "PUBLIC_CONTACT_ALLOWED":
      return "Public contact allowed";
    case "NO_CONTACT":
      return "No contact available";
    default:
      return "No contact available";
  }
}

function formatSocial(
  social: string,
): { label: string; href: string | null; text: string } {
  const value = social.trim();

  if (value.startsWith("https://x.com/")) {
    const username = value.replace("https://x.com/", "").trim();
    return {
      label: "X",
      href: value,
      text: username ? `@${username}` : value,
    };
  }

  if (value.startsWith("https://youtube.com/@")) {
    const handle = value.replace("https://youtube.com/@", "").trim();
    return {
      label: "YouTube",
      href: value,
      text: handle ? `@${handle}` : value,
    };
  }

  if (value.startsWith("discord:")) {
    const username = value.replace("discord:", "").trim();
    return {
      label: "Discord",
      href: null,
      text: username || value,
    };
  }

  if (value.startsWith("https://t.me/")) {
    const username = value.replace("https://t.me/", "").trim();
    return {
      label: "Telegram",
      href: value,
      text: username ? `@${username}` : value,
    };
  }

  return {
    label: "Link",
    href: value,
    text: value,
  };
}

export function PublicProfile() {
  const { publicId } = useParams<{ publicId: string }>();
  const [profile, setProfile] = useState<PublicProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!publicId) {
        setProfile(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setNotFound(false);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/nightforce/public-profiles/${encodeURIComponent(publicId)}`,
        );

        let payload: unknown = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (response.status === 404) {
          if (!cancelled) {
            setProfile(null);
            setNotFound(true);
          }
          return;
        }

        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "Failed to load public profile.";

          throw new Error(message);
        }

        const data = payload as PublicProfileResponse;

        if (!cancelled) {
          setProfile(toPublicProfile(data.profile));
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setError(
            err instanceof Error ? err.message : "Failed to load public profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [publicId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-zinc-800 rounded-lg p-8 bg-zinc-900 text-center">
          <div className="text-zinc-400 font-mono text-sm font-semibold mb-2">
            Loading Profile
          </div>
          <p className="text-zinc-600 font-mono text-xs">
            Fetching public profile data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-zinc-800 rounded-lg p-8 bg-zinc-900 text-center">
          <div className="text-red-400 font-mono text-sm font-semibold mb-2">
            Failed to Load Profile
          </div>
          <p className="text-zinc-600 font-mono text-xs">
            {error}
          </p>
          <Link
            href="/directory"
            className="inline-block mt-4 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  if (!profile || notFound || profile.visibility === "hidden") {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="border border-zinc-800 rounded-lg p-8 bg-zinc-900 text-center">
          <div className="text-zinc-400 font-mono text-sm font-semibold mb-2">
            Profile Unavailable
          </div>
          <p className="text-zinc-600 font-mono text-xs">
            This profile is hidden or does not exist.
          </p>
          <Link
            href="/directory"
            className="inline-block mt-4 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    profile.visibility === "anonymous"
      ? "Anonymous"
      : profile.displayName || "Anonymous";

  const formattedSocials = (profile.socials ?? []).map(formatSocial);

  const hasAnyPublicInfo =
    !!profile.contactMode ||
    !!profile.region ||
    !!profile.country ||
    !!profile.role ||
    !!profile.bio ||
    !!profile.websiteUrl ||
    !!profile.publicEmail ||
    formattedSocials.length > 0;

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <Link
        href="/directory"
        className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors mb-6 inline-block"
      >
        ← Back to Directory
      </Link>

      <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="flex items-start gap-3">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${displayName} avatar`}
                className="w-16 h-16 rounded-full object-cover border border-zinc-800 bg-zinc-950"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-lg font-mono text-zinc-500">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-xl font-mono font-bold text-white">
                {displayName}
              </h1>
              {profile.isVerified && (
                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ✓ Verified Ambassador
                </span>
              )}
            </div>
          </div>

          {profile.visibility === "anonymous" && (
            <span className="text-xs font-mono text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
              Anonymous
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 text-sm font-mono">
          {profile.contactMode && (
            <div>
              <span className="text-xs text-zinc-600 block mb-0.5 uppercase tracking-wider">
                Contact
              </span>
              <span className="text-zinc-300">{formatContactMode(profile.contactMode)}</span>
            </div>
          )}

          {profile.region && (
            <div>
              <span className="text-xs text-zinc-600 block mb-0.5 uppercase tracking-wider">
                Region
              </span>
              <span className="text-zinc-300">{profile.region}</span>
            </div>
          )}

          {profile.country && (
            <div>
              <span className="text-xs text-zinc-600 block mb-0.5 uppercase tracking-wider">
                Country
              </span>
              <span className="text-zinc-300">{profile.country}</span>
            </div>
          )}

          {profile.role && (
            <div>
              <span className="text-xs text-zinc-600 block mb-0.5 uppercase tracking-wider">
                Role / Focus
              </span>
              <span className="text-zinc-300">{profile.role}</span>
            </div>
          )}

          {profile.bio && (
            <div>
              <span className="text-xs text-zinc-600 block mb-0.5 uppercase tracking-wider">
                Bio
              </span>
              <span className="text-zinc-300 leading-relaxed">{profile.bio}</span>
            </div>
          )}

          {profile.websiteUrl && (
            <div>
              <span className="text-xs text-zinc-600 block mb-0.5 uppercase tracking-wider">
                Website
              </span>
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-300 hover:text-white break-all"
              >
                {profile.websiteUrl}
              </a>
            </div>
          )}

          {profile.publicEmail && (
            <div>
              <span className="text-xs text-zinc-600 block mb-0.5 uppercase tracking-wider">
                Email
              </span>
              <a
                href={`mailto:${profile.publicEmail}`}
                className="text-zinc-300 hover:text-white break-all"
              >
                {profile.publicEmail}
              </a>
            </div>
          )}

          {formattedSocials.length > 0 && (
            <div>
              <span className="text-xs text-zinc-600 block mb-2 uppercase tracking-wider">
                Socials
              </span>
              <div className="flex flex-col gap-2">
                {formattedSocials.map((social) => (
                  <div key={`${social.label}-${social.text}`}>
                    <span className="text-zinc-600 mr-2">{social.label}:</span>
                    {social.href ? (
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-300 hover:text-white break-all"
                      >
                        {social.text}
                      </a>
                    ) : (
                      <span className="text-zinc-300 break-all">
                        {social.text}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasAnyPublicInfo && (
            <div className="text-zinc-600 text-xs">
              No public information disclosed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}