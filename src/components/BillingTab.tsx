import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Crown, GraduationCap, Check, Star, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { usePlan } from "@/hooks/usePlan";
import { STRIPE_LINKS, openStripeLink } from "@/lib/stripe";

interface BillingTabProps {
  profile: any;
  prefs: any;
  user: any;
  studentDiscount: boolean;
  setStudentDiscount: (v: boolean) => void;
  checkingOut: boolean;
  setCheckingOut: (v: boolean) => void;
  managingBilling: boolean;
  setManagingBilling: (v: boolean) => void;
  studentEmail: string;
  setStudentEmail: (v: string) => void;
  verificationCode: string;
  setVerificationCode: (v: string) => void;
  verificationStep: "idle" | "sent" | "verified";
  setVerificationStep: (v: "idle" | "sent" | "verified") => void;
  verifying: boolean;
  setVerifying: (v: boolean) => void;
}

export default function BillingTab({
  profile, prefs, user,
  studentDiscount, setStudentDiscount,
  checkingOut, setCheckingOut,
  managingBilling, setManagingBilling,
  studentEmail, setStudentEmail,
  verificationCode, setVerificationCode,
  verificationStep, setVerificationStep,
  verifying, setVerifying,
}: BillingTabProps) {
  const [foundingCount, setFoundingCount] = useState(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const plan = usePlan();

  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("founding_member", true)
      .then(({ count }) => setFoundingCount(count || 0));
  }, []);

  const handleSubscribe = async (plan: "pro" | "student" | "founding") => {
    setCheckingOut(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = window.location.origin;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            plan,
            successUrl: `${baseUrl}/dashboard?payment=success&plan=${plan}`,
            cancelUrl: `${baseUrl}/settings?tab=billing`,
          }),
        }
      );
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create checkout session");
      }
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setCheckingOut(false);
    }
  };

  const isFoundingMember = profile?.founding_member === true || (prefs as any)?.subscription_type === "founding";
  const isSubscribed = prefs?.is_subscribed === true;
  const subscriptionType = (prefs as any)?.subscription_type;

  return (
    <>
      {/* Current Plan Status */}
      {!plan.isLoading && plan.tier !== "free" && !isFoundingMember && (
        <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard size={18} className="text-primary" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "Inter, sans-serif" }}>
                {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)} Plan
              </p>
              <p style={{ fontSize: 12, color: "#6B7280", margin: 0, fontFamily: "Inter, sans-serif" }}>
                {plan.billingCycle === "annual" && plan.renewalDate
                  ? `Renews ${plan.renewalDate}`
                  : `Billed ${plan.billingCycle}`}
                {plan.studioUnlocked ? " · Studio unlocked ✓" : ""}
                {plan.studentVerified ? " · Student discount active" : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {plan.studioUnlocked && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "#F5F3FF", color: "#7B5EA7", fontFamily: "Inter, sans-serif" }}>
                Studio ✓
              </span>
            )}
          </div>
        </div>
      )}

      {/* Trial Status Card */}
      {!isFoundingMember && !isSubscribed && prefs?.trial_end_date && (() => {
        const endDate = new Date(prefs.trial_end_date);
        const now = new Date();
        const diffMs = endDate.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const isExpired = daysLeft === 0;
        return (
          <div className={cn(
            "rounded-xl p-6 flex items-center gap-4 border",
            isExpired ? "bg-destructive/5 border-destructive/20"
              : daysLeft <= 3 ? "bg-amber-50 border-amber-200"
              : "bg-blue-50 border-blue-200"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
              isExpired ? "bg-destructive/10" : daysLeft <= 3 ? "bg-amber-100" : "bg-blue-100"
            )}>
              {isExpired ? '' : daysLeft <= 3 ? '' : ''}
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-lg">
                {isExpired ? "Trial Expired" : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your trial`}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isExpired ? "Subscribe to continue using all features." : "Subscribe now to keep access to all features."}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Founding Member Active Badge */}
      {isFoundingMember && (
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a" }} className="rounded-xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: "#fde68a" }}></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground text-lg">Founding Member · Full Access</h4>
              <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9999 }}>
                FOUNDING MEMBER 
              </span>
            </div>
            <p className="text-sm" style={{ color: "#9ca3af" }}>
              {(prefs as any)?.founding_member_since
                ? `Member since ${format(new Date((prefs as any).founding_member_since), "MMMM d, yyyy")}`
                : `You're user #${(profile as any)?.user_number ?? '—'} — one of the first to join.`}
            </p>
          </div>
        </div>
      )}

      {/* Subscription Status + Manage (non-founding) */}
      {!isFoundingMember && isSubscribed && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown size={20} className="text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Pro Membership Active</h4>
              <p className="text-sm text-muted-foreground">
                {subscriptionType === "student" ? "$49/year · Student · Renews annually" : "$99/year · Renews annually"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={managingBilling}
            onClick={async () => {
              setManagingBilling(true);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(
                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({ returnUrl: `${window.location.origin}/settings?tab=billing` }),
                  }
                );
                const data = await res.json();
                if (data.url) window.location.href = data.url;
                else toast.error(data.error || "Failed to open billing portal");
              } catch {
                toast.error("Failed to open billing portal");
              } finally {
                setManagingBilling(false);
              }
            }}
          >
            {managingBilling ? "Opening..." : "Manage Subscription"}
          </Button>
        </div>
      )}

      {/* ═══ FOUNDING MEMBER CARD ═══ */}
      {!isFoundingMember && !isSubscribed && foundingCount < 50 && (
        <div
          className="relative overflow-hidden rounded-[24px] p-6"
          style={{
            background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Badge */}
          <span
            className="absolute top-5 right-5 rounded-full px-3 py-1"
            style={{ background: "#f59e0b", color: "#111827", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            FOUNDING MEMBER · LIMITED
          </span>

          <h3 className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Get in early.
          </h3>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            Full access. One time. Forever yours.
          </p>

          <div className="flex items-end gap-2 mt-4">
            <span className="text-5xl font-extrabold text-white" style={{ letterSpacing: "-0.02em" }}>$9</span>
            <span className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>one-time</span>
          </div>

          <p className="text-xs font-bold mt-1" style={{ color: "#f59e0b" }}>
            {50 - foundingCount} of 50 spots remaining
          </p>

          <div className="space-y-2 mt-4">
            {[
              "Full premium access immediately",
              "All future features included",
              "Founding Member badge",
              "Lifetime upgrade offer in 3-6 months",
              "You believed before everyone else",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <Check size={14} style={{ color: "#4ade80" }} className="shrink-0" />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{f}</span>
              </div>
            ))}
          </div>

          <button
            disabled={checkingOut}
            onClick={() => openStripeLink(STRIPE_LINKS.founding_monthly)}
            className="w-full mt-5 py-3.5 rounded-full font-bold text-sm transition-all hover:-translate-y-px"
            style={{ background: "#fff", color: "#111827" }}
          >
            {checkingOut ? "Redirecting..." : "Become a Founding Member — $9"}
          </button>
        </div>
      )}

      {/* ═══ PRO PLAN CARD ═══ */}
      {!isFoundingMember && !isSubscribed && (
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Pro Membership</h3>
              <p className="text-sm text-muted-foreground">Unlock the full Digital Home experience</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">
                ${studentDiscount ? "49" : "99"}
              </span>
              <span className="text-muted-foreground">/year</span>
              {studentDiscount && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  50% Student Discount
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {studentDiscount ? "$4.08/mo billed annually" : "$8.25/mo billed annually"}
            </p>
            {studentDiscount && (
              <p className="text-sm text-muted-foreground mt-1 line-through">$99/year</p>
            )}
          </div>

          <div className="space-y-3 mb-8">
            {[
              "Unlimited projects & tasks",
              "AI Brain Dump & task generation",
              "Vision Room with unlimited boards",
              "Wealth & investment tracker",
              "College & job application tracker",
              "Team collaboration",
              "Custom themes & branding",
              "Priority support",
              "All future features included",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <Check size={16} className="text-primary shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <Button
            className="w-full h-12 text-base font-semibold"
            disabled={checkingOut}
            onClick={() => openStripeLink(
              studentDiscount ? STRIPE_LINKS.standard_annual : STRIPE_LINKS.standard_annual
            )}
          >
            {checkingOut ? "Redirecting to checkout..." : `Subscribe — $${studentDiscount ? "49" : "99"}/year`}
          </Button>
        </div>
      )}

      {/* Student Discount Verification */}
      {!isFoundingMember && !isSubscribed && (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap size={20} className="text-muted-foreground" />
            <div>
              <h4 className="font-medium text-foreground">Student Discount</h4>
              <p className="text-sm text-muted-foreground">50% off with a valid student email</p>
            </div>
          </div>

          {verificationStep === "verified" ? (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Check size={16} />
              <span>Verified: {studentEmail}</span>
            </div>
          ) : verificationStep === "sent" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                A 6-digit code was sent to <strong>{studentEmail}</strong>. Check your email (and spam folder).
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="max-w-[200px]"
                />
                <Button
                  disabled={verifying || verificationCode.length !== 6}
                  onClick={async () => {
                    setVerifying(true);
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const res = await fetch(
                        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-verification`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session?.access_token}`,
                          },
                          body: JSON.stringify({ action: "verify", code: verificationCode }),
                        }
                      );
                      const data = await res.json();
                      if (data.success) {
                        setVerificationStep("verified");
                        setStudentDiscount(true);
                        toast.success("Student status verified! Discount applied.");
                      } else {
                        toast.error(data.error || "Verification failed");
                      }
                    } catch {
                      toast.error("Verification failed");
                    } finally {
                      setVerifying(false);
                    }
                  }}
                >
                  {verifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
              <button className="text-xs text-muted-foreground underline" onClick={() => setVerificationStep("idle")}>
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="your-name@university.edu"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value.slice(0, 255))}
                  className="max-w-[320px]"
                />
                <Button
                  variant="secondary"
                  disabled={verifying || !studentEmail.trim().endsWith(".edu")}
                  onClick={async () => {
                    setVerifying(true);
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const res = await fetch(
                        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-verification`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session?.access_token}`,
                          },
                          body: JSON.stringify({ action: "send", email: studentEmail.trim() }),
                        }
                      );
                      const data = await res.json();
                      if (data.success) {
                        setVerificationStep("sent");
                        toast.success("Verification code sent!");
                      } else {
                        toast.error(data.error || "Failed to send code");
                      }
                    } catch {
                      toast.error("Failed to send verification code");
                    } finally {
                      setVerifying(false);
                    }
                  }}
                >
                  {verifying ? "Sending..." : "Send Code"}
                </Button>
              </div>
              {studentEmail && !studentEmail.trim().endsWith(".edu") && studentEmail.includes("@") && (
                <p className="text-xs text-destructive">Only .edu email addresses qualify</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legal footer */}
      <div className="flex gap-4 text-xs text-muted-foreground pt-6">
        <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
        <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
      </div>
    </>
  );
}
