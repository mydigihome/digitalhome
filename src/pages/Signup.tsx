import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import houseLogo from "@/assets/house-logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { lovable } from "@/integrations/lovable/index";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  // On mount: check for existing session (covers OAuth redirect back)
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        await new Promise((r) => setTimeout(r, 500));
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session?.user) {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("onboarding_completed")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!prefs?.onboarding_completed) {
          navigate("/welcome", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    };
    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && !cancelled) {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("onboarding_completed")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!prefs?.onboarding_completed) {
          navigate("/welcome", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [navigate]);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error("Google sign-in failed. Please try again.");
      console.error("Google sign-in error:", error);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      toast.error("Something went wrong. Try again or use a different email.");
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm text-center">
          <h1 className="text-[32px] font-semibold">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm text-primary hover:underline">
            Back to login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <img src={houseLogo} alt="Digital Home" className="h-24 w-24 object-contain" />
          </div>
          <h1 className="text-[32px] font-semibold tracking-tight">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your life, all in one place</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required />
          </div>
          <Button type="submit" className="w-full h-12 text-[15px] font-semibold" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
            By creating an account you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">or continue with</span>
          </div>
        </div>

        {/* Google Sign-Up - Secondary */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 gap-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {googleLoading ? "Signing up..." : "Google"}
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
