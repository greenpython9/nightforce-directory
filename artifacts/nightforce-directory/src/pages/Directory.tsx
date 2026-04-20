import { useState } from "react";
import { loadStore } from "../lib/storage";
import { getAllPublicProfiles } from "../lib/publicProfile";
import { ProfileCard } from "../components/ProfileCard";

export function Directory() {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const store = loadStore();
  const allProfiles = getAllPublicProfiles(store);

  // Build filter options from public data only
  const countries = Array.from(
    new Set(allProfiles.map((p) => p.country).filter((c): c is string => !!c))
  ).sort();
  const roles = Array.from(
    new Set(allProfiles.map((p) => p.role).filter((r): r is string => !!r))
  ).sort();

  const filtered = allProfiles.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const nameMatch = p.displayName?.toLowerCase().includes(q) ?? false;
      const countryMatch = p.country?.toLowerCase().includes(q) ?? false;
      const roleMatch = p.role?.toLowerCase().includes(q) ?? false;
      const bioMatch = p.bio?.toLowerCase().includes(q) ?? false;
      if (!nameMatch && !countryMatch && !roleMatch && !bioMatch) return false;
    }
    if (countryFilter && p.country !== countryFilter) return false;
    if (roleFilter && p.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-xl font-mono font-bold text-white mb-2">Ambassador Directory</h1>
      <p className="text-xs font-mono text-zinc-500 mb-6">
        Showing only publicly disclosed information. {allProfiles.length} verified ambassador
        {allProfiles.length !== 1 ? "s" : ""} listed.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, country, role, or bio..."
          className="flex-1 min-w-48 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
        />
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
        {(search || countryFilter || roleFilter) && (
          <button
            onClick={() => { setSearch(""); setCountryFilter(""); setRoleFilter(""); }}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-3 py-2 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
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
