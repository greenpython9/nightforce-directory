import { Link } from "wouter";

const architectureCards = [
  {
    label: "Backend",
    title: "Source of truth",
    body: "Profile records, verification state, visibility settings, and contact mode data are managed through the app backend.",
    accent: "emerald",
  },
  {
    label: "Wallet",
    title: "User authorization",
    body: "Midnight-related actions are authorized through the user’s own wallet instead of being silently controlled by the app.",
    accent: "sky",
  },
  {
    label: "Midnight",
    title: "Sync layer",
    body: "Selected profile and contact-mode metadata can be synchronized through Midnight contracts as a privacy-aware blockchain layer.",
    accent: "violet",
  },
];

const privacyCards = [
  {
    title: "Country-level discovery",
    body: "The directory can show ambassador distribution by country, but it does not show exact user locations.",
  },
  {
    title: "Controlled contact",
    body: "Profiles can communicate whether contact is public, private, or unavailable without exposing more than needed.",
  },
  {
    title: "Public profile boundaries",
    body: "Only selected public profile fields are displayed in the directory.",
  },
];

export function About() {
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
          <section className="pb-8 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[10px] font-mono uppercase tracking-wide text-zinc-500">
              About
            </div>

            <h1 className="mx-auto max-w-[820px] text-3xl font-bold tracking-tight text-white md:text-5xl">
              <span className="block">Hello world!</span>
            </h1>

            <p className="mx-auto mt-5 max-w-[620px] text-sm leading-7 text-zinc-400">
              nightforce.cc is an unofficial community-built Nightforce directory
              for discovering verified ambassadors across countries, regions,
              and roles.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/directory"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Browse Directory
              </Link>

              <Link
                href="/request-verification"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Request Verification
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5">
              <div className="text-[10px] font-mono uppercase tracking-wide text-emerald-400">
                What it is
              </div>
              <h2 className="mt-3 text-lg font-mono font-semibold text-white">
                A discovery layer for public ambassador profiles
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                The directory helps people browse verified ambassador profiles,
                explore regional coverage, and find community members based on
                country, role, and contact access.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5">
              <div className="text-[10px] font-mono uppercase tracking-wide text-sky-300">
                What it is not
              </div>
              <h2 className="mt-3 text-lg font-mono font-semibold text-white">
                Not an official Midnight product
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                nightforce.cc is community-built and unofficial. It is
                not a wallet authority, not a doxxing tool, and not a place for
                exposing private personal data.
              </p>
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-[13px] font-mono font-semibold text-zinc-300">
                Profile visibility
              </h2>
              <p className="mt-1 text-[11px] font-mono text-zinc-600">
                Visibility controls whether a profile appears publicly, appears
                anonymously, or stays hidden from the directory.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5">
                <div className="text-sm font-mono font-semibold text-white">
                  Public
                </div>
                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  Public profiles can show selected profile details such as
                  display name, country, region, role, and public-facing status.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5">
                <div className="text-sm font-mono font-semibold text-white">
                  Anonymous
                </div>
                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  Anonymous profiles can appear without a public display name
                  while still preserving basic directory context.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5">
                <div className="text-sm font-mono font-semibold text-white">
                  Hidden
                </div>
                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  Hidden profiles are not shown publicly and remain outside the
                  public discovery experience.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-[13px] font-mono font-semibold text-zinc-300">
                Contact access
              </h2>
              <p className="mt-1 text-[11px] font-mono text-zinc-600">
                Contact access is separate from profile visibility. It explains
                whether someone can be reached publicly, privately, or not at
                all.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5">
                <div className="text-sm font-mono font-semibold text-white">
                  Public
                </div>
                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  Public contact means the profile owner allows public-facing
                  contact information to be shown.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5">
                <div className="text-sm font-mono font-semibold text-white">
                  Private
                </div>
                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  Private contact means contact may be available through a
                  controlled or privacy-aware contact flow.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5">
                <div className="text-sm font-mono font-semibold text-white">
                  Unavailable
                </div>
                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  Unavailable means the profile does not currently expose a
                  public or private contact path.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-10 overflow-hidden rounded-2xl border border-zinc-800 bg-[#18181b] p-5">
            <style>
              {`
                
                @keyframes nfMindMapTravel {
                  0% {
                    stroke-dashoffset: 120;
                  }
                  100% {
                    stroke-dashoffset: 0;
                  }
                }

                .nf-mindmap-line {
                  stroke-dasharray: 8 12;
                  animation: nfMindMapTravel 7s linear infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                  .nf-mindmap-line {
                    animation: none;
                  }
                }
              `}
            </style>

            <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
              <div className="flex flex-col lg:pr-6">
                <div className="text-[10px] font-mono uppercase tracking-wide text-emerald-400">
                  Technology
                </div>

                <h2 className="mt-3 max-w-[420px] text-2xl font-bold tracking-tight text-white md:text-3xl">
                  Built with a hybrid architecture
                </h2>

                <p className="mt-5 max-w-[440px] text-sm leading-7 text-zinc-400">
                  nightforce.cc uses three layers: a backend for profile
                  records, a user wallet for authorization, and Midnight
                  contracts for privacy-aware synchronization.
                </p>

                <div className="mt-6 grid gap-2">
                  {architectureCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-xl border border-zinc-800 bg-[#0b0d10]/80 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">
                            {card.label}
                          </div>
                          <div className="mt-1 text-sm font-mono font-semibold text-white">
                            {card.title}
                          </div>
                          <p className="mt-2 text-[11px] leading-6 text-zinc-500">
                            {card.body}
                          </p>
                        </div>

                        <span
                            className={[
                                "mt-1 h-2 w-2 shrink-0 rounded-full",
                            card.accent === "emerald"
                                ? "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.8)]"
                                : card.accent === "sky"
                                    ? "bg-yellow-300 shadow-[0_0_14px_rgba(253,224,71,0.8)]"
                                    : "bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.8)]",
                            ].join(" ")}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex h-full flex-col rounded-[28px] border border-zinc-800 bg-[#07090b] p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">
                      Architecture map
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-zinc-500">
                      source · authorization · sync
                    </div>
                  </div>

                  <span className="rounded-full border border-emerald-900/70 bg-emerald-950/35 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wide text-emerald-300">
                    synced
                  </span>
                </div>

                <div className="relative min-h-[520px] flex-1 overflow-hidden rounded-[24px] border border-zinc-800 bg-[#050607] p-4">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(63,63,70,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(63,63,70,0.12)_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />


                  <div className="absolute left-1/2 top-[47%] z-10 hidden h-[480px] w-full max-w-[640px] -translate-x-1/2 -translate-y-1/2 sm:block">

                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      viewBox="0 0 640 480"
                      fill="none"
                      preserveAspectRatio="none"
                    >
                      <path
                        className="nf-mindmap-line"
                        d="M148 118 C205 145 245 170 278 204"
                        stroke="rgba(248,113,113,0.42)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        className="nf-mindmap-line"
                        d="M492 118 C435 145 395 170 362 204"
                        stroke="rgba(250,204,21,0.42)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        style={{ animationDelay: "0.6s" }}
                      />
                      <path
                        className="nf-mindmap-line"
                        d="M320 303 C320 324 320 338 320 352"
                        stroke="rgba(96,165,250,0.42)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        style={{ animationDelay: "1.2s" }}
                      />
                    </svg>

                    <div className="absolute left-1/2 top-1/2 flex h-[126px] w-[152px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[30px] border border-emerald-800/70 bg-[#121417]/90 px-4 text-center">
                      <div className="relative text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-400">
                        nightforce.cc
                      </div>
                      <div className="relative mt-1 text-lg font-bold tracking-tight text-white">
                        dir
                      </div>
                      <div className="relative mt-1.5 text-[10px] font-mono text-zinc-500">
                        product layer
                      </div>
                    </div>

                    <div className="absolute left-[30px] top-[36px] flex w-[170px] flex-col items-center text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-red-800/70 bg-red-950/35 text-red-300">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-9 w-9"
                          fill="none"
                        >
                          <ellipse
                            cx="12"
                            cy="5"
                            rx="7"
                            ry="3"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                          <path
                            d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                          <path
                            d="M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className="mt-3 text-sm font-mono font-semibold text-white">
                        Backend
                      </div>
                      <div className="mt-1 text-[11px] leading-5 text-red-300">
                        Source of truth
                      </div>
                    </div>

                    <div className="absolute right-[30px] top-[36px] flex w-[170px] flex-col items-center text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-yellow-700/70 bg-yellow-950/30 text-yellow-300">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-9 w-9"
                          fill="none"
                        >
                          <path
                            d="M4.75 7.5h13.5A2.75 2.75 0 0 1 21 10.25v6.5a2.75 2.75 0 0 1-2.75 2.75H5.75A2.75 2.75 0 0 1 3 16.75v-8.5A.75.75 0 0 1 3.75 7.5h1Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M4.5 7.5 16.25 4.2a1.45 1.45 0 0 1 1.85 1.4v1.9"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M17.25 13.5h3.75"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                          <circle cx="17.25" cy="13.5" r="1" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="mt-3 text-sm font-mono font-semibold text-white">
                        Wallet
                      </div>
                      <div className="mt-1 text-[11px] leading-5 text-yellow-300">
                        User authorization
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-[352px] flex w-[190px] -translate-x-1/2 flex-col items-center text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-blue-800/70 bg-blue-950/30 text-blue-300">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 789.37 789.37"
                          className="h-9 w-9"
                          fill="none"
                        >
                          <path
                            fill="currentColor"
                            d="m394.69,0C176.71,0,0,176.71,0,394.69s176.71,394.69,394.69,394.69,394.69-176.71,394.69-394.69S612.67,0,394.69,0Zm0,716.6c-177.5,0-321.91-144.41-321.91-321.91S217.18,72.78,394.69,72.78s321.91,144.41,321.91,321.91-144.41,321.91-321.91,321.91Z"
                          />
                          <rect
                            fill="currentColor"
                            x="357.64"
                            y="357.64"
                            width="74.09"
                            height="74.09"
                          />
                          <rect
                            fill="currentColor"
                            x="357.64"
                            y="240.66"
                            width="74.09"
                            height="74.09"
                          />
                          <rect
                            fill="currentColor"
                            x="357.64"
                            y="123.69"
                            width="74.09"
                            height="74.09"
                          />
                        </svg>
                      </div>
                      <div className="mt-3 text-sm font-mono font-semibold text-white">
                        Midnight
                      </div>
                      <div className="mt-1 text-[11px] leading-5 text-blue-300">
                        Sync layer
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 grid gap-3 sm:hidden">
                    <div className="rounded-2xl border border-emerald-800/70 bg-[#121417]/90 p-4 text-center shadow-[0_0_34px_rgba(16,185,129,0.14)]">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-400">
                        nightforce.cc
                      </div>
                      <div className="mt-1 text-base font-bold tracking-tight text-white">
                        Hybrid architecture
                      </div>
                      <p className="mx-auto mt-2 max-w-[260px] text-[11px] leading-5 text-zinc-500">
                        The product layer that displays verified public
                        ambassador profiles.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-900/50 bg-zinc-950/75 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-800/70 bg-red-950/35 text-red-300">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                          >
                            <ellipse
                              cx="12"
                              cy="5"
                              rx="7"
                              ry="3"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            />
                            <path
                              d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                            />
                            <path
                              d="M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>

                        <div>
                          <div className="text-sm font-mono font-semibold text-white">
                            Backend
                          </div>
                          <div className="mt-1 text-[11px] font-mono text-red-300">
                            Source of truth
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl border border-sky-900/50 bg-zinc-950/75 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-yellow-700/70 bg-yellow-950/30 text-yellow-300">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                          >
                            <path
                              d="M4.75 7.5h13.5A2.75 2.75 0 0 1 21 10.25v6.5a2.75 2.75 0 0 1-2.75 2.75H5.75A2.75 2.75 0 0 1 3 16.75v-8.5A.75.75 0 0 1 3.75 7.5h1Z"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M4.5 7.5 16.25 4.2a1.45 1.45 0 0 1 1.85 1.4v1.9"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M17.25 13.5h3.75"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                            />
                            <circle cx="17.25" cy="13.5" r="1" fill="currentColor" />
                          </svg>
                        </div>

                        <div>
                          <div className="text-sm font-mono font-semibold text-white">
                            Wallet
                          </div>
                          <div className="mt-1 text-[11px] font-mono text-yellow-300">
                            User authorization
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl border border-violet-900/50 bg-zinc-950/75 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-800/70 bg-blue-950/30 text-blue-300">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 789.37 789.37"
                            className="h-5 w-5"
                            fill="none"
                          >
                            <path
                              fill="currentColor"
                              d="m394.69,0C176.71,0,0,176.71,0,394.69s176.71,394.69,394.69,394.69,394.69-176.71,394.69-394.69S612.67,0,394.69,0Zm0,716.6c-177.5,0-321.91-144.41-321.91-321.91S217.18,72.78,394.69,72.78s321.91,144.41,321.91,321.91-144.41,321.91-321.91,321.91Z"
                            />
                            <rect fill="currentColor" x="357.64" y="357.64" width="74.09" height="74.09" />
                            <rect fill="currentColor" x="357.64" y="240.66" width="74.09" height="74.09" />
                            <rect fill="currentColor" x="357.64" y="123.69" width="74.09" height="74.09" />
                          </svg>
                        </div>

                        <div>
                          <div className="text-sm font-mono font-semibold text-white">
                            Midnight
                          </div>
                          <div className="mt-1 text-[11px] font-mono text-blue-300">
                            Sync layer
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-[13px] font-mono font-semibold text-zinc-300">
                Privacy-first discovery
              </h2>
              <p className="mt-1 text-[11px] font-mono text-zinc-600">
                The directory is designed to show useful public context without
                turning profiles into exact-location tracking.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {privacyCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5"
                >
                  <div className="text-sm font-mono font-semibold text-white">
                    {card.title}
                  </div>
                  <p className="mt-3 text-xs leading-6 text-zinc-500">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-sky-300">
              ✦
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              Explore the ambassador directory
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-sm leading-7 text-zinc-400">
              Browse verified ambassadors, explore country-level distribution,
              or request verification to publish your own profile.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/directory"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Browse Directory
              </Link>

              <Link
                href="/request-verification"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Request Verification
              </Link>
            </div>
          </section>
        </main>

      </div>
    </div>
  );
}