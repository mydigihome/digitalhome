import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import OnboardingFlow from "@/components/OnboardingFlow";
import WelcomeScreen from "@/components/WelcomeScreen";

export default function Welcome() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const hasName = !!profile?.full_name;
  const [onboarded, setOnboarded] = useState(hasName);

  const handleOnboardingComplete = async (userName: string, _widgets: { id: string; name: string; enabled: boolean }[]) => {
    await updateProfile({ full_name: userName });
    setOnboarded(true);
  };

  if (!onboarded) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <WelcomeScreen
      userName={profile?.full_name || "there"}
      onEnter={() => navigate("/dashboard")}
    />
  );
}
