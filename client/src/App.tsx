
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Attendance from "./pages/Attendance";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/attendance" component={Attendance} />
      <Route path="/payments" component={Payments} />
      <Route path="/employees" component={Employees} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
