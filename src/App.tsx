import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import BrainDump from "@/components/BrainDump";
import { useThemeApplicator } from "@/hooks/useThemeApplicator";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import OnboardingPage from "./pages/OnboardingPage";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import CalendarPage from "./pages/CalendarPage";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";
import WealthTrackerPage from "./pages/WealthTrackerPage";
import ApplicationsTrackerPage from "./pages/ApplicationsTrackerPage";
import NotFound from "./pages/NotFound";
import ContentPlanner from "./pages/ContentPlanner";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

function ThemeApplicator() {
  useThemeApplicator();
  return null;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeApplicator />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /><BrainDump /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /><BrainDump /></ProtectedRoute>} />
            <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /><BrainDump /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /><BrainDump /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><TeamPage /><BrainDump /></ProtectedRoute>} />
            <Route path="/finance" element={<Navigate to="/finance/wealth" replace />} />
            <Route path="/finance/wealth" element={<ProtectedRoute><WealthTrackerPage /><BrainDump /></ProtectedRoute>} />
            <Route path="/finance/applications" element={<ProtectedRoute><ApplicationsTrackerPage /><BrainDump /></ProtectedRoute>} />
            <Route path="/vision" element={<ProtectedRoute><ContentPlanner /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
