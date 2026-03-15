import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";

// Public Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import CheckResult from "@/pages/check-result";
import NotFound from "@/pages/not-found";

// Dashboard Pages
import Dashboard from "@/pages/dashboard";
import Schools from "@/pages/schools";
import Students from "@/pages/students";
import Results from "@/pages/results";
import Pins from "@/pages/pins";
import Teachers from "@/pages/teachers";
import Classes from "@/pages/classes";
import Subjects from "@/pages/subjects";
import PinRequests from "@/pages/pin-requests";
import Users from "@/pages/users";
import Analytics from "@/pages/analytics";
import Profile from "@/pages/profile";
import ScoreMetrics from "@/pages/score-metrics";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId?: string;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      setLocation("/login");
      setValidating(false);
      return;
    }

    let parsed: User;
    try {
      parsed = JSON.parse(storedUser);
    } catch {
      setLocation("/login");
      setValidating(false);
      return;
    }

    async function validateToken() {
      try {
        const base = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${base}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (res.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          queryClient.clear();
          setLocation("/login");
          setValidating(false);
          return;
        }
        if (res.ok) {
          const me = await res.json();
          setUser(me);
          localStorage.setItem("user", JSON.stringify(me));
        } else {
          setUser(parsed);
        }
      } catch {
        setUser(parsed);
      } finally {
        setValidating(false);
      }
    }

    validateToken();
  }, [setLocation]);

  useEffect(() => {
    if (!user || validating) return;
    if (location === "/schools" && user.role !== "super_admin") {
      setLocation("/dashboard");
    }
  }, [user, location, validating, setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    queryClient.cancelQueries();
    queryClient.clear();
    setLocation("/login");
  };

  if (validating || !user) {
    return null;
  }

  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      {children}
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/check-result" component={CheckResult} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/schools">
        <ProtectedRoute>
          <Schools />
        </ProtectedRoute>
      </Route>

      <Route path="/students">
        <ProtectedRoute>
          <Students />
        </ProtectedRoute>
      </Route>

      <Route path="/results">
        <ProtectedRoute>
          <Results />
        </ProtectedRoute>
      </Route>

      <Route path="/pins">
        <ProtectedRoute>
          <Pins />
        </ProtectedRoute>
      </Route>

      <Route path="/teachers">
        <ProtectedRoute>
          <Teachers />
        </ProtectedRoute>
      </Route>

      <Route path="/classes">
        <ProtectedRoute>
          <Classes />
        </ProtectedRoute>
      </Route>

      <Route path="/subjects">
        <ProtectedRoute>
          <Subjects />
        </ProtectedRoute>
      </Route>

      <Route path="/pin-requests">
        <ProtectedRoute>
          <PinRequests />
        </ProtectedRoute>
      </Route>

      <Route path="/users">
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      </Route>

      <Route path="/analytics">
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      <Route path="/score-metrics">
        <ProtectedRoute>
          <ScoreMetrics />
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
