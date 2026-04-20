import { Link } from "wouter";
import type { PublicProfile } from "../types";

interface ProfileCardProps {
  profile: PublicProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const displayName =
    profile.visibility === "anonymous" ? "Anonymous" : profile.displayName || "Anonymous";

  return (
    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-mono font-semibold text-sm">{displayName}</span>
          {profile.isVerified && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-xs font-mono">
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
        {profile.bio && (
          <div className="text-zinc-400">
            <span className="text-zinc-600">Bio: </span>
            {profile.bio}
          </div>
        )}
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
