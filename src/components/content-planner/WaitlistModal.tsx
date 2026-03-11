import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { X, Sparkles, Play, CheckCircle2, Lightbulb, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

export function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    const loadVideo = async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "content_planner_preview_video")
        .maybeSingle();
      if ((data as any)?.value) setVideoUrl((data as any).value);
    };
    loadVideo();
  }, [open]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from("content_planner_waitlist" as any).insert({
      email: email.trim(),
      name: name.trim() || null,
      user_id: user?.id || null,
    } as any);

    if (error?.code === "23505") {
      toast.success("You're already on the waitlist!");
      setSubmitted(true);
    } else if (error) {
      toast.error("Something went wrong. Please try again.");
    } else {
      toast.success("Added to waitlist!");
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {!submitted ? (
            <div className="flex flex-col">
              {/* Video Preview Section */}
              <div className="relative bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 p-6 pb-4">
                {/* Video area */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20 border border-border/50 shadow-inner">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full object-cover"
                      poster=""
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Play className="w-6 h-6 text-amber-500 ml-0.5" />
                      </div>
                      <p className="text-sm font-medium text-foreground/70">Preview Video Coming Soon</p>
                      <p className="text-xs text-muted-foreground">See what's inside Content Planner</p>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="mt-5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/20 px-3 py-1 mb-3">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 tracking-wide uppercase">
                      Coming Soon
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">Content Planner</h2>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    AI-powered content creation, scheduling, and analytics. Plan your entire content strategy in one place.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 pt-5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-foreground">Join the Waitlist</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Be the first to know when we launch</p>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <Label htmlFor="waitlist-email" className="text-xs font-medium text-muted-foreground mb-1.5">
                      Email Address
                    </Label>
                    <Input
                      id="waitlist-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="waitlist-name" className="text-xs font-medium text-muted-foreground mb-1.5">
                      Name (Optional)
                    </Label>
                    <Input
                      id="waitlist-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20 transition-all"
                >
                  {submitting ? "Joining..." : "Get Early Access"}
                  {!submitting && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center mt-3">
                  We'll send you one email when Content Planner launches. No spam.
                </p>
              </form>
            </div>
          ) : (
            /* Success State */
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">You're on the list!</h2>
              <p className="text-sm text-muted-foreground mb-1">We'll notify you at</p>
              <p className="text-sm font-semibold text-foreground mb-5">{email}</p>

              <div className="w-full bg-secondary/50 rounded-xl p-4 mb-6 text-left">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">What's Next?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      We're adding final touches. You'll get exclusive early access before the public launch.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={onClose} variant="secondary" className="w-full h-10 rounded-xl font-semibold">
                Got it
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
