import type { ReactElement } from "react";

import { MidnamesProfileButton } from "../components/MidnamesProfileButton";
import { ProfileCard } from "../components/ProfileCard";
import { getMidnamesNetworkLabel } from "../services/midnamesConfig";

const TEST_DOMAIN = "12345.night";

const INTERACTIVE_MIDNAMES_ENABLED =
  import.meta.env.VITE_ENABLE_INTERACTIVE_MIDNAMES === "true";

export function MidnamesTest(): ReactElement {
  return (
    <main className="min-h-screen px-4 py-24 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Development-only integration check
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-white">
          Midnames SDK test
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          This route uses the same Midnames button, modal, provider,
          profile-card surface, and SDK widgets used by the directory. No
          Midnames response is mocked.
        </p>

        <dl className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 font-mono text-sm sm:grid-cols-3">
          <div>
            <dt className="text-zinc-500">Domain</dt>
            <dd className="mt-1 text-white">{TEST_DOMAIN}</dd>
          </div>

          <div>
            <dt className="text-zinc-500">Network</dt>
            <dd className="mt-1 text-white">{getMidnamesNetworkLabel()}</dd>
          </div>

          <div>
            <dt className="text-zinc-500">Interactive mode</dt>
            <dd className="mt-1 text-white">
              {INTERACTIVE_MIDNAMES_ENABLED ? "enabled" : "disabled"}
            </dd>
          </div>
        </dl>

        {!INTERACTIVE_MIDNAMES_ENABLED && (
          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 text-sm leading-6 text-amber-100">
            Interactive Midnames is disabled in this build. Set{" "}
            <code className="font-mono text-amber-200">
              VITE_ENABLE_INTERACTIVE_MIDNAMES=true
            </code>{" "}
            and restart the frontend.
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-lg font-semibold text-white">
              Directory profile-card surface
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Click the .night label at the bottom of the card.
            </p>

            <div className="mt-5">
              <ProfileCard
                profile={{
                  publicId: "midnames-development-test",
                  displayName: "Midnames SDK Test",
                  role: "Development verification",
                  country: "Preprod",
                  region: "Development",
                  contactMode: "NO_CONTACT",
                  nightDomain: TEST_DOMAIN,
                  socials: [],
                  isVerified: true,
                  visibility: "public",
                }}
                viewHref="/dev/midnames-test"
                viewLabel="Test route"
                nightIdentityMode="interactive"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-lg font-semibold text-white">
              Direct SDK widget checks
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              These controls open the existing card and full-profile modal modes
              directly.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <MidnamesProfileButton
                domain={TEST_DOMAIN}
                mode="card"
                className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-left font-mono text-sm text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-400/15"
              >
                Open holographic card
              </MidnamesProfileButton>

              <MidnamesProfileButton
                domain={TEST_DOMAIN}
                mode="full"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left font-mono text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                Open full domain profile
              </MidnamesProfileButton>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
