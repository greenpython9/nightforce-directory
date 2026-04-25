import { Link } from "wouter";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 mx-auto mt-12 max-w-[1120px] border-t border-zinc-900 px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 text-[11px] font-mono text-zinc-600 md:grid-cols-4">
        <div>
          <div className="mb-3 text-zinc-400">Navigation</div>
          <div className="space-y-2">
            <Link href="/" className="block hover:text-zinc-300">
              Home
            </Link>
            <Link href="/directory" className="block hover:text-zinc-300">
              Directory
            </Link>
            <Link href="/about" className="block hover:text-zinc-300">
              About
            </Link>
            <Link href="/faq" className="block hover:text-zinc-300">
              FAQ
            </Link>
            <Link href="/contact" className="block hover:text-zinc-300">
              Contact
            </Link>
            <Link href="/privacy" className="block hover:text-zinc-300">
              Privacy
            </Link>
            <Link href="/terms" className="block hover:text-zinc-300">
              Terms
            </Link>
            <Link
              href="/request-verification"
              className="block hover:text-zinc-300"
            >
              Request Verification
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-3 text-zinc-400">Browse</div>
          <div className="space-y-2">
            <a href="/#globe" className="block hover:text-zinc-300">
              Globe
            </a>
            <a href="/#updates" className="block hover:text-zinc-300">
              Updates
            </a>
            <Link href="/directory" className="block hover:text-zinc-300">
              All Profiles
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-3 text-zinc-400">Account</div>
          <div className="space-y-2">
            <Link href="/wallet" className="block hover:text-zinc-300">
              Wallet / Profile
            </Link>
            <Link href="/my-profile" className="block hover:text-zinc-300">
              My Profile
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-3 text-zinc-400">Midnight</div>
          <div className="space-y-2">
            <a
              href="https://midnight.network/"
              target="_blank"
              rel="noreferrer"
              className="block hover:text-zinc-300"
            >
              Network
            </a>
            <a
              href="https://midnight.network/blog"
              target="_blank"
              rel="noreferrer"
              className="block hover:text-zinc-300"
            >
              Blog
            </a>
            <a
              href="https://docs.midnight.network/"
              target="_blank"
              rel="noreferrer"
              className="block hover:text-zinc-300"
            >
              Docs
            </a>
            <a
              href="https://midnight.network/nightforce-ambassador-program"
              target="_blank"
              rel="noreferrer"
              className="block hover:text-zinc-300"
            >
              Ambassador Program
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-zinc-900 pt-6 text-[10px] leading-5 text-zinc-700">
        <div>
          nightforce.cc is an unofficial community-built directory and is
          not an official Midnight product.
        </div>

        <div className="mt-2">
            © {currentYear} Copyright · Built and vibe coded by{" "}
            <span className="font-semibold text-zinc-500">cobra</span>
        </div>
      </div>
    </footer>
  );
}