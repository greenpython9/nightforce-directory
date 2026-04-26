import type { ComponentType, SVGProps } from "react";
import {
  Github,
  Instagram,
  Linkedin,
  Send,
  Youtube,
} from "lucide-react";
import { Link } from "wouter";

type ContactMode =
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED";

export type ProfileCardProfile = {
  publicId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  country?: string | null;
  region?: string | null;
  contactMode?: ContactMode | null;
  socials?: string[];
  isVerified?: boolean;
  visibility?: "public" | "anonymous" | "hidden";
};

interface ProfileCardProps {
  profile: ProfileCardProfile;
  className?: string;
  viewHref?: string;
  viewLabel?: string;
  viewTarget?: "_self" | "_blank";
  onViewClick?: () => void;
}

function formatContactMode(value: ProfileCardProfile["contactMode"]): string {
  switch (value) {
    case "PRIVATE_CONTACT_AVAILABLE":
      return "Private";
    case "PUBLIC_CONTACT_ALLOWED":
      return "Public";
    case "NO_CONTACT":
      return "Unavailable";
    default:
      return "Unavailable";
  }
}


type SocialIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type SocialLink = {
  href: string;
  label: string;
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

function normalizeSocialHref(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function parseSocialUrl(value: string): URL | null {
  try {
    return new URL(normalizeSocialHref(value));
  } catch {
    return null;
  }
}

function getNormalizedHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

function getSocialLink(value: string): SocialLink | null {
  const url = parseSocialUrl(value);

  if (!url) return null;

  const href = url.toString();
  const host = getNormalizedHost(url);
  const path = url.pathname.replace(/^\/+/, "");

  if ((host === "x.com" || host === "twitter.com") && path) {
    return { href, label: "X", Icon: XIcon };
  }

  if (
    host === "youtube.com" &&
    (path.startsWith("@") ||
      path.startsWith("channel/") ||
      path.startsWith("c/") ||
      path.startsWith("user/"))
  ) {
    return { href, label: "YouTube", Icon: Youtube };
  }

  if (
    host === "discord.gg" ||
    (host === "discord.com" && path.startsWith("invite/"))
  ) {
    return { href, label: "Discord", Icon: DiscordIcon };
  }

  if ((host === "t.me" || host === "telegram.me") && path) {
    return { href, label: "Telegram", Icon: Send };
  }

  return null;
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

export function ProfileCard({
  profile,
  className = "",
  viewHref,
  viewLabel = "View →",
  viewTarget = "_self",
  onViewClick,
}: ProfileCardProps) {
  const displayName =
    profile.visibility === "anonymous"
      ? "Anonymous"
      : profile.displayName || "Anonymous";

  const location = [profile.country, profile.region].filter(Boolean).join(" · ");

  const socialLinks = (profile.socials ?? [])
    .map(getSocialLink)
    .filter((link): link is SocialLink => Boolean(link))
    .slice(0, 4);

  const resolvedViewHref = viewHref ?? `/profile/${profile.publicId}`;
  const viewClassName =
    "text-[10px] font-mono text-zinc-600 transition-colors hover:text-white";

  return (
    <div
      className={`group flex min-h-[255px] flex-col rounded-2xl border border-zinc-900 bg-zinc-900 p-5 transition-colors hover:border-zinc-500 ${className}`}
    >
      <div className="flex items-start gap-3">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={`${displayName} avatar`}
            className="h-14 w-14 shrink-0 rounded-full border border-zinc-700 bg-zinc-950 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-[11px] font-mono text-sky-300">
            {getInitials(displayName)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[12px] font-mono font-semibold text-white">
              {displayName}
            </span>

            {profile.isVerified !== false && (
              <span
                title="Verified profile"
                aria-label="Verified profile"
                className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-sky-400 text-white shadow-[0_0_8px_rgba(56,189,248,0.35)]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-2.5 w-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6.5 12.5 10.2 16 17.8 8" />
                </svg>
              </span>
            )}
          </div>

          <div className="mt-1 truncate text-[11px] font-mono text-zinc-400">
            {profile.role || "Nightforce ambassador"}
          </div>

          {location && (
            <div className="mt-1 truncate text-[11px] font-mono text-zinc-500">
              {location}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-900 bg-zinc-950 px-3 py-2">
        <div className="text-[10px] font-mono text-zinc-600">
          Access
        </div>
        <div className="mt-1 text-[11px] font-mono text-sky-300">
          {formatContactMode(profile.contactMode)}
        </div>
      </div>

      {socialLinks.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={`${label}-${href}`}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={label}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-white"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-end border-t border-zinc-900 pt-3">
        {viewTarget === "_blank" ? (
          <a
            href={resolvedViewHref}
            target="_blank"
            rel="noreferrer"
            onClick={onViewClick}
            className={viewClassName}
          >
            {viewLabel}
          </a>
        ) : (
          <Link href={resolvedViewHref} className={viewClassName}>
            {viewLabel}
          </Link>
        )}
      </div>
    </div>
  );
}