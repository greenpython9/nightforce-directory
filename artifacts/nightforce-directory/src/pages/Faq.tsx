import { Link } from "wouter";

const faqSections = [
  {
    title: "Directory basics",
    items: [
      {
        question: "What is nightforce.cc?",
        answer:
          "nightforce.cc is an unofficial community-built directory for discovering verified Nightforce ambassadors across countries, regions, roles, and public profile status.",
      },
      {
        question: "Is nightforce.cc an official Midnight product?",
        answer:
          "No. nightforce.cc is community-built and unofficial. It is not an official Midnight product, wallet authority, or official ambassador registration portal.",
      },
      {
        question: "Who can appear in the directory?",
        answer:
          "Profiles can appear when they are part of the directory’s verification and publishing flow. Public profiles can show selected profile details, while anonymous profiles can appear with limited public identity information.",
      },
      {
        question: "What does “verified” mean?",
        answer:
          "Verified means the profile has gone through the directory’s own verification flow before being displayed as a verified profile. It should not be treated as official identity verification by Midnight unless that is explicitly stated by official channels.",
      },
      {
  question: "How do I register as an official ambassador?",
  answer: (
    <>
      nightforce.cc does not handle ambassador registration. This
      website only helps display and organize directory profiles after someone
      is already part of the relevant Midnight ambassador program. To become an
      official ambassador, follow the official Midnight community channels and{" "}
      <a
        href="https://midnight.network/nightforce-ambassador-program"
        target="_blank"
        rel="noreferrer"
        className="text-emerald-300 underline underline-offset-4 transition-colors hover:text-emerald-200"
      >
        application process
      </a>
      .
    </>
  ),
},
    ],
  },
  {
    title: "Privacy and visibility",
    items: [
      {
        question: "What is the difference between Public, Anonymous, and Hidden?",
        answer:
          "Public profiles can show selected public profile details. Anonymous profiles can appear without a public display name while preserving basic directory context. Hidden profiles are not shown in the public directory.",
      },
      {
        question: "What does Public, Private, and Unavailable contact mean?",
        answer:
          "Public contact means public-facing contact information can be shown. Private contact means contact may be available through a controlled or privacy-aware contact flow. Unavailable means the profile does not currently expose a public or private contact path.",
      },
      {
        question: "Does the directory show exact user locations?",
        answer:
          "No. The directory is designed around country-level and region-level discovery. It should not expose exact user locations.",
      },
    ],
  },
  {
    title: "Globe and activity",
    items: [
      {
        question: "What does the globe show?",
        answer:
          "The globe is meant to show country-level ambassador distribution based on directory profile data. It is not meant to show exact locations.",
      },
      {
        question: "Is Recent Visitor Activity real-time tracking?",
        answer:
          "No. The Recent Visitor Activity panel is currently a demo-style UI placeholder. It does not track real visitors, IP addresses, or live visits yet.",
      },
    ],
  },
  {
    title: "Profiles and technology",
    items: [
      {
        question: "How do I request verification?",
        answer:
          "Use the Request Verification page to start the directory verification flow.",
      },
      {
        question: "What technology does the directory use?",
        answer:
          "nightforce.cc uses a hybrid architecture: the backend remains the source of truth for profile records, the user wallet is used for user-authorized actions, and selected metadata may be synchronized through Midnight contracts as a privacy-aware blockchain layer.",
      },
      {
        question: "Is all profile data stored on Midnight?",
        answer:
          "No. The backend remains the source of truth. Only selected profile and contact-mode metadata may be synchronized through Midnight contracts.",
      },
    ],
  },
];

export function Faq() {
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
              FAQ
            </div>

            <h1 className="mx-auto max-w-[820px] text-3xl font-bold tracking-tight text-white md:text-5xl">
              <span className="block">Frequently asked questions</span>
            </h1>

            <p className="mx-auto mt-5 max-w-[640px] text-sm leading-7 text-zinc-400">
              Clear answers about the directory, verification, privacy,
              profile visibility, the globe, and what this website does not do.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/request-verification"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Request Verification
              </Link>

              <Link
                href="/contact"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Contact
              </Link>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div className="self-start rounded-2xl border border-zinc-800 bg-[#18181b] p-5">
              <div className="text-[10px] font-mono uppercase tracking-wide text-emerald-400">
                Quick guide
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
                What this FAQ covers
              </h2>

              <p className="mt-4 text-sm leading-7 text-zinc-400">
                This page explains how the directory works, what public profile
                visibility means, what the globe represents, and where official
                ambassador registration should happen.
              </p>

              <div className="mt-6 grid gap-2">
                {faqSections.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-xl border border-zinc-800 bg-[#0b0d10]/80 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-mono font-semibold text-white">
                        {section.title}
                      </div>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-800 bg-[#07090b] p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">
                    Questions
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-zinc-500">
                    directory · privacy · globe · technology
                  </div>
                </div>

                <span className="rounded-full border border-emerald-900/70 bg-emerald-950/35 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wide text-emerald-300">
                  13 answers
                </span>
              </div>

              <div className="rounded-[24px] border border-zinc-800 bg-[#050607] p-4">
                <div className="space-y-6">
                  {faqSections.map((section) => (
                    <div key={section.title}>
                      <h2 className="mb-3 text-[10px] font-mono uppercase tracking-wide text-emerald-400">
                        {section.title}
                      </h2>

                      <div className="space-y-2">
                        {section.items.map((item) => (
                          <details
                            key={item.question}
                            className="group rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3"
                          >
                            <summary className="cursor-pointer list-none text-sm font-mono font-semibold leading-6 text-white">
                              <div className="flex items-start justify-between gap-4">
                                <span>{item.question}</span>
                                <span className="mt-1 text-[13px] text-zinc-600 transition-transform group-open:rotate-45 group-open:text-emerald-300">
                                  +
                                </span>
                              </div>
                            </summary>

                            <p className="mt-3 text-xs leading-6 text-zinc-500">
                              {item.answer}
                            </p>
                          </details>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-sky-300">
              ✦
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              Still need help?
            </h2>

            <p className="mx-auto mt-3 max-w-[560px] text-sm leading-7 text-zinc-400">
              Use the Contact page for directory-related questions, profile
              update issues, or general feedback.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/contact"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Contact
              </Link>

              <Link
                href="/directory"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Browse Directory
              </Link>
            </div>
          </section>
        </main>

      </div>
    </div>
  );
}