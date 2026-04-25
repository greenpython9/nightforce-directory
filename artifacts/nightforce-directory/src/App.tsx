import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { WalletProvider } from "./hooks/useWallet";
import { NavBar } from "./components/NavBar";
import { SiteFooter } from "./components/SiteFooter";
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
