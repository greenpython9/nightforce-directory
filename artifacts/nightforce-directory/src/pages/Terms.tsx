import { Link } from "wouter";

const lastUpdated = "April 26, 2026";

export function Terms() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-zinc-700/10 blur-3xl" />
        <div className="absolute left-[12%] top-[28%] h-80 w-80 rounded-full bg-zinc-800/10 blur-3xl" />
        <div className="absolute right-[10%] top-[36%] h-96 w-96 rounded-full bg-zinc-800/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[900px] px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <header className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] font-mono font-semibold text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <span className="text-sky-300">✦</span>
            <span>Nightforce Directory</span>
          </Link>

          <h1 className="mt-8 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Terms of Service
          </h1>

          <p className="mt-5 text-[11px] font-mono text-zinc-500">
            Last updated: {lastUpdated}
          </p>
        </header>

        <main className="mt-12 space-y-12 text-sm leading-7 text-zinc-400">
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              1. Introduction
            </h2>

            <p className="mt-5">
              Welcome to nightforce.cc. These Terms of Service
              (“Terms”) govern your access to and use of nightforce.cc and any
              related nightforce.cc pages, profile flows, verification
              flows, wallet-related features, directory features, and other
              services we provide.
            </p>

            <p className="mt-4">
              nightforce.cc is operated by cobra from Malaysia. By using
              the website, browsing the directory, submitting a verification
              request, connecting a wallet, creating or editing a profile, or
              using any related feature, you agree to these Terms.
            </p>

            <p className="mt-4">
              If you do not agree to these Terms, do not use Nightforce
              Directory.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              2. Eligibility
            </h2>

            <p className="mt-5">
              nightforce.cc is intended for users who are 18 years old or
              older.
            </p>

            <p className="mt-4">
              By using the website, you confirm that you are at least 18 years
              old and that you are legally allowed to use the website under the
              laws that apply to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              3. Unofficial Community-Built Directory
            </h2>

            <p className="mt-5">
              nightforce.cc is unofficial, community-built, and not an
              official Midnight product, wallet provider, identity authority, or
              official ambassador registration portal.
            </p>

            <p className="mt-4">
              References to Midnight, Nightforce, ambassadors, wallets,
              networks, contracts, blog posts, documentation, or related
              community resources are provided for directory and community
              context only.
            </p>

            <div className="mt-6 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-5 py-4">
              <p className="text-sm font-semibold leading-7 text-emerald-300">
                Important: nightforce.cc does not decide official
                Midnight ambassador status and is not the official ambassador
                application portal.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              4. Ambassador Registration and Verification
            </h2>

            <p className="mt-5">
              Verification on nightforce.cc is only for directory-related
              access, profile publication, and directory display purposes.
            </p>

            <p className="mt-4">
              Verification on this website does not mean official Midnight
              identity verification, official ambassador approval, official
              endorsement, or any guarantee that a profile is officially
              recognized by Midnight.
            </p>

            <p className="mt-4">
              nightforce.cc does not handle official ambassador
              registration. To become an official ambassador, follow the
              official Midnight community channels and{" "}
              <a
                href="https://midnight.network/nightforce-ambassador-program"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 underline underline-offset-4 transition-colors hover:text-emerald-200"
              >
                application process
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              5. User-Submitted Information
            </h2>

            <p className="mt-5">
              You are responsible for the accuracy, legality, and
              appropriateness of any information you submit to Nightforce
              Directory.
            </p>

            <p className="mt-4">
              This may include verification request information, Discord handle,
              region, notes, profile information, display name, avatar URL,
              country, region, role, bio, website URL, public email, social
              links, visibility settings, contact-mode settings, wallet-related
              information, and other profile-related details.
            </p>

            <p className="mt-4">
              You should only submit information that you have the right to
              submit and that you are comfortable being processed, reviewed, or
              displayed according to your selected settings and our Privacy
              Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              6. Public Profiles and Directory Listings
            </h2>

            <p className="mt-5">
              If your profile is published publicly, selected profile
              information may be visible to visitors of the website.
            </p>

            <p className="mt-4">
              Public profile data may be incomplete, outdated, inaccurate,
              delayed, temporarily unavailable, changed, hidden, or removed.
            </p>

            <p className="mt-4">
              We may edit, hide, reject, remove, deactivate, or decline to
              publish any profile, verification request, profile field, contact
              setting, social link, or other content if we believe it is
              inaccurate, outdated, misleading, abusive, harmful, unlawful,
              violates these Terms, creates risk, or is not appropriate for the
              directory.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              7. Wallet and Midnight-Related Features
            </h2>

            <p className="mt-5">
              Some features may involve wallet connection, wallet binding,
              wallet-authorized actions, Midnight-related actions, contract
              reads, contract writes, or synchronization of selected metadata.
            </p>

            <p className="mt-4">
              You are responsible for your own wallet safety, including your
              wallet address, connected wallet, private keys, seed phrases,
              recovery phrases, devices, accounts, signatures, and transactions.
            </p>

            <div className="mt-6 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-5 py-4">
              <p className="text-sm font-semibold leading-7 text-emerald-300">
                nightforce.cc will never ask for seed phrases, private
                keys, wallet recovery phrases, or secret credentials.
              </p>
            </div>

            <p className="mt-6">
              Midnight-related or blockchain-related interactions may be
              irreversible, persistent, delayed, unavailable, rejected, failed,
              or difficult to remove depending on the network, wallet, contract,
              browser, provider, or infrastructure involved.
            </p>

            <p className="mt-4">
              You should review wallet prompts carefully before approving any
              action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              8. Preview, Experimental, and Changing Features
            </h2>

            <p className="mt-5">
              Some features may be shown as demo, preview, development, or
              experimental features before launch or before a full backend flow
              is connected.
            </p>

            <p className="mt-4">
              These features may be incomplete, placeholder, inaccurate,
              changed, removed, redesigned, or replaced at any time.
            </p>

            <p className="mt-4">
              Recent Visitor Activity is intended to show limited country-level
              public page activity. It may be incomplete, delayed, temporarily
              unavailable, changed, or removed. You should not treat it as exact
              location tracking, personal identity tracking, or a complete
              real-time record of all website visits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              9. Prohibited Conduct
            </h2>

            <p className="mt-5">You agree not to:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Submit false, misleading, or inaccurate profile data</li>
              <li>Impersonate another person, ambassador, project, or entity</li>
              <li>Submit someone else’s private or sensitive information</li>
              <li>Submit private keys, seed phrases, recovery phrases, or secret credentials</li>
              <li>Abuse verification, contact, wallet, or profile flows</li>
              <li>Use the website for harassment, spam, fraud, abuse, or illegal activity</li>
              <li>Attempt to bypass access controls, admin controls, or wallet checks</li>
              <li>Scrape, overload, attack, probe, disrupt, or interfere with the website</li>
              <li>Upload or submit harmful code, malicious links, or deceptive content</li>
              <li>Use the website in a way that harms nightforce.cc, users, Midnight, or the broader community</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              10. Third-Party Links and Services
            </h2>

            <p className="mt-5">
              nightforce.cc may link to third-party websites, including
              Midnight Network pages, blog posts, documentation, ambassador
              program pages, wallet providers, analytics providers, or other
              external resources.
            </p>

            <p className="mt-4">
              We do not control third-party websites or services and are not
              responsible for their content, availability, security, terms,
              policies, or actions.
            </p>

            <p className="mt-4">
              You should review the applicable terms and privacy policies of any
              third-party website, wallet, provider, or service before using it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              11. Availability and Changes
            </h2>

            <p className="mt-5">
              We may update, change, suspend, limit, remove, or discontinue any
              part of nightforce.cc at any time.
            </p>

            <p className="mt-4">
              We do not guarantee that the website, directory, profile pages,
              verification flows, wallet features, contact flows, globe,
              visitor activity, APIs, databases, or Midnight-related features
              will always be available, accurate, secure, uninterrupted, or
              error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              12. No Warranties
            </h2>

            <p className="mt-5">
              nightforce.cc is provided “as is” and “as available.”
            </p>

            <p className="mt-4">
              To the maximum extent allowed by law, we disclaim all warranties,
              whether express, implied, or statutory, including warranties of
              accuracy, availability, reliability, merchantability, fitness for
              a particular purpose, non-infringement, and error-free operation.
            </p>

            <p className="mt-4">
              We do not guarantee that profile information, verification status,
              directory listings, country counts, region counts, contact
              availability, wallet state, contract state, analytics, or visitor
              activity will be complete, accurate, current, or suitable for your
              needs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              13. Limitation of Liability
            </h2>

            <p className="mt-5">
              To the maximum extent allowed by law, nightforce.cc, cobra,
              and any contributors, maintainers, or related parties will not be
              liable for indirect, incidental, special, consequential,
              exemplary, punitive, or lost-profit damages.
            </p>

            <p className="mt-4">
              This includes damages related to profile errors, verification
              issues, wallet actions, blockchain transactions, unavailable
              services, lost data, unauthorized access, third-party services,
              incorrect listings, or your use of or inability to use the
              website.
            </p>

            <p className="mt-4">
              Nothing in these Terms limits liability where the law does not
              allow that limitation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              14. Indemnity
            </h2>

            <p className="mt-5">
              To the extent allowed by law, you agree to defend, indemnify, and
              hold harmless nightforce.cc, cobra, and any contributors,
              maintainers, or related parties from claims, damages, losses,
              liabilities, costs, and expenses arising from your use of the
              website, your submitted information, your profile content, your
              wallet actions, your violation of these Terms, or your violation
              of any law or third-party right.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              15. Privacy
            </h2>

            <p className="mt-5">
              Our handling of personal information is described in our{" "}
              <Link
                href="/privacy"
                className="text-emerald-300 underline underline-offset-4 transition-colors hover:text-emerald-200"
              >
                Privacy Policy
              </Link>
              .
            </p>

            <p className="mt-4">
              By using nightforce.cc, you acknowledge that you have read
              and understood the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              16. Governing Law
            </h2>

            <p className="mt-5">
              These Terms are governed by the laws of Malaysia, except where
              mandatory local consumer protection, privacy, or other laws apply.
            </p>

            <p className="mt-4">
              If a dispute arises, you agree to first contact us and try to
              resolve the issue informally before starting any formal legal
              process, unless the law allows or requires otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              17. Changes to These Terms
            </h2>

            <p className="mt-5">
              We may update these Terms from time to time.
            </p>

            <p className="mt-4">
              If we update the Terms, we will change the “Last updated” date.
              Your continued use of nightforce.cc after changes are made
              means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              18. Contact
            </h2>

            <p className="mt-5">
              If you have questions about these Terms, contact us at{" "}
              <a
                href="mailto:test@example.com"
                className="text-emerald-300 underline underline-offset-4 transition-colors hover:text-emerald-200"
              >
                test@example.com
              </a>
              .
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Questions about these Terms?
            </h2>

            <p className="mx-auto mt-3 max-w-[560px] text-sm leading-7 text-zinc-400">
              Contact us if you need clarification about site rules,
              verification boundaries, wallet safety, or directory usage.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/contact"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Contact
              </Link>

              <Link
                href="/privacy"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Privacy Policy
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}