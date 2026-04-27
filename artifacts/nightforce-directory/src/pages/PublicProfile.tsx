import {
  type ComponentType,
  type SVGProps,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ExternalLink,
  Fingerprint,
  Github,
  Globe2,
  Info,
  Instagram,
  Linkedin,
  LockKeyhole,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  UserRound,
  Youtube,
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { buildNightforceApiUrl } from "../lib/nightforceApi";
import type { PublicProfile as PublicProfileType } from "../types";
import { MidnamesProfileButton } from "../components/MidnamesProfileButton";

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
  nightDomain: string | null;
  publicEmail: string | null;
  contactMode: "NO_CONTACT" | "PRIVATE_CONTACT_AVAILABLE" | "PUBLIC_CONTACT_ALLOWED" | null;
  contactModeSyncedValue?:
    | "NO_CONTACT"
    | "PRIVATE_CONTACT_AVAILABLE"
    | "PUBLIC_CONTACT_ALLOWED"
    | null;
  socials: string[];
  requestedVisibility: "public" | "hidden";
  publishState: "draft" | "published" | "inactive";
};

type PublicProfileResponse = {
  profile: BackendPublicProfile;
};

const PROFILE_PREVIEW_PUBLIC_ID = "__nightforce_preview__";
const PROFILE_PREVIEW_STORAGE_KEY = "nightforce:public-profile-preview:v1";

type SocialIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type SocialLink = {
  href: string | null;
  label: string;
  text: string;
  Icon: SocialIconComponent;
};

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M17.53 3H21l-7.59 8.67L22.34 21h-6.99l-5.47-6.8L3.62 21H.15l8.12-9.28L-.29 3h7.16l4.94 6.16L17.53 3Zm-1.22 16.36h1.92L5.82 4.55H3.76l12.55 14.81Z" />
    </svg>
  );
}

function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.078.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.249.077.077 0 0 0-.078-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.04.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.211 0 2.176 1.094 2.157 2.418 0 1.334-.955 2.419-2.157 2.419Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.211 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z" />
    </svg>
  );
}

function resolveContactMode(
  profile: BackendPublicProfile,
): PublicProfileType["contactMode"] {
  if (profile.contactMode) {
    return profile.contactMode;
  }

  if (profile.contactModeSyncedValue) {
    return profile.contactModeSyncedValue;
  }

  if (profile.publicEmail) {
    return "PUBLIC_CONTACT_ALLOWED";
  }

  return "NO_CONTACT";
}

function readPreviewProfileFromStorage(): PublicProfileType | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_PREVIEW_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      profile?: Partial<PublicProfileType>;
    };

    if (!parsed.profile || typeof parsed.profile.publicId !== "string") {
      return null;
    }

    return parsed.profile as PublicProfileType;
  } catch {
    return null;
  }
}

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
    nightDomain: profile.nightDomain,
    publicEmail: profile.publicEmail,
    contactMode: resolveContactMode(profile),
    socials: profile.socials,
    isVerified: true,
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "NF"
  );
}

