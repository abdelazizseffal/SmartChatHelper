import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import AdminPage from "@/pages/admin-page";
import BillingPage from "@/pages/billing-page";
import AccountPage from "@/pages/account-page";
import CreateSubscriptionPlanPage from "@/pages/create-subscription-plan";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/projects" component={Projects} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/billing" component={BillingPage} />
      <ProtectedRoute path="/account" component={AccountPage} />
      <ProtectedRoute path="/create-subscription-plan" component={CreateSubscriptionPlanPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
