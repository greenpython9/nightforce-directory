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
  "Nightforce Directory will never ask for wallet recovery phrases.",
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
              <span className="block">Contact Nightforce</span>
              <span className="block">Directory</span>
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
                This contact form is intended for directory-related messages
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

            <div className="rounded-[28px] border border-zinc-800 bg-[#07090b] p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">
                    Contact form
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-zinc-500">
                    static preview · endpoint not connected yet
                  </div>
                </div>

                <span className="rounded-full border border-yellow-900/70 bg-yellow-950/30 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wide text-yellow-300">
                  static
                </span>
              </div>

              <form className="rounded-[24px] border border-zinc-800 bg-[#050607] p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="text-[10px] font-mono uppercase tracking-wide text-zinc-600"
                    >
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Your name"
                      className="mt-2 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-[12px] font-mono text-white placeholder:text-zinc-700 outline-none transition-colors focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="text-[10px] font-mono uppercase tracking-wide text-zinc-600"
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="you@example.com"
                      className="mt-2 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-[12px] font-mono text-white placeholder:text-zinc-700 outline-none transition-colors focus:border-zinc-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="contact-topic"
                    className="text-[10px] font-mono uppercase tracking-wide text-zinc-600"
                  >
                    Topic
                  </label>
                  <select
                    id="contact-topic"
                    defaultValue=""
                    className="mt-2 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-[12px] font-mono text-white outline-none transition-colors focus:border-zinc-500"
                  >
                    <option value="" disabled>
                      Choose a topic
                    </option>
                    <option>Verification help</option>
                    <option>Profile update</option>
                    <option>Bug report</option>
                    <option>General feedback</option>
                  </select>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="contact-message"
                    className="text-[10px] font-mono uppercase tracking-wide text-zinc-600"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={7}
                    placeholder="Write your message..."
                    className="mt-2 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-[12px] font-mono leading-6 text-white placeholder:text-zinc-700 outline-none transition-colors focus:border-zinc-500"
                  />
                </div>

                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                  <p className="text-[11px] leading-6 text-zinc-500">
                    This form is a static UI placeholder. It does not send
                    messages yet. A real contact endpoint can be connected in a
                    later phase.
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    disabled
                    className="flex h-10 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-[11px] font-mono text-zinc-600"
                  >
                    Send Message
                  </button>

                  <Link
                    href="/request-verification"
                    className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
                  >
                    Request Verification Instead
                  </Link>
                </div>
              </form>
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
                Learn About the Directory
              </Link>
            </div>
          </section>
        </main>

        <footer className="mt-12 border-t border-zinc-900 py-10">
          <div className="flex flex-col gap-3 text-[11px] font-mono text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Nightforce Directory is an unofficial community-built directory
              and is not an official Midnight product.
            </div>

            <div className="flex gap-4">
              <Link href="/" className="hover:text-zinc-300">
                Home
              </Link>
              <Link href="/directory" className="hover:text-zinc-300">
                Directory
              </Link>
              <Link href="/about" className="hover:text-zinc-300">
                About
              </Link>
              <Link href="/request-verification" className="hover:text-zinc-300">
                Request Verification
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}