function normalizeExternalHref(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function formatWebsiteLabel(value: string): string {
  try {
    const url = new URL(normalizeExternalHref(value));
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function formatSocial(social: string): SocialLink | null {
  const value = social.trim();

  try {
    const url = new URL(normalizeExternalHref(value));
    const href = url.toString();
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.replace(/^\/+/, "");

    if ((host === "x.com" || host === "twitter.com") && path) {
      const username = path.split("/")[0] ?? "";

      return {
        label: "X",
        href,
        text: username ? `@${username}` : "X profile",
        Icon: XIcon,
      };
    }

    if (
      host === "youtube.com" &&
      (path.startsWith("@") ||
        path.startsWith("channel/") ||
        path.startsWith("c/") ||
        path.startsWith("user/"))
    ) {
      return {
        label: "YouTube",
        href,
        text: path.startsWith("@") ? path.split("/")[0] ?? "YouTube" : "YouTube",
        Icon: Youtube,
      };
    }

    if (
      host === "discord.gg" ||
      (host === "discord.com" && path.startsWith("invite/"))
    ) {
      return {
        label: "Discord",
        href,
        text: "Discord",
        Icon: DiscordIcon,
      };
    }

    if ((host === "t.me" || host === "telegram.me") && path) {
      const username = path.split("/")[0] ?? "";

      return {
        label: "Telegram",
        href,
        text: username ? `@${username.replace(/^\+/, "")}` : "Telegram",
        Icon: Send,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function getContactContent(profile: PublicProfileType): {
  label: string;
  title: string;
  description: string;
  Icon: SocialIconComponent;
  accentClassName: string;
} {
  if (profile.contactMode === "PUBLIC_CONTACT_ALLOWED" && profile.publicEmail) {
    return {
      label: "Public access",
      title: profile.publicEmail,
      description:
        "This profile has chosen to display a public email address.",
      Icon: Mail,
      accentClassName: "border-emerald-800/70 bg-emerald-950/25 text-emerald-300",
    };
  }

  if (profile.contactMode === "PRIVATE_CONTACT_AVAILABLE") {
    return {
      label: "Private contact",
      title: "Private contact available",
      description:
        "This profile supports a privacy-aware contact path, but does not display a public email address.",
      Icon: LockKeyhole,
      accentClassName: "border-sky-800/70 bg-sky-950/25 text-sky-300",
    };
  }

  return {
    label: "Contact unavailable",
    title: "No public contact method",
    description:
      "This profile has not enabled a public or private contact path.",
    Icon: Ban,
    accentClassName: "border-zinc-800 bg-zinc-950/70 text-zinc-500",
  };
}

function StatusPanel({
  title,
  description,
  tone = "default",
}: {
  title: string;
  description: string;
  tone?: "default" | "error";
}) {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
        <div
          className={
            tone === "error"
              ? "text-sm font-mono font-semibold text-red-300"
              : "text-sm font-mono font-semibold text-zinc-300"
          }
        >
          {title}
        </div>
        <p className="mx-auto mt-2 max-w-[460px] text-xs font-mono leading-6 text-zinc-600">
          {description}
        </p>
        <Link
          href="/directory"
          className="mt-5 inline-flex h-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
        >
          ← Back to Directory
        </Link>
      </div>
    </div>
  );
}

export function PublicProfile() {
  const { publicId } = useParams<{ publicId: string }>();
  const [, navigate] = useLocation();

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

      if (publicId === PROFILE_PREVIEW_PUBLIC_ID) {
        const previewProfile = readPreviewProfileFromStorage();

        if (!cancelled) {
          setProfile(previewProfile);
          setNotFound(!previewProfile);
          setLoading(false);
        }

        return;
      }

      setLoading(true);
      setError("");
      setNotFound(false);

      try {
        const response = await fetch(
          buildNightforceApiUrl(
            `/api/nightforce/public-profiles/${encodeURIComponent(publicId)}`,
          ),
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
            err instanceof Error
              ? err.message
              : "Failed to load public profile.",
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

  useEffect(() => {
  if (publicId !== PROFILE_PREVIEW_PUBLIC_ID) {
    return;
  }

  const refreshPreviewProfile = () => {
    const previewProfile = readPreviewProfileFromStorage();

    setProfile(previewProfile);
    setNotFound(!previewProfile);
    setError("");
    setLoading(false);
  };

  const handlePreviewStorageChange = (event: StorageEvent) => {
    if (event.key === PROFILE_PREVIEW_STORAGE_KEY) {
      refreshPreviewProfile();
    }
  };

  window.addEventListener("storage", handlePreviewStorageChange);
  window.addEventListener("focus", refreshPreviewProfile);

  return () => {
    window.removeEventListener("storage", handlePreviewStorageChange);
    window.removeEventListener("focus", refreshPreviewProfile);
  };
}, [publicId]);

  function handleBackToDirectory() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    navigate("/directory");
  }

  const displayName =
    profile?.visibility === "anonymous"
      ? "Anonymous"
      : profile?.displayName || "Anonymous";

  const formattedSocials = useMemo(() => {
    return (profile?.socials ?? [])
      .map(formatSocial)
      .filter((social): social is SocialLink => Boolean(social));
  }, [profile?.socials]);

  if (loading) {
    return (
      <StatusPanel
        title="Loading Profile"
        description="Fetching public profile data..."
      />
    );
  }

  if (error) {
    return (
      <StatusPanel
        title="Failed to Load Profile"
        description={error}
        tone="error"
      />
    );
  }

  if (!profile || notFound || profile.visibility === "hidden") {
    return (
      <StatusPanel
        title="Profile Unavailable"
        description="This profile is hidden, inactive, or does not exist."
      />
    );
  }

  const contact = getContactContent(profile);
  const ContactIcon = contact.Icon;

  const profileDetails = [
    {
      label: "Region",
      value: profile.region,
      Icon: Globe2,
    },
    {
      label: "Country",
      value: profile.country,
      Icon: MapPin,
    },
    {
      label: "Role / Focus",
      value: profile.role,
      Icon: UserRound,
    },
  ].filter((item) => Boolean(item.value));

  const hasBio = Boolean(profile.bio);
  const hasWebsite = Boolean(profile.websiteUrl);
  const hasSocials = formattedSocials.length > 0;
  const hasHeroLinks = hasSocials || hasWebsite;
  const hasAnyPublicDetails =
  profileDetails.length > 0 || hasBio || hasWebsite || hasSocials;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-zinc-700/10 blur-3xl" />
        <div className="absolute left-[15%] top-[28%] h-80 w-80 rounded-full bg-emerald-950/10 blur-3xl" />
        <div className="absolute right-[10%] top-[36%] h-96 w-96 rounded-full bg-emerald-950/10 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-[980px] px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
        <button
          type="button"
          onClick={handleBackToDirectory}
          className="mb-5 mt-1 inline-flex items-center gap-2 text-[11px] font-mono text-zinc-500 transition-colors hover:text-zinc-200 sm:mb-8 sm:mt-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to directory
        </button>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.045),transparent)] px-4 py-4 sm:px-7 sm:py-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${displayName} avatar`}
                    className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 bg-zinc-950 object-cover shadow-[0_0_0_4px_rgba(255,255,255,0.03)] sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-[radial-gradient(circle_at_30%_15%,rgba(52,211,153,0.22),transparent_38%),rgba(2,6,23,0.94)] text-lg font-mono text-emerald-200 shadow-xl sm:h-24 sm:w-24 sm:text-xl">
                    {getInitials(displayName)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
  <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight text-white sm:text-4xl">
    {displayName}
  </h1>

  <span
    title="Verified profile"
    aria-label="Verified profile"
    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-white shadow-[0_0_16px_rgba(52,211,153,0.42)] ring-1 ring-emerald-200/40"
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 12.5 10.2 16 17.8 8" />
    </svg>
  </span>

  {profile.visibility === "anonymous" && (
    <span className="rounded-full border border-white/10 bg-zinc-950/80 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide text-zinc-400">
      Anonymous
    </span>
  )}
</div>

{hasHeroLinks && (
  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
    {formattedSocials.map(({ href, label, text, Icon }) => {
      if (!href) {
        return (
          <div
            key={`${label}-${text}`}
            title={text}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-950/80 text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
        );
      }

      return (
        <a
          key={`${label}-${href}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          title={text}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-950/80 text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all hover:border-emerald-300/40 hover:bg-emerald-400/10 hover:text-emerald-100 hover:shadow-[0_0_18px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      );
    })}

    {profile.websiteUrl && (
      <a
        href={normalizeExternalHref(profile.websiteUrl)}
        target="_blank"
        rel="noreferrer"
        aria-label="Visit website"
        title={formatWebsiteLabel(profile.websiteUrl)}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-white bg-white px-3 text-[10px] font-mono font-semibold leading-none text-black shadow-[0_0_14px_rgba(255,255,255,0.08)] transition-colors hover:border-zinc-200 hover:bg-zinc-200"
      >
        <span className="leading-none">Visit</span>
        <ExternalLink className="h-3 w-3 text-black" aria-hidden="true" />
      </a>
    )}
  </div>
)}

