import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { WalletProvider } from "./hooks/useWallet";
import { NavBar } from "./components/NavBar";
import { SiteFooter } from "./components/SiteFooter";
import { SEO } from "./components/SEO";
import { Landing } from "./pages/Landing";
import { WalletAccess } from "./pages/WalletAccess";
import { Directory } from "./pages/Directory";
import { RequestVerification } from "./pages/RequestVerification";
import { AdminReview } from "./pages/AdminReview";
import { MyProfile } from "./pages/MyProfile";
import { PublicProfile } from "./pages/PublicProfile";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Faq } from "./pages/Faq";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { buildNightforceApiUrl } from "./lib/nightforceApi";

const ENABLE_VISITOR_ACTIVITY_LOGGING =
  import.meta.env.VITE_ENABLE_VISITOR_ACTIVITY_LOGGING === "true";

const VISITOR_ACTIVITY_LOG_COOLDOWN_MS = 5 * 60 * 1000;

const PUBLIC_VISITOR_ACTIVITY_PATHS = new Set([
  "/",
  "/directory",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/request-verification",
]);

type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

type RouteSEO = {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
  jsonLd?: JsonLdValue;
};

const HOME_PAGE_JSON_LD: JsonLdValue = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "nightforce.cc",
  url: "https://nightforce.cc/",
  description:
    "nightforce.cc is an unofficial community-built directory for verified Nightforce ambassador profiles.",
  inLanguage: "en",
};

const FAQ_PAGE_JSON_LD: JsonLdValue = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is nightforce.cc?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "nightforce.cc is an unofficial community-built directory for discovering verified Nightforce ambassadors across countries, regions, roles, and public profile status.",
      },
    },
    {
      "@type": "Question",
      name: "Is nightforce.cc an official Midnight product?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. nightforce.cc is community-built and unofficial. It is not an official Midnight product, wallet authority, or official ambassador registration portal.",
      },
    },
    {
      "@type": "Question",
      name: "Who can appear in the directory?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Profiles can appear when they are part of the directory’s verification and publishing flow. Public profiles can show selected profile details, while anonymous profiles can appear with limited public identity information.",
      },
    },
    {
      "@type": "Question",
      name: "What does “verified” mean?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Verified means the profile has gone through the directory’s own verification flow before being displayed as a verified profile. It should not be treated as official identity verification by Midnight unless that is explicitly stated by official channels.",
      },
    },
    {
      "@type": "Question",
      name: "How do I register as an official ambassador?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "nightforce.cc does not handle ambassador registration. This website only helps display and organize directory profiles after someone is already part of the relevant Midnight ambassador program. To become an official ambassador, follow the official Midnight community channels and application process.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between Public, Anonymous, and Hidden?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Public profiles can show selected public profile details. Anonymous profiles can appear without a public display name while preserving basic directory context. Hidden profiles are not shown in the public directory.",
      },
    },
    {
      "@type": "Question",
      name: "What does Public, Private, and Unavailable contact mean?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Public contact means public-facing contact information can be shown. Private contact means contact may be available through a controlled or privacy-aware contact flow. Unavailable means the profile does not currently expose a public or private contact path.",
      },
    },
    {
      "@type": "Question",
      name: "Does the directory show exact user locations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The directory is designed around country-level and region-level discovery. It should not expose exact user locations.",
      },
    },
    {
      "@type": "Question",
      name: "What does the globe show?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The globe is meant to show country-level ambassador distribution based on directory profile data. It is not meant to show exact locations.",
      },
    },
    {
      "@type": "Question",
      name: "What does Recent Visitor Activity show?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Recent Visitor Activity shows limited country-level public page activity. It may display an anonymous generated visitor alias, approximate country, visited public page path, and recent timestamp. It does not show exact locations, city-level location, raw IP addresses, wallet identity, profile identity, or personal identity.",
      },
    },
    {
      "@type": "Question",
      name: "How do I request verification?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use the Request Verification page to start the directory verification flow.",
      },
    },
    {
      "@type": "Question",
      name: "What technology does the directory use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "nightforce.cc uses a hybrid architecture: the backend remains the source of truth for profile records, the user wallet is used for user-authorized actions, and selected metadata may be synchronized through Midnight contracts as a privacy-aware blockchain layer.",
      },
    },
    {
      "@type": "Question",
      name: "How does nightforce.cc use Midnight?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In simple terms, nightforce.cc uses Midnight like a privacy-aware contact status switch for wallet-connected profiles. That switch can say one of three things: no contact available, private contact available, or public contact allowed. The full profile record still lives in the directory backend. Midnight is used for selected wallet/profile metadata, so the website can show how a privacy-aware blockchain layer can help manage public vs private contact availability without putting the full profile or raw contact details on-chain.",
      },
    },
    {
      "@type": "Question",
      name: "Is all profile data stored on Midnight?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The backend remains the source of truth. Only selected profile and contact-mode metadata may be synchronized through Midnight contracts.",
      },
    },
    {
      "@type": "Question",
      name: "How does encrypted private contact work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Think of private contact like a locked contact card. If a profile uses private contact, the raw contact email is not shown on the public profile. The directory can know that a private contact path exists, but visitors do not simply see the email address unless the profile owner chooses a public contact option.",
      },
    },
  ],
};

