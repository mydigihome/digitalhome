import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { TrialBadge } from "./TrialBadge";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: prefs, isLoading: prefsLoading } = useUserPreferences();
  const location = useLocation();

  if (loading || (user && prefsLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Redirect to onboarding if not completed (but don't redirect if already on onboarding/welcome)
  const onboardingPaths = ['/onboarding', '/welcome'];
  const isOnboardingPath = onboardingPaths.includes(location.pathname);

  if (user && !prefsLoading && !(prefs as any)?.onboarding_completed && !isOnboardingPath) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      <TrialBadge />
      {children}
    </>
  );
}