{profile.bio && (
  <p className="mt-4 max-w-[620px] text-sm leading-7 text-zinc-300 sm:text-left">
    {profile.bio}
  </p>
)}
                </div>
              </div>

              <div
  className={`w-full rounded-3xl border px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-5 lg:w-[320px] ${contact.accentClassName}`}
>
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-current/25 bg-black/20">
      <ContactIcon className="h-4 w-4" aria-hidden="true" />
    </div>

    <div className="min-w-0">
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-75">
        {contact.label}
      </div>

      {profile.contactMode === "PUBLIC_CONTACT_ALLOWED" &&
      profile.publicEmail ? (
        <a
          href={`mailto:${profile.publicEmail}`}
          className="mt-1.5 block break-all text-[15px] font-mono font-semibold leading-6 text-white transition-colors hover:text-emerald-100"
        >
          {profile.publicEmail}
        </a>
      ) : (
        <div className="mt-1.5 text-[15px] font-mono font-semibold leading-6 text-white">
          {contact.title}
        </div>
      )}

      <p className="mt-2 max-w-[210px] text-[11px] leading-5 opacity-80">
        {contact.description}
      </p>
    </div>
  </div>
</div>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-mono font-semibold text-white">
                    Public profile details
                  </h2>
                  <p className="mt-1 text-[11px] font-mono text-zinc-600">
                    Information this ambassador has chosen to show.
                  </p>
                </div>
              </div>

              {hasAnyPublicDetails ? (
                <div className="space-y-3">
                  {profileDetails.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-3">
                      {profileDetails.map(({ label, value, Icon }) => (
                        <div
                          key={label}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
                        >
                          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wide text-zinc-500">
                            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>{label}</span>
                          </div>
                          <div className="mt-2 break-words text-sm font-mono leading-5 text-zinc-200">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!hasBio && (
                    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-[11px] font-mono leading-5 text-zinc-600">
                      Bio is hidden or not provided.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-5">
                  <div className="text-sm font-mono text-zinc-400">
                    Limited public details
                  </div>
                  <p className="mt-2 text-[11px] font-mono leading-5 text-zinc-600">
                    This profile limits some public details by choice.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="flex min-h-[108px] items-start gap-3 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-3.5 shadow-[0_0_0_1px_rgba(16,185,129,0.05)]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/40">
                  <ShieldCheck
                    className="h-3.5 w-3.5 text-emerald-300"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-mono font-semibold leading-5 text-emerald-200">
                    Verified
                  </div>
                  <p className="mt-1.5 text-[11px] font-mono leading-5 text-zinc-400">
                    Passed the directory verification flow. Not official Midnight identity
                    verification.
                  </p>
                </div>
              </div>

              <div className="flex min-h-[108px] items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-950/50">
                  <Info
                    className="h-3.5 w-3.5 text-zinc-500"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-mono font-semibold leading-5 text-white">
                    Privacy-aware profile
                  </div>
                  <p className="mt-1.5 text-[11px] font-mono leading-5 text-zinc-600">
                    Public fields are controlled by the ambassador. Any hidden details are
                    intentional.
                  </p>
                </div>
              </div>

              {profile.nightDomain ? (
                <MidnamesProfileButton
                  domain={profile.nightDomain}
                  mode="full"
                  className="relative isolate flex min-h-[108px] w-full appearance-none items-start gap-3 overflow-hidden rounded-2xl border border-emerald-400/35 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_48%),rgba(0,0,0,0.28)] p-3.5 text-left align-top font-mono shadow-[0_0_24px_rgba(16,185,129,0.16),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:border after:border-emerald-300/60 after:opacity-90 after:shadow-[0_0_34px_rgba(52,211,153,0.34),inset_0_0_18px_rgba(52,211,153,0.08)] after:content-[''] after:animate-pulse hover:border-emerald-300/80 hover:bg-emerald-950/25 hover:shadow-[0_0_38px_rgba(16,185,129,0.28),inset_0_1px_0_rgba(255,255,255,0.07)]"
                  ariaLabel={`Open ${displayName} .night identity profile`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/40">
                    <Fingerprint
                      className="h-3.5 w-3.5 text-emerald-300"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-mono font-semibold leading-5 text-emerald-100">
                      .night identity
                    </div>
                    <p className="mt-1.5 text-[11px] font-mono leading-5 text-zinc-400">
                      View this ambassador&apos;s Midnames profile.
                    </p>
                    <div className="mt-2 break-all text-[11px] font-mono leading-5 text-emerald-300">
                      {profile.nightDomain}
                    </div>
                  </div>
                </MidnamesProfileButton>
              ) : (
                <div className="hidden lg:block" aria-hidden="true" />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}