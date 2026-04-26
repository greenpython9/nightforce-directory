import { useEffect, useMemo, useState } from "react";
import { ProfileCard } from "../components/ProfileCard";
import { MOCK_DIRECTORY_PROFILES } from "../data/mockDirectoryProfiles";
import type { PublicProfile } from "../types";
import { buildNightforceApiUrl } from "../lib/nightforceApi";

type DirectoryProfileRecord = {
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

type DirectoryResponse = {
  profiles: DirectoryProfileRecord[];
};

type ContactFilter = "" | "public" | "private" | "none";

function getInitialUrlParams() {
  return new URLSearchParams(window.location.search);
}

function getInitialSearch(): string {
  const params = getInitialUrlParams();
  const q = params.get("q") ?? "";
  const normalized = q.trim().toLowerCase();

  if (
    normalized === "public contact" ||
    normalized === "private contact" ||
    normalized === "apac" ||
    normalized === "emea"
  ) {
    return "";
  }

  return q;
}

function getInitialContactFilter(): ContactFilter {
  const params = getInitialUrlParams();
  const contact = params.get("contact");

  if (contact === "public" || contact === "private" || contact === "none") {
    return contact;
  }

  const legacyQ = (params.get("q") ?? "").trim().toLowerCase();

  if (legacyQ === "public contact") return "public";
  if (legacyQ === "private contact") return "private";

  return "";
}

function getInitialRegionFilter(): string {
  const params = getInitialUrlParams();
  const region = params.get("region");

  if (region) return region;

  const legacyQ = (params.get("q") ?? "").trim();

  if (legacyQ.toLowerCase() === "apac") return "APAC";
  if (legacyQ.toLowerCase() === "emea") return "EMEA";

  return "";
}

function toPublicProfile(profile: DirectoryProfileRecord): PublicProfile {
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

function getContactSearchLabel(value: PublicProfile["contactMode"]): string {
  switch (value) {
    case "PUBLIC_CONTACT_ALLOWED":
      return "public contact";
    case "PRIVATE_CONTACT_AVAILABLE":
      return "private contact";
    case "NO_CONTACT":
      return "no contact unavailable";
    default:
      return "";
  }
}

export function Directory() {
  const [search, setSearch] = useState(getInitialSearch);
  const [contactFilter, setContactFilter] =
    useState<ContactFilter>(getInitialContactFilter);
  const [regionFilter, setRegionFilter] = useState(getInitialRegionFilter);
  const [countryFilter, setCountryFilter] = useState(
    () => getInitialUrlParams().get("country") ?? "",
  );
  const [roleFilter, setRoleFilter] = useState(
    () => getInitialUrlParams().get("role") ?? "",
  );
  const [allProfiles, setAllProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDirectory() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          buildNightforceApiUrl("/api/nightforce/directory"),
        );

        let payload: unknown = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "Failed to load directory.";

          throw new Error(message);
        }

        const data = payload as DirectoryResponse;
        const sourceProfiles: DirectoryProfileRecord[] = import.meta.env.DEV
          ? [...data.profiles, ...MOCK_DIRECTORY_PROFILES]
          : data.profiles;
        const mapped = sourceProfiles.map(toPublicProfile);

        if (!cancelled) {
          setAllProfiles(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load directory.",
          );
          setAllProfiles([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDirectory();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (search.trim()) params.set("q", search.trim());
    if (contactFilter) params.set("contact", contactFilter);
    if (regionFilter) params.set("region", regionFilter);
    if (countryFilter) params.set("country", countryFilter);
    if (roleFilter) params.set("role", roleFilter);

    const queryString = params.toString();
    const nextUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  }, [search, contactFilter, regionFilter, countryFilter, roleFilter]);

  const countries = useMemo(
    () =>
      Array.from(
        new Set(allProfiles.map((p) => p.country).filter((c): c is string => !!c)),
      ).sort(),
    [allProfiles],
  );

  const regions = useMemo(
    () =>
      Array.from(
        new Set(
          allProfiles.map((p) => p.region).filter((r): r is string => !!r),
        ),
      ).sort(),
    [allProfiles],
  );

  const roles = useMemo(
    () =>
      Array.from(
        new Set(allProfiles.map((p) => p.role).filter((r): r is string => !!r)),
      ).sort(),
    [allProfiles],
  );

  const filtered = useMemo(
    () =>
      allProfiles.filter((p) => {
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const nameMatch = p.displayName?.toLowerCase().includes(q) ?? false;
          const regionMatch = p.region?.toLowerCase().includes(q) ?? false;
          const countryMatch = p.country?.toLowerCase().includes(q) ?? false;
          const roleMatch = p.role?.toLowerCase().includes(q) ?? false;
          const contactMatch = getContactSearchLabel(p.contactMode).includes(q);

          if (
            !nameMatch &&
            !regionMatch &&
            !countryMatch &&
            !roleMatch &&
            !contactMatch
          ) {
            return false;
          }
        }

        if (
          contactFilter === "public" &&
          p.contactMode !== "PUBLIC_CONTACT_ALLOWED"
        ) {
          return false;
        }

        if (
          contactFilter === "private" &&
          p.contactMode !== "PRIVATE_CONTACT_AVAILABLE"
        ) {
          return false;
        }

        if (contactFilter === "none" && p.contactMode !== "NO_CONTACT") {
          return false;
        }

        if (regionFilter && p.region !== regionFilter) return false;
        if (countryFilter && p.country !== countryFilter) return false;
        if (roleFilter && p.role !== roleFilter) return false;

        return true;
      }),
    [allProfiles, search, contactFilter, regionFilter, countryFilter, roleFilter],
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-xl font-mono font-bold text-white mb-2">
        Ambassador Directory
      </h1>
      <p className="text-xs font-mono text-zinc-500 mb-6">
        Showing only publicly disclosed information. {allProfiles.length} verified ambassador
        {allProfiles.length !== 1 ? "s" : ""} listed.
      </p>

      {error && (
        <div className="mb-4 text-xs font-mono text-red-400">{error}</div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, region, country, or role..."
          className="flex-1 min-w-48 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
        />
        <select
          value={contactFilter}
          onChange={(e) => setContactFilter(e.target.value as ContactFilter)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Contact</option>
          <option value="public">Public Contact</option>
          <option value="private">Private Contact</option>
          <option value="none">No Contact</option>
        </select>

        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {(search || contactFilter || regionFilter || countryFilter || roleFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setContactFilter("");
              setRegionFilter("");
              setCountryFilter("");
              setRoleFilter("");
            }}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-3 py-2 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="text-sm font-mono text-zinc-600">
            Loading directory...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-sm font-mono text-zinc-600">
            {allProfiles.length === 0
              ? "No verified ambassadors in the directory yet."
              : "No profiles match your search."}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((profile) => (
            <ProfileCard key={profile.publicId} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}