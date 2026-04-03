import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useThemeApplicator } from "@/hooks/useThemeApplicator";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
// Old onboarding disabled — replaced by NewOnboarding (Phase 5)
// import OnboardingPage from "./pages/OnboardingPage";
// import Welcome from "./pages/Welcome";
import NewOnboarding from "./pages/NewOnboarding";
import Dashboard from "./pages/Dashboard";
import JournalPage from "./pages/JournalPage";
import JournalEntryPage from "./pages/JournalEntryPage";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import CalendarPage from "./pages/CalendarPage";

import SettingsPage from "./pages/SettingsPage";
import WealthTrackerPage from "./pages/WealthTrackerPage";
import ApplicationsTrackerPage from "./pages/ApplicationsTrackerPage";
import NotFound from "./pages/NotFound";
import ContentPlanner from "./pages/ContentPlanner";
import StudioPage from "./pages/StudioPage";
import AdminDashboard from "./pages/AdminDashboard";
import PriorityInbox from "./pages/PriorityInbox";
import PublicEventPage from "./pages/PublicEventPage";
import AdminTemplates from "./pages/AdminTemplates";
import RelationshipsPage from "./pages/RelationshipsPage";
import MonthlyReviewPage from "./pages/MonthlyReviewPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ResourcesPage from "./pages/ResourcesPage";

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
            {/* Old onboarding route disabled */}
            <Route path="/welcome" element={<ProtectedRoute><NewOnboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
            <Route path="/journal/new" element={<ProtectedRoute><JournalEntryPage /></ProtectedRoute>} />
            <Route path="/journal/:id" element={<ProtectedRoute><JournalEntryPage /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            
            <Route path="/finance" element={<Navigate to="/finance/wealth" replace />} />
            <Route path="/finance/wealth" element={<ProtectedRoute><WealthTrackerPage /></ProtectedRoute>} />
            <Route path="/finance/applications" element={<ProtectedRoute><ApplicationsTrackerPage /></ProtectedRoute>} />
            <Route path="/vision" element={<ProtectedRoute><ContentPlanner /></ProtectedRoute>} />
            <Route path="/studio" element={<ProtectedRoute><StudioPage /></ProtectedRoute>} />
            <Route path="/inbox" element={<Navigate to="/relationships" replace />} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/events/:token" element={<PublicEventPage />} />
            <Route path="/admin/templates" element={<ProtectedRoute><AdminTemplates /></ProtectedRoute>} />
            <Route path="/relationships" element={<ProtectedRoute><RelationshipsPage /></ProtectedRoute>} />
            <Route path="/monthly-review" element={<ProtectedRoute><MonthlyReviewPage /></ProtectedRoute>} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
