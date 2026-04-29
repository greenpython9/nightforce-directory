import { Link } from "wouter";

const contactTopics = [
  {
    label: "Verification help",
    title: "Request or profile status",
    body: "Use this for questions about verification requests, public listing status, or profile visibility.",
  },
  {
    label: "Profile updates",
    title: "Correct public details",
    body: "Use this for correcting public profile details such as display name, country, region, role, or contact access.",
  },
  {
    label: "General feedback",
    title: "Bugs or suggestions",
    body: "Use this for reporting page issues, directory suggestions, or general community feedback.",
  },
];

const safetyNotes = [
  "Do not send wallet seed phrases, private keys, recovery words, or secret credentials.",
  "nightforce.cc will never ask for wallet recovery phrases.",
  "Only include information you are comfortable sharing with the directory team.",
];

export function Contact() {
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
              Contact
            </div>

            <h1 className="mx-auto max-w-[820px] text-3xl font-bold tracking-tight text-white md:text-5xl">
              <span className="block">Say hello!</span>
            </h1>

            <p className="mx-auto mt-5 max-w-[620px] text-sm leading-7 text-zinc-400">
              For directory questions, verification issues, public profile
              updates, or general community feedback.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/request-verification"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Request Verification
              </Link>

              <Link
                href="/directory"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Browse Directory
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {contactTopics.map((topic) => (
              <div
                key={topic.label}
                className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5"
              >
                <div className="text-[10px] font-mono uppercase tracking-wide text-emerald-400">
                  {topic.label}
                </div>

                <h2 className="mt-3 text-sm font-mono font-semibold text-white">
                  {topic.title}
                </h2>

                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  {topic.body}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="rounded-2xl border border-zinc-800 bg-[#18181b] p-5">
              <div className="text-[10px] font-mono uppercase tracking-wide text-emerald-400">
                Before you send
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
                Keep private information private
              </h2>

              <p className="mt-4 text-sm leading-7 text-zinc-400">
                This contact page is intended for directory-related messages
                only. It is not a wallet support channel and should not be used
                to send sensitive wallet or account secrets.
              </p>

              <div className="mt-6 grid gap-2">
                {safetyNotes.map((note) => (
                  <div
                    key={note}
                    className="rounded-xl border border-zinc-800 bg-[#0b0d10]/80 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                      <p className="text-[11px] leading-6 text-zinc-500">
                        {note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-800 bg-[#07090b] p-5 shadow-2xl">
              <div className="rounded-[24px] border border-zinc-800 bg-[#050607] p-5">
                <div className="text-[10px] font-mono uppercase tracking-wide text-emerald-400">
                  Email
                </div>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
                  Contact the directory team
                </h2>

                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  For directory questions, verification help, public profile
                  updates, bug reports, or general feedback, send an email to:
                </p>

                <a
                  href="mailto:hello@nightforce.cc"
                  className="mt-5 flex min-h-12 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 text-sm font-mono font-semibold text-emerald-100 transition-all hover:border-emerald-300/40 hover:bg-emerald-400/15 hover:text-white"
                >
                  hello@nightforce.cc
                </a>

                <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                  <p className="text-[11px] leading-6 text-zinc-500">
                    Please include enough context for us to understand your
                    request, but do not send wallet seed phrases, private keys,
                    recovery phrases, passwords, or secret credentials.
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href="/request-verification"
                    className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
                  >
                    Request Verification
                  </Link>

                  <Link
                    href="/faq"
                    className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    Read FAQ
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-sky-300">
              ✦
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              Need to publish a profile?
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-sm leading-7 text-zinc-400">
              If your message is about joining the directory or changing your
              public listing, start with the verification flow.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/request-verification"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Request Verification
              </Link>

              <Link
                href="/about"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                About nightforce.cc
              </Link>
            </div>
          </section>
        </main>

      </div>
    </div>
  );
}