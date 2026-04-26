import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { CobeAmbassadorGlobe } from "../components/CobeAmbassadorGlobe";
import { ProfileCard } from "../components/ProfileCard";
import { MOCK_DIRECTORY_PROFILES } from "../data/mockDirectoryProfiles";
import { buildNightforceApiUrl } from "../lib/nightforceApi";

type ContactMode =
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED";

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
  contactMode: ContactMode | null;
  socials: string[];
  requestedVisibility: "public" | "hidden";
  publishState: "draft" | "published" | "inactive";
};

type DirectoryResponse = {
  profiles: DirectoryProfileRecord[];
};

const quickLinks = [
  { label: "Browse", href: "/directory" },
  { label: "Globe", href: "#globe" },
  { label: "Updates", href: "#updates" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const categories = [
  { label: "Public Contact", href: "/directory?contact=public" },
  { label: "Private Contact", href: "/directory?contact=private" },
  { label: "APAC", href: "/directory?region=APAC" },
  { label: "EMEA", href: "/directory?region=EMEA" },
];

const midnightUpdates = [
  {
    author: "Midnight",
    source: "Official Blog",
    date: "Mar 31, 2026",
    title: "State of the Network - March 2026",
    excerpt:
      "The Midnight network is officially live. This update covers the genesis block, federated node operators, ecosystem progress, and developer resources.",
    href: "https://midnight.network/blog/state-of-the-network-march-2026",
    tag: "Network Updates",
    visual: "pulse",
    imageUrl:
      "https://midnight.network/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F330xhmya%2Fproduction%2F74d7348c5da8570d4657d5e55bb965d9d1eea723-2160x2160.jpg&w=1080",
  },
  {
    author: "Midnight",
    source: "Official Blog",
    date: "Mar 29, 2026",
    title: "Midnight network is live",
    excerpt:
      "The launch initiates the genesis block, establishing state continuity and permanence for Midnight's programmable privacy network.",
    href: "https://midnight.network/blog/midnight-network-is-live",
    tag: "Mainnet",
    visual: "launch",
    imageUrl:
      "https://midnight.network/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F330xhmya%2Fproduction%2F74d7348c5da8570d4657d5e55bb965d9d1eea723-2160x2160.jpg&w=1080",
  },
  {
    author: "Midnight",
    source: "Official Blog",
    date: "Mar 25, 2026",
    title: "Monument tokenises retail deposits with Midnight",
    excerpt:
      "Monument Bank is set to become the first UK bank to tokenise retail customer deposits on a public blockchain through Midnight.",
    href: "https://midnight.network/blog/monument-becomes-the-first-bank-to-securely-tokenise-retail-deposits-midnight-partnership",
    tag: "Ecosystem Partners",
    visual: "bank",
    imageUrl:
      "https://midnight.network/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F330xhmya%2Fproduction%2Ff154e064e6629cca4eca0391fc8211f81c716a25-2160x2160.jpg&w=1080",
  },
  {
    author: "Midnight",
    source: "Official Blog",
    date: "Mar 09, 2026",
    title: "Getting mainnet ready: A developer’s guide",
    excerpt:
      "A practical guide for developers preparing DApps for Midnight mainnet, including Preprod migration, Academy resources, and DUST generation.",
    href: "https://midnight.network/blog/getting-mainnet-ready-a-developer-s-guide",
    tag: "Developers",
    visual: "docs",
    imageUrl:
      "https://midnight.network/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F330xhmya%2Fproduction%2F3e14cf1840214c160c00a9c6def387c64a1d9fc7-2160x2160.jpg&w=640",
  },
  {
    author: "Midnight",
    source: "Official Blog",
    date: "Jun 25, 2025",
    title: "The tokenomics powering Midnight network",
    excerpt:
      "An overview of NIGHT, DUST, resource generation, ecosystem incentives, and the dual-component tokenomics behind Midnight.",
    href: "https://midnight.network/blog/the-tokenomics-powering-midnight-network",
    tag: "Tokenomics",
    visual: "token",
    imageUrl:
      "https://midnight.network/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F330xhmya%2Fproduction%2F9b4964213c3da33ed550efb144d47de900ec4284-1080x1080.png&w=640",
  },
  {
    author: "Midnight",
    source: "Official Blog",
    date: "Dec 04, 2025",
    title: "Guide to the NIGHT token launch and Redemption",
    excerpt:
      "A guide covering NIGHT launch phases, redemption, thawing schedules, and how the token distribution roadmap unfolds.",
    href: "https://midnight.network/blog/guide-to-the-night-token-launch-and-redemption",
    tag: "NIGHT",
    visual: "directory",
    imageUrl:
      "https://midnight.network/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F330xhmya%2Fproduction%2F890c1515269142d8ef0df2449eabe586db3e5863-2250x2250.png&w=640",
  },
];


function getStatValue(loading: boolean, value: number): string {
  if (loading) return "…";
  return value.toLocaleString();
}

export function Landing() {
  const [, navigate] = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<DirectoryProfileRecord[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [directoryError, setDirectoryError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDirectoryPreview() {
      setLoadingProfiles(true);
      setDirectoryError("");

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
          throw new Error("Failed to load directory preview.");
        }

        const data = payload as DirectoryResponse;
        const safeProfiles = Array.isArray(data.profiles) ? data.profiles : [];
        const previewProfiles: DirectoryProfileRecord[] = import.meta.env.DEV
          ? [...safeProfiles, ...MOCK_DIRECTORY_PROFILES]
          : safeProfiles;

        if (!cancelled) {
          setProfiles(previewProfiles);
        }
      } catch (error) {
        if (!cancelled) {
          setDirectoryError(
            error instanceof Error
              ? error.message
              : "Failed to load directory preview.",
          );
          setProfiles([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfiles(false);
        }
      }
    }

    void loadDirectoryPreview();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredProfiles = useMemo(() => profiles.slice(0, 10), [profiles]);

  const countriesRepresented = useMemo(() => {
    return new Set(
      profiles
        .map((profile) => profile.country)
        .filter((country): country is string => Boolean(country)),
    ).size;
  }, [profiles]);

  const regionsRepresented = useMemo(() => {
    return new Set(
      profiles
        .map((profile) => profile.region)
        .filter((region): region is string => Boolean(region)),
    ).size;
  }, [profiles]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      navigate("/directory");
      return;
    }

    navigate(`/directory?q=${encodeURIComponent(query)}`);
  }

  function handleViewCountryProfiles(country: string) {
    navigate(`/directory?q=${encodeURIComponent(country)}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-zinc-700/10 blur-3xl" />
        <div className="absolute left-[12%] top-[28%] h-80 w-80 rounded-full bg-zinc-800/10 blur-3xl" />
        <div className="absolute right-[10%] top-[36%] h-96 w-96 rounded-full bg-zinc-800/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-center pb-8 pt-7">
          <Link
            href="/"
            className="flex items-center gap-2 text-[11px] font-mono text-zinc-500"
          >
            <span className="text-sky-300">✦</span>
            <span>Nightforce Directory</span>
          </Link>
        </header>

        <main>
          <section className="pb-6 text-center">
            <h1 className="mx-auto max-w-[860px] text-3xl font-bold tracking-tight text-white md:text-5xl">
              <span className="block">Unofficial directory for</span>
              <span className="block">verified Nightforce ambassadors</span>
            </h1>

            <div className="mx-auto mt-7 max-w-[560px]">
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col gap-2 rounded-xl border border-zinc-900 bg-zinc-900 p-2 sm:flex-row sm:items-center"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search ambassadors, countries, roles..."
                  className="block h-12 min-h-12 w-full min-w-0 flex-1 appearance-none rounded-lg border border-transparent bg-zinc-950 px-4 py-0 text-[13px] leading-none font-mono text-white placeholder:text-zinc-700 outline-none transition-colors [-webkit-appearance:none] focus:border-zinc-500 sm:h-10 sm:min-h-10 sm:text-[12px]"
                />
                <button
                  type="submit"
                  className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Search
                </button>
                <Link
                  href="/request-verification"
                  className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
                >
                  Request Verification
                </Link>
              </form>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-zinc-600">
              {quickLinks.map((link, index) => (
                <span key={link.label} className="flex items-center gap-2">
                  {link.href.startsWith("#") ? (
                    <a href={link.href} className="hover:text-zinc-300">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="hover:text-zinc-300">
                      {link.label}
                    </Link>
                  )}
                  {index < quickLinks.length - 1 && (
                    <span className="text-zinc-800">·</span>
                  )}
                </span>
              ))}
            </div>
          </section>

          <section className="pt-4">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-[11px] font-mono font-semibold text-zinc-300">
                  Verified Ambassadors
                </h2>
                <p className="mt-1 text-[10px] font-mono text-zinc-600">
                  Published public Nightforce profiles
                </p>
              </div>

              <Link
                href="/directory"
                className="text-[10px] font-mono text-zinc-600 hover:text-zinc-300"
              >
                View all →
              </Link>
            </div>

            {directoryError && (
              <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/20 px-3 py-2 text-[11px] font-mono text-red-300">
                {directoryError}
              </div>
            )}

            {loadingProfiles ? (
              <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-7 pt-4 [scrollbar-width:thin]">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="min-h-[255px] w-[260px] shrink-0 rounded-2xl border border-zinc-900 bg-zinc-900 p-5"
                  >
                    <div className="h-12 w-12 rounded-xl bg-zinc-900" />
                    <div className="mt-4 h-3 w-32 rounded bg-zinc-900" />
                    <div className="mt-2 h-3 w-24 rounded bg-zinc-900" />
                    <div className="mt-4 h-3 w-40 rounded bg-zinc-900" />
                    <div className="mt-4 h-9 rounded-xl bg-zinc-900" />
                  </div>
                ))}
              </div>
            ) : featuredProfiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 px-4 py-10 text-center">
                <div className="text-sm font-mono text-zinc-400">
                  No public ambassador profiles yet.
                </div>
                <p className="mt-2 text-[11px] font-mono text-zinc-600">
                  Verified profiles will appear here when available.
                </p>
              </div>
            ) : (
              <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-7 pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
                {featuredProfiles.map((profile) => (
                  <ProfileCard
                    key={profile.publicId}
                    profile={{
                      publicId: profile.publicId,
                      displayName: profile.displayName,
                      avatarUrl: profile.avatarUrl,
                      role: profile.role,
                      country: profile.country,
                      region: profile.region,
                      contactMode: profile.contactMode,
                      socials: profile.socials,
                      isVerified: true,
                      visibility: profile.displayName ? "public" : "anonymous",
                    }}
                    className="w-[260px] shrink-0"
                  />
                ))}
              </div>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                {
                  label: "Profiles",
                  value: getStatValue(loadingProfiles, profiles.length),
                },
                {
                  label: "Countries",
                  value: getStatValue(loadingProfiles, countriesRepresented),
                },
                {
                  label: "Regions",
                  value: getStatValue(loadingProfiles, regionsRepresented),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-zinc-900 bg-zinc-900 px-4 py-4"
                >
                  <div className="text-2xl font-mono font-semibold text-white">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-zinc-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <CobeAmbassadorGlobe
            profiles={profiles}
            loading={loadingProfiles}
            onViewCountry={handleViewCountryProfiles}
          />

          <section id="updates" className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-mono font-semibold text-zinc-300">
                  Latest from Midnight Network
                </h2>
                <p className="mt-1 text-[11px] font-mono text-zinc-600">
                  Curated news and updates
                </p>
              </div>

              <a
                href="https://midnight.network/blog"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-mono text-zinc-600 hover:text-zinc-300"
              >
                View feed →
              </a>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {[0, 1, 2].map((columnIndex) => (
                <div key={columnIndex} className="space-y-4">
                  {midnightUpdates
                    .slice(columnIndex * 2, columnIndex * 2 + 2)
                    .map((item, itemIndex) => (
                      <a
                        key={item.title}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group block overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 p-5 transition-colors hover:border-zinc-500"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-[12px] font-mono text-sky-300">
                            ✦
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[12px] font-mono font-semibold text-white">
                              <span>{item.author}</span>
                              <span className="text-zinc-600">on</span>
                              <span>{item.source}</span>
                              <span className="text-zinc-600">·</span>
                              <span className="shrink-0 font-normal text-zinc-500">
                                {item.date}
                              </span>
                            </div>

                            <div className="mt-1 inline-flex rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                              {item.tag}
                            </div>
                          </div>
                        </div>

                        <h3 className="mt-4 text-[14px] font-mono font-semibold leading-6 text-white">
                          {item.title}
                        </h3>

                        <p className="mt-3 text-[12px] leading-6 text-zinc-300">
                          {item.excerpt}
                        </p>

                        <div
                          className={`mt-5 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 ${
                            columnIndex === 1 && itemIndex === 0
                              ? "h-64"
                              : "h-44"
                          }`}
                        >
                          <img
                            src={item.imageUrl}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        <div className="mt-5 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">
                            {item.source}
                          </span>
                          <span className="text-zinc-400 group-hover:text-white">
                            Read post →
                          </span>
                        </div>
                      </a>
                    ))}
                </div>
              ))}
            </div>
          </section>

          <section id="about" className="mt-14 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-950">
              <img
                src="/logo-mark.svg"
                alt="Nightforce Directory"
                className="h-12 w-12 object-contain"
              />
            </div>

            <h2 className="mx-auto max-w-[780px] text-2xl font-bold tracking-tight text-white md:text-3xl">
              <span className="block">Unofficial directory for</span>
              <span className="block">verified Nightforce ambassadors</span>
            </h2>

            <div className="mx-auto mt-6 max-w-[560px]">
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col gap-2 rounded-xl border border-zinc-900 bg-zinc-900 p-2 sm:flex-row sm:items-center"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search directory..."
                  className="block h-12 min-h-12 w-full min-w-0 flex-1 appearance-none rounded-lg border border-transparent bg-zinc-950 px-4 py-0 text-[13px] leading-none font-mono text-white placeholder:text-zinc-700 outline-none transition-colors [-webkit-appearance:none] focus:border-zinc-500 sm:h-10 sm:min-h-10 sm:text-[12px]"
                />
                <button
                  type="submit"
                  className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Search
                </button>
                <Link
                  href="/request-verification"
                  className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
                >
                  Request Verification
                </Link>
              </form>
            </div>
          </section>

          <section className="mt-12 border-t border-zinc-900 pt-8">
            <h2 className="text-center text-[11px] font-mono text-zinc-500">
              Browse by category
            </h2>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-[10px] font-mono text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </section>
        </main>

      </div>
    </div>
  );
}