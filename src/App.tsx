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
import OnboardingPage from "./pages/OnboardingPage";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import CalendarPage from "./pages/CalendarPage";

import SettingsPage from "./pages/SettingsPage";
import WealthTrackerPage from "./pages/WealthTrackerPage";
import ApplicationsTrackerPage from "./pages/ApplicationsTrackerPage";
import NotFound from "./pages/NotFound";
import ContentPlanner from "./pages/ContentPlanner";
import AdminDashboard from "./pages/AdminDashboard";
import PriorityInbox from "./pages/PriorityInbox";
import PublicEventPage from "./pages/PublicEventPage";
import TemplateShop from "./pages/TemplateShop";
import TemplateSuccess from "./pages/TemplateSuccess";
import AdminTemplates from "./pages/AdminTemplates";
import RelationshipsPage from "./pages/RelationshipsPage";
import MonthlyReviewPage from "./pages/MonthlyReviewPage";

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
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            
            <Route path="/finance" element={<Navigate to="/finance/wealth" replace />} />
            <Route path="/finance/wealth" element={<ProtectedRoute><WealthTrackerPage /></ProtectedRoute>} />
            <Route path="/finance/applications" element={<ProtectedRoute><ApplicationsTrackerPage /></ProtectedRoute>} />
            <Route path="/vision" element={<ProtectedRoute><ContentPlanner /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><PriorityInbox /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/events/:token" element={<PublicEventPage />} />
            <Route path="/templates" element={<TemplateShop />} />
            <Route path="/templates/success" element={<TemplateSuccess />} />
            <Route path="/admin/templates" element={<ProtectedRoute><AdminTemplates /></ProtectedRoute>} />
            <Route path="/relationships" element={<ProtectedRoute><RelationshipsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
