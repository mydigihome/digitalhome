import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function Welcome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const name = profile?.full_name || "there";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/30">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-[32px] font-semibold tracking-tight">
          Welcome, {name}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Your digital home for projects and tasks
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/dashboard")}
          className="mt-8 rounded-2xl border border-border/20 bg-card/80 px-8 py-3 text-base font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:shadow-md"
        >
          Enter Home
        </motion.button>
      </motion.div>
    </div>
  );
}
