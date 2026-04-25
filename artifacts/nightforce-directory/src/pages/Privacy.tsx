import { Link } from "wouter";

const lastUpdated = "April 26, 2026";

export function Privacy() {
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
            Privacy Policy
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
              Nightforce Directory (“Nightforce Directory,” “we,” “us,” or
              “our”) is an unofficial community-built directory operated by
              cobra.
            </p>

            <p className="mt-4">
              This Privacy Policy explains how we collect, use, store, and
              protect information when you use nightforce.cc and related
              Nightforce Directory pages, forms, profile flows, wallet-related
              flows, and directory features.
            </p>

            <p className="mt-4">
              Nightforce Directory is not an official Midnight product. It is
              not the official ambassador registration portal. It is a
              community-built directory intended to help display and organize
              profiles for existing Nightforce ambassadors or relevant community
              members.
            </p>

            <p className="mt-4">
              If you have questions about this Privacy Policy, you can contact
              us at{" "}
              <a
                href="mailto:test@example.com"
                className="text-emerald-300 underline underline-offset-4 transition-colors hover:text-emerald-200"
              >
                test@example.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              2. Information We Collect
            </h2>

            <p className="mt-5">
              We may collect information that you submit directly, information
              created through your use of the directory, and limited technical
              information needed to operate the website.
            </p>

            <h3 className="mt-8 text-lg font-bold text-white">
              2.1 Verification Request Information
            </h3>

            <p className="mt-4">
              When you submit a verification request, we may collect:
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Discord handle</li>
              <li>Region</li>
              <li>Notes or message submitted with the request</li>
              <li>Verification request status</li>
              <li>Admin review notes or related review information</li>
              <li>
                Timestamps related to submission, review, approval, rejection,
                or updates
              </li>
            </ul>

            <h3 className="mt-8 text-lg font-bold text-white">
              2.2 Profile Information
            </h3>

            <p className="mt-4">
              When a profile is created, edited, published, or displayed, we may
              collect and store:
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Display name</li>
              <li>Avatar URL</li>
              <li>Country</li>
              <li>Region</li>
              <li>Role</li>
              <li>Bio</li>
              <li>Website URL</li>
              <li>Public email, if provided</li>
              <li>Social links</li>
              <li>Profile visibility settings</li>
              <li>Contact access or contact mode</li>
              <li>Verification status</li>
              <li>Publish status</li>
              <li>Wallet binding information or wallet address, where applicable</li>
              <li>Encrypted hidden email payload, where applicable</li>
              <li>
                Timestamps related to profile creation, update, publication, or
                inactivity
              </li>
            </ul>

            <h3 className="mt-8 text-lg font-bold text-white">
              2.3 Wallet-Related Information
            </h3>

            <p className="mt-4">
              If you connect a wallet or use wallet-related profile features, we
              may process wallet-related information needed to connect, bind,
              verify, or update your directory profile.
            </p>

            <div className="mt-6 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-5 py-4">
              <p className="text-sm font-semibold leading-7 text-emerald-300">
                Important: Nightforce Directory never asks for private keys,
                seed phrases, wallet recovery phrases, or secret credentials. Do
                not send these through the website, contact form, email,
                Discord, or any other channel.
              </p>
            </div>

            <h3 className="mt-8 text-lg font-bold text-white">
              2.4 Contact Form Information
            </h3>

            <p className="mt-4">
              The Contact page currently contains a static form UI only. At this
              stage, the contact form does not send messages, submit data, or
              store contact form entries.
            </p>

            <p className="mt-4">
              If we later connect the contact form to a backend, email service,
              or support system, we may collect information submitted through
              that form, such as name, email address, topic, and message. We
              will update this Privacy Policy when that feature becomes active.
            </p>

            <h3 className="mt-8 text-lg font-bold text-white">
              2.5 Globe and Visitor Activity
            </h3>

            <p className="mt-4">
              The globe feature is intended to show country-level ambassador
              distribution based on directory profile data. It is not intended
              to show exact user locations.
            </p>

            <p className="mt-4">
              The Recent Visitor Activity panel is currently a demo placeholder.
              It does not track real visitors, IP addresses, or live visits at
              this stage.
            </p>

            <p className="mt-4">
              If we later make visitor activity real, we may process limited
              visitor activity information such as page visits, timestamps, and
              approximate country-level location estimates. We will update this
              Privacy Policy before or when that feature becomes active.
            </p>

            <h3 className="mt-8 text-lg font-bold text-white">
              2.6 Analytics and Technical Information
            </h3>

            <p className="mt-4">
              The website does not currently use analytics. After launch, we may
              use Cloudflare Analytics and Google Analytics to understand
              website traffic, page performance, and general usage patterns.
            </p>

            <p className="mt-4">
              Analytics tools may collect information such as pages visited,
              approximate location, device or browser information, referring
              pages, timestamps, and other technical data.
            </p>

            <p className="mt-4">
              We are not currently sure whether the website uses cookies or
              similar technologies. If cookies, analytics identifiers, or
              similar tools are used, they will be used to operate the website,
              measure traffic, improve performance, or understand general usage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              3. How We Use Information
            </h2>

            <p className="mt-5">We may use information to:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Operate Nightforce Directory</li>
              <li>Review verification requests</li>
              <li>Create, update, publish, hide, or remove profiles</li>
              <li>Display public or anonymous profile information</li>
              <li>Manage profile visibility and contact access settings</li>
              <li>Support wallet-related profile features</li>
              <li>
                Sync selected profile or contact-mode metadata through Midnight
                contracts
              </li>
              <li>Prevent abuse, spam, fraud, or misuse</li>
              <li>Respond to privacy, profile correction, or removal requests</li>
              <li>Improve site performance, reliability, and user experience</li>
              <li>Comply with legal obligations or protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              4. What Is Public
            </h2>

            <p className="mt-5">
              If a profile is published publicly, selected profile information
              may be visible to visitors of the website.
            </p>

            <p className="mt-4">Public profile information may include:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Display name</li>
              <li>Avatar</li>
              <li>Country</li>
              <li>Region</li>
              <li>Role</li>
              <li>Bio</li>
              <li>Website URL</li>
              <li>Public email, if enabled</li>
              <li>Social links</li>
              <li>Contact availability</li>
              <li>Verification status</li>
            </ul>

            <p className="mt-4">
              Anonymous profiles may appear with limited public identity
              information. Hidden profiles are not intended to appear in the
              public directory.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              5. Midnight and Blockchain-Related Data
            </h2>

            <p className="mt-5">
              Nightforce Directory uses a hybrid architecture. The backend
              remains the source of truth for profile records, verification
              state, visibility settings, and contact-mode data.
            </p>

            <p className="mt-4">
              Wallet-related actions may be authorized through the user’s own
              wallet. Selected profile or contact-mode metadata may be
              synchronized through Midnight contracts as a privacy-aware
              blockchain layer.
            </p>

            <p className="mt-4">
              Not all profile data is stored on Midnight. Only selected metadata
              may be synchronized. Blockchain-related data may be public,
              persistent, or difficult to remove depending on how the relevant
              network or contract works.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              6. How We Share Information
            </h2>

            <p className="mt-5 font-semibold text-white">
              We do not sell personal information.
            </p>

            <p className="mt-4">
              We do not share personal information with advertisers or marketing
              partners.
            </p>

            <p className="mt-4">
              We may share or process information with service providers or
              infrastructure providers that help operate the website, such as
              hosting, database, analytics, security, or technical service
              providers.
            </p>

            <p className="mt-4">Examples may include:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Cloudflare hosting, analytics, infrastructure, or database services</li>
              <li>Google Analytics, if enabled after launch</li>
              <li>
                Midnight-related tools, wallets, contracts, or network
                interactions when users use wallet or Midnight-related features
              </li>
            </ul>

            <p className="mt-4">
              We may also disclose information if required by law, legal
              process, security needs, abuse prevention, or to protect the
              rights and safety of Nightforce Directory, users, or others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              7. Data Retention
            </h2>

            <p className="mt-5">
              We keep data only as long as needed to operate the directory,
              handle verification, maintain security, or comply with legal
              obligations.
            </p>

            <p className="mt-4">
              We may retain verification records, profile records, wallet
              binding records, contact-mode records, technical records, or admin
              review records as needed for the directory to function.
            </p>

            <p className="mt-4">
              We may remove, hide, or deactivate profiles if they are
              inaccurate, outdated, abusive, misleading, harmful, or violate site
              rules.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              8. Data Correction and Removal
            </h2>

            <p className="mt-5">
              Users may request correction or removal of their profile
              information.
            </p>

            <p className="mt-4">You may contact us by:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                Emailing{" "}
                <a
                  href="mailto:test@example.com"
                  className="text-emerald-300 underline underline-offset-4 transition-colors hover:text-emerald-200"
                >
                  test@example.com
                </a>
              </li>
              <li>Using the Contact page, once the contact method is active</li>
            </ul>

            <p className="mt-4">
              We may need to verify your identity or connection to the profile
              before making changes. Some blockchain-related records may not be
              fully removable if they have already been written to a public or
              persistent blockchain network.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              9. Security
            </h2>

            <p className="mt-5">
              We use reasonable technical and organizational measures to protect
              information handled by the website.
            </p>

            <p className="mt-4">
              However, no website, database, wallet connection, network, or
              online service can be guaranteed to be completely secure.
            </p>

            <p className="mt-4">
              You are responsible for protecting your own wallet, private keys,
              seed phrases, recovery phrases, passwords, devices, and accounts.
            </p>

            <div className="mt-6 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-5 py-4">
              <p className="text-sm font-semibold leading-7 text-emerald-300">
                Nightforce Directory will never ask for wallet seed phrases,
                private keys, or recovery phrases.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              10. Children and Age Restrictions
            </h2>

            <p className="mt-5">
              Nightforce Directory is intended for users who are 18 years old or
              older.
            </p>

            <p className="mt-4">
              The website is not intended for children or minors. Do not submit
              information to the website if you are not legally allowed to do so
              under your local rules.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              11. Third-Party Links
            </h2>

            <p className="mt-5">
              Nightforce Directory may link to third-party websites, including
              Midnight Network pages, blog posts, documentation, ambassador
              program pages, wallet providers, analytics providers, or other
              external resources.
            </p>

            <p className="mt-4">
              We are not responsible for the privacy practices, content, or
              security of third-party websites. You should review their privacy
              policies before using them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              12. International Access
            </h2>

            <p className="mt-5">
              Nightforce Directory is operated from Malaysia, but the website may
              be accessed by users in other countries.
            </p>

            <p className="mt-4">
              By using the website, you understand that information may be
              processed, stored, or accessed in Malaysia or other locations where
              our service providers operate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              13. Changes to This Privacy Policy
            </h2>

            <p className="mt-5">
              We may update this Privacy Policy from time to time.
            </p>

            <p className="mt-4">
              If we add new features, such as a working contact form, real
              visitor activity tracking, new analytics tools, or additional
              wallet/Midnight features, we may update this policy to explain how
              those features handle information.
            </p>

            <p className="mt-4">
              The “Last updated” date will show when this Privacy Policy was
              last changed.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Questions about privacy?
            </h2>

            <p className="mx-auto mt-3 max-w-[560px] text-sm leading-7 text-zinc-400">
              Contact us if you need to request correction, removal, or
              clarification about directory data.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/contact"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-white px-4 text-[11px] font-mono font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Contact
              </Link>

              <Link
                href="/faq"
                className="flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-[11px] font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Read FAQ
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}