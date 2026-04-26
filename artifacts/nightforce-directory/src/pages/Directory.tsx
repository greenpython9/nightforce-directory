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

  const hasActiveFilters = Boolean(
    search || contactFilter || regionFilter || countryFilter || roleFilter,
  );

  const clearFilters = () => {
    setSearch("");
    setContactFilter("");
    setRegionFilter("");
    setCountryFilter("");
    setRoleFilter("");
  };

  const contactOptions: { label: string; value: ContactFilter }[] = [
    { label: "All", value: "" },
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
    { label: "No contact", value: "none" },
  ];

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

      <div className="mb-6 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(9,9,11,0.96))] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-600">
              Directory controls
            </div>
            <div className="mt-1 text-sm font-mono font-semibold text-white">
              Filter verified ambassadors
            </div>
          </div>

          <div className="text-xs font-mono text-zinc-500">
            Showing{" "}
            <span className="font-semibold text-zinc-300">{filtered.length}</span>{" "}
            of{" "}
            <span className="font-semibold text-zinc-300">
              {allProfiles.length}
            </span>
          </div>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, region, country, or role..."
          className="mb-3 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-mono text-white placeholder:text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-emerald-300/40 focus-visible:ring-1 focus-visible:ring-emerald-300/25"
        />

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-600">
              Contact
            </div>
            <div className="flex flex-wrap gap-2">
              {contactOptions.map((option) => {
                const isActive = contactFilter === option.value;

                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setContactFilter(option.value)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-mono outline-none transition-all focus-visible:ring-1 focus-visible:ring-emerald-300/30 ${
                      isActive
                        ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.12)]"
                        : "border-white/10 bg-white/[0.03] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-600">
              Region
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRegionFilter("")}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-mono outline-none transition-all focus-visible:ring-1 focus-visible:ring-emerald-300/30 ${
                  regionFilter === ""
                    ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.12)]"
                    : "border-white/10 bg-white/[0.03] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                }`}
              >
                All
              </button>

              {regions.map((region) => {
                const isActive = regionFilter === region;

                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setRegionFilter(region)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-mono outline-none transition-all focus-visible:ring-1 focus-visible:ring-emerald-300/30 ${
                      isActive
                        ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.12)]"
                        : "border-white/10 bg-white/[0.03] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                    }`}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-600">
              Country
            </span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-mono text-zinc-300 outline-none transition-colors focus:border-emerald-300/40 focus-visible:ring-1 focus-visible:ring-emerald-300/25"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-600">
              Role
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-mono text-zinc-300 outline-none transition-colors focus:border-emerald-300/40 focus-visible:ring-1 focus-visible:ring-emerald-300/25"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-600">
              Active
            </span>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono text-zinc-400 outline-none transition-colors hover:border-emerald-300/30 hover:text-emerald-100 focus-visible:ring-1 focus-visible:ring-emerald-300/25"
              >
                Search: {search} ×
              </button>
            )}

            {contactFilter && (
              <button
                type="button"
                onClick={() => setContactFilter("")}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono text-zinc-400 outline-none transition-colors hover:border-emerald-300/30 hover:text-emerald-100 focus-visible:ring-1 focus-visible:ring-emerald-300/25"
              >
                Contact:{" "}
                {contactFilter === "public"
                  ? "Public"
                  : contactFilter === "private"
                    ? "Private"
                    : "No contact"}{" "}
                ×
              </button>
            )}

            {regionFilter && (
              <button
                type="button"
                onClick={() => setRegionFilter("")}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono text-zinc-400 outline-none transition-colors hover:border-emerald-300/30 hover:text-emerald-100 focus-visible:ring-1 focus-visible:ring-emerald-300/25"
              >
                Region: {regionFilter} ×
              </button>
            )}

            {countryFilter && (
              <button
                type="button"
                onClick={() => setCountryFilter("")}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono text-zinc-400 outline-none transition-colors hover:border-emerald-300/30 hover:text-emerald-100 focus-visible:ring-1 focus-visible:ring-emerald-300/25"
              >
                Country: {countryFilter} ×
              </button>
            )}

            {roleFilter && (
              <button
                type="button"
                onClick={() => setRoleFilter("")}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono text-zinc-400 outline-none transition-colors hover:border-emerald-300/30 hover:text-emerald-100 focus-visible:ring-1 focus-visible:ring-emerald-300/25"
              >
                Role: {roleFilter} ×
              </button>
            )}

            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto rounded-full border border-white/10 px-3 py-1 text-[10px] font-mono text-zinc-500 outline-none transition-colors hover:border-white/20 hover:text-zinc-300 focus-visible:ring-1 focus-visible:ring-emerald-300/25"
            >
              Clear all
            </button>
          </div>
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