const ROUTE_SEO_METADATA: Record<string, RouteSEO> = {
  "/": {
    title: "nightforce.cc | Verified Midnight Nightforce Ambassador Profiles",
    description:
      "nightforce.cc is an unofficial community-built directory for verified Nightforce ambassadors across countries, regions, roles, and public profile status.",
    canonicalPath: "/",
    jsonLd: HOME_PAGE_JSON_LD,
  },
  "/directory": {
    title: "Browse Nightforce Ambassadors | nightforce.cc Directory",
    description:
      "Browse public Nightforce ambassador profiles by name, role, country, region, and contact availability in an unofficial community-built directory.",
    canonicalPath: "/directory",
  },
  "/about": {
    title: "About nightforce.cc | Community-Built Nightforce Ambassador Directory",
    description:
      "Learn how nightforce.cc helps people discover verified Nightforce ambassador profiles while keeping profile visibility and contact choices clear.",
    canonicalPath: "/about",
  },
  "/faq": {
    title: "nightforce.cc FAQ | Verification, Profiles, and Contact Modes",
    description:
      "Read answers about nightforce.cc Directory verification, public profiles, anonymous profiles, contact modes, wallet use, and Midnight-related metadata.",
    canonicalPath: "/faq",
    jsonLd: FAQ_PAGE_JSON_LD,
  },
  "/contact": {
    title: "Contact nightforce.cc | Verification and Profile Help",
    description:
      "Contact nightforce.cc about Nightforce directory verification requests, public listing status, profile visibility, or directory-related issues.",
    canonicalPath: "/contact",
  },
  "/privacy": {
    title: "Privacy Policy | nightforce.cc Directory",
    description:
      "Read the nightforce.cc Directory privacy policy for information about public profiles, verification data, wallet-related metadata, and contact choices.",
    canonicalPath: "/privacy",
  },
  "/terms": {
    title: "Terms of Use | nightforce.cc",
    description:
      "Read the nightforce.cc Directory terms of use for this unofficial community-built directory for Nightforce ambassador profiles.",
    canonicalPath: "/terms",
  },
  "/request-verification": {
    title: "Request Verification | nightforce.cc Directory",
    description:
      "Request access to publish a profile on nightforce.cc Directory if you are an existing Nightforce ambassador using a connected Midnight wallet.",
    canonicalPath: "/request-verification",
  },
  "/wallet": {
    title: "Wallet Access | nightforce.cc",
    description:
      "Connect a supported Midnight wallet to nightforce.cc for verification-linked profile access and user-authorized profile actions.",
    canonicalPath: "/wallet",
  },
};

const PRIVATE_ROUTE_SEO_METADATA: RouteSEO = {
  title: "nightforce.cc Directory",
  description:
    "nightforce.cc is an unofficial community-built directory for verified Nightforce ambassador profiles.",
  canonicalPath: "/",
  robots: "noindex,nofollow",
};

function normalizeVisitorActivityPath(location: string): string {
  const pathOnly = location.split("?")[0]?.split("#")[0] || "/";
  return pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
}

function shouldLogVisitorActivityPath(path: string): boolean {
  return PUBLIC_VISITOR_ACTIVITY_PATHS.has(path);
}

function getVisitorActivitySessionKey(path: string): string {
  return `nightforce:visitor-activity:${path}`;
}

function wasVisitorActivityRecentlyLogged(path: string): boolean {
  try {
    const storedValue = window.sessionStorage.getItem(
      getVisitorActivitySessionKey(path),
    );

    const lastLoggedAt = Number.parseInt(storedValue ?? "", 10);

    return (
      Number.isFinite(lastLoggedAt) &&
      Date.now() - lastLoggedAt < VISITOR_ACTIVITY_LOG_COOLDOWN_MS
    );
  } catch {
    return false;
  }
}

function markVisitorActivityLogged(path: string): void {
  try {
    window.sessionStorage.setItem(
      getVisitorActivitySessionKey(path),
      String(Date.now()),
    );
  } catch {
    // Ignore storage failures. Visitor activity is non-critical.
  }
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [location]);

  return null;
}

function VisitorActivityLogger() {
  const [location] = useLocation();

  useEffect(() => {
    if (!ENABLE_VISITOR_ACTIVITY_LOGGING) {
      return;
    }

    const path = normalizeVisitorActivityPath(location);

    if (!shouldLogVisitorActivityPath(path)) {
      return;
    }

    if (wasVisitorActivityRecentlyLogged(path)) {
      return;
    }

    markVisitorActivityLogged(path);

    void fetch(buildNightforceApiUrl("/api/nightforce/visitor-activity"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {
      // Visitor activity should never break navigation or rendering.
    });
  }, [location]);

  return null;
}

function AppSEO() {
  const [location] = useLocation();
  const path = normalizeVisitorActivityPath(location);
  const metadata = ROUTE_SEO_METADATA[path] ?? PRIVATE_ROUTE_SEO_METADATA;

  return (
    <SEO
      title={metadata.title}
      description={metadata.description}
      canonicalPath={metadata.canonicalPath}
      robots={metadata.robots ?? "index,follow"}
      jsonLd={metadata.jsonLd}
    />
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center font-mono">
        <div className="text-2xl text-zinc-500 mb-2">404</div>
        <div className="text-sm text-zinc-600">Page not found</div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/wallet" component={WalletAccess} />
      <Route path="/directory" component={Directory} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={Faq} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/request-verification" component={RequestVerification} />
      <Route path="/admin/review" component={AdminReview} />
      <Route path="/my-profile" component={MyProfile} />
      <Route path="/profile/:publicId" component={PublicProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-zinc-950">
        <ScrollToTop />
        <AppSEO />
        <VisitorActivityLogger />
        <Switch>
          <Route path="/">{null}</Route>
          <Route path="/wallet">{<NavBar />}</Route>
          <Route>{<NavBar />}</Route>
        </Switch>
        <AppRoutes />
        <SiteFooter />
      </div>
    </WalletProvider>
  );
}

export default App;
