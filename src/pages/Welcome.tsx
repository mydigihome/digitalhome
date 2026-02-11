import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import WelcomeScreen from "@/components/WelcomeScreen";

export default function Welcome() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <WelcomeScreen
      userName={profile?.full_name || "there"}
      onEnter={() => navigate("/dashboard")}
    />
  );
}
