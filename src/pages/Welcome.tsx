import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import WelcomeScreen from "@/components/WelcomeScreen";

export default function Welcome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const name = profile?.full_name || "there";

  return (
    <WelcomeScreen
      userName={name}
      onEnter={() => navigate("/dashboard")}
    />
  );
}
