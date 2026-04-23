import { Link } from "wouter";
import type { PublicProfile } from "../types";

interface ProfileCardProps {
  profile: PublicProfile;
}

function formatContactMode(value: PublicProfile["contactMode"]): string {
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

export function ProfileCard({ profile }: ProfileCardProps) {
  const displayName =
    profile.visibility === "anonymous" ? "Anonymous" : profile.displayName || "Anonymous";

  return (
    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={`${displayName} avatar`}
            className="w-12 h-12 rounded-full object-cover border border-zinc-800 bg-zinc-950 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-sm font-mono text-zinc-500 shrink-0">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-mono font-semibold text-sm">
                {displayName}
              </span>
              {profile.isVerified && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs font-mono mt-2">
            {profile.contactMode && (
              <div className="text-zinc-400">
                <span className="text-zinc-600">Contact: </span>
                {formatContactMode(profile.contactMode)}
              </div>
            )}

            {profile.region && (
              <div className="text-zinc-400">
                <span className="text-zinc-600">Region: </span>
                {profile.region}
              </div>
            )}

            {profile.country && (
              <div className="text-zinc-400">
                <span className="text-zinc-600">Country: </span>
                {profile.country}
              </div>
            )}

            {profile.role && (
              <div className="text-zinc-400">
                <span className="text-zinc-600">Role: </span>
                {profile.role}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-2 border-t border-zinc-800">
        <Link
          href={`/profile/${profile.publicId}`}
          className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          View Profile →
        </Link>
      </div>
    </div>
  );
}