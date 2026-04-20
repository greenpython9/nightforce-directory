import { Switch, Route } from "wouter";
import { WalletProvider } from "./hooks/useWallet";
import { NavBar } from "./components/NavBar";
import { Landing } from "./pages/Landing";
import { Directory } from "./pages/Directory";
import { RequestVerification } from "./pages/RequestVerification";
import { AdminReview } from "./pages/AdminReview";
import { MyProfile } from "./pages/MyProfile";
import { PublicProfile } from "./pages/PublicProfile";

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
      <Route path="/directory" component={Directory} />
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
        <Switch>
          <Route path="/">{null}</Route>
          <Route>{<NavBar />}</Route>
        </Switch>
        <AppRoutes />
      </div>
    </WalletProvider>
  );
}

export default App;
