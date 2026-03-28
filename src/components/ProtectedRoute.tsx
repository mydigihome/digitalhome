import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { UpgradeModal } from "./UpgradeModal";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
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

  // Redirect to new onboarding if not completed (but don't redirect if already on /welcome)
  const isOnboardingPath = location.pathname === '/welcome';

  if (user && !prefsLoading && !(prefs as any)?.onboarding_completed && !isOnboardingPath) {
    return <Navigate to="/welcome" replace />;
  }

  // Founding members never get locked out
  const isFoundingMember = profile?.founding_member === true;

  // Check if trial has expired and user is not subscribed
  const isExpired = !isFoundingMember && prefs?.trial_end_date && !prefs?.is_subscribed
    ? new Date(prefs.trial_end_date) < new Date()
    : false;

  // Redirect to billing if expired (unless already on settings page)
  if (isExpired && !location.pathname.startsWith('/settings')) {
    return <Navigate to="/settings?tab=billing" replace />;
  }

  return (
    <>
      <UpgradeModal />
      {children}
    </>
  );
}
