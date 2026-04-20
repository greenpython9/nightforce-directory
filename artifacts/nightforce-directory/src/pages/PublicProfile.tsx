import { useParams } from "wouter";
import { loadStore } from "../lib/storage";
import { findPublicProfileByPublicId } from "../lib/publicProfile";
import { Link } from "wouter";

export function PublicProfile() {
  const { publicId } = useParams<{ publicId: string }>();
  const store = loadStore();
  const profile = publicId ? findPublicProfileByPublicId(publicId, store) : null;

  if (!profile || profile.visibility === "hidden") {
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

  const displayName = profile.visibility === "anonymous" ? "Anonymous" : profile.displayName || "Anonymous";

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <Link
        href="/directory"
        className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors mb-6 inline-block"
      >
        ← Back to Directory
      </Link>

      <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900">
        <div className="flex items-start justify-between gap-2 mb-6">
          <div>
            <h1 className="text-xl font-mono font-bold text-white">{displayName}</h1>
            {profile.isVerified && (
              <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                ✓ Verified Ambassador
              </span>
            )}
          </div>
          {profile.visibility === "anonymous" && (
            <span className="text-xs font-mono text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
              Anonymous
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 text-sm font-mono">
          {profile.country && (
            <div>
              <span className="text-xs text-zinc-600 block mb-0.5 uppercase tracking-wider">Country</span>
              <span className="text-zinc-300">{profile.country}</span>
            </div>
          )}
          {profile.role && (
            <div>
              <span className="text-xs text-zinc-600 block mb-0.5 uppercase tracking-wider">Role / Focus</span>
              <span className="text-zinc-300">{profile.role}</span>
            </div>
          )}
          {profile.bio && (
            <div>
              <span className="text-xs text-zinc-600 block mb-0.5 uppercase tracking-wider">Bio</span>
              <span className="text-zinc-300 leading-relaxed">{profile.bio}</span>
            </div>
          )}
          {!profile.country && !profile.role && !profile.bio && (
            <div className="text-zinc-600 text-xs">No public information disclosed.</div>
          )}
        </div>
      </div>
    </div>
  );
}