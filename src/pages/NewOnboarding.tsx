/**
 * NEW ONBOARDING FLOW — Phase 5
 * 
 * EXISTING ONBOARDING LOGIC AUDIT (all found, conflicts disabled):
 * 1. ProtectedRoute.tsx:25 — redirects to /onboarding if onboarding_completed=false → UPDATED to redirect to /welcome
 * 2. Login.tsx:91 — navigates to /welcome after login → KEPT (correct behavior)
 * 3. Signup.tsx:33,41 — navigates to /dashboard after signup/OAuth → ProtectedRoute handles redirect
 * 4. App.tsx:68-69 — /onboarding and /welcome routes → /onboarding removed, /welcome points here
 * 5. OnboardingPage.tsx — old 6-step flow → DISABLED (route removed)
 * 6. WelcomeScreen.tsx — splash "Welcome home" → REPLACED by this flow
 * 7. WelcomeStep.tsx — old step 1 → no longer routed
 * 8. WealthTrackerPage.tsx:26 — wealth-specific onboarding (user_finances) → KEPT (separate concern)
 * 9. OnboardingFlow.tsx — legacy unused component → KEPT (not routed)
 * 10. user_preferences.onboarding_completed — already exists, mapped here
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences, useUpsertPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, Landmark, CreditCard, Flag, Users, CheckCircle, ChevronRight } from 'lucide-react';

const TOTAL_SCREENS = 6;

// Goal options
const goalOptions = [
  { emoji: 'home', label: 'Buy a Home' },
  { emoji: 'piggy-bank', label: 'Build Savings' },
  { emoji: 'trending-up', label: 'Invest' },
  { emoji: 'plane', label: 'Travel / Experience' },
];

// Progress dots component
function ProgressDots({ current }: { current: number }) {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-2 items-center z-[10001]">
      {Array.from({ length: TOTAL_SCREENS }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isCompleted = step < current;
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: isActive ? 24 : 8,
              height: 8,
              backgroundColor: isActive ? '#111827' : isCompleted ? 'rgba(17,24,39,0.4)' : '#e5e7eb',
            }}
          />
        );
      })}
    </div>
  );
}

export default function NewOnboarding() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();

  const [currentStep, setCurrentStep] = useState(1);
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);
  const [creditScore, setCreditScore] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [showCustomGoal, setShowCustomGoal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resume from last step
  useEffect(() => {
    if (prefs) {
      const step = (prefs as any)?.onboarding_step;
      const skipped = (prefs as any)?.onboarding_skipped_steps;
      if (step && step > 0 && step < 6) setCurrentStep(step);
      if (skipped?.length) setSkippedSteps(skipped);
    }
  }, [prefs]);

  // Disable browser back during onboarding
  useEffect(() => {
    const handler = () => {
      window.history.pushState(null, '', '/welcome');
    };
    window.history.pushState(null, '', '/welcome');
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Save step progress
  const saveProgress = useCallback(async (step: number, skipped: string[]) => {
    try {
      await upsertPrefs.mutateAsync({
        onboarding_step: step,
        onboarding_skipped_steps: skipped,
      } as any);
    } catch (e) {
      console.error('Save progress error:', e);
    }
  }, [upsertPrefs]);

  const goTo = useCallback((step: number, newSkipped?: string[]) => {
    const s = newSkipped ?? skippedSteps;
    setCurrentStep(step);
    saveProgress(step, s);
  }, [skippedSteps, saveProgress]);

  const skip = useCallback((stepId: string, nextStep: number) => {
    const updated = [...skippedSteps, stepId];
    setSkippedSteps(updated);
    goTo(nextStep, updated);
  }, [skippedSteps, goTo]);

  const handleSkipAll = useCallback(async () => {
    setSaving(true);
    try {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);
      await upsertPrefs.mutateAsync({
        onboarding_completed: true,
        onboarding_step: 6,
        onboarding_skipped_steps: ['plaid', 'credit', 'goal', 'contacts'],
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
      } as any);
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [upsertPrefs, navigate]);

  // Screen 3: Save credit score
  const handleSaveCredit = useCallback(async () => {
    const val = parseInt(creditScore);
    if (!val || val < 300 || val > 850) return;
    try {
      await (supabase as any).from('money_tab_preferences').upsert(
        { user_id: user!.id, card_data: { credit: { score: val } } },
        { onConflict: 'user_id' }
      );
    } catch (e) {
      console.error(e);
    }
    goTo(4);
  }, [creditScore, user, goTo]);

  // Screen 4: Create goal
  const handleCreateGoal = useCallback(async () => {
    const goalText = customGoal.trim() || selectedGoal;
    if (!goalText || !user) return;
    try {
      await (supabase as any).from('projects').insert({
        user_id: user.id,
        name: goalText,
        type: 'goal',
      });
    } catch (e) {
      console.error(e);
    }
    goTo(5);
  }, [customGoal, selectedGoal, user, goTo]);

  // Screen 6: Complete
  const handleFinish = useCallback(async () => {
    setSaving(true);
    try {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);
      await upsertPrefs.mutateAsync({
        onboarding_completed: true,
        onboarding_step: 6,
        onboarding_skipped_steps: skippedSteps,
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
      } as any);
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [upsertPrefs, skippedSteps, navigate]);

  const skippedLabels: Record<string, string> = {
    plaid: 'Connect bank account',
    credit: 'Add credit score',
    goal: 'Create first goal',
    contacts: 'Import contacts',
  };

  const skippedRoutes: Record<string, string> = {
    plaid: '/finance/wealth',
    credit: '/finance/wealth',
    goal: '/projects',
    contacts: '/relationships',
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-hidden">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 h-[52px] flex items-center justify-between px-6 z-[10001]">
        <span className="font-bold text-sm" style={{ color: '#111827' }}>Digi Home</span>
        {currentStep > 1 && currentStep < 6 && (
          <button
            onClick={handleSkipAll}
            className="text-sm font-medium cursor-pointer transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
          >
            Skip setup
          </button>
        )}
      </div>

      {/* Progress dots */}
      <ProgressDots current={currentStep} />

      {/* Slide container */}
      <div
        className="flex flex-row h-full"
        style={{
          width: `${TOTAL_SCREENS * 100}vw`,
          transform: `translateX(-${(currentStep - 1) * 100}vw)`,
          transition: 'transform 400ms cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {/* SCREEN 1 — Welcome */}
        <div className="w-screen h-screen flex flex-col items-center justify-center px-8 flex-shrink-0">
          <div className="max-w-[420px] mx-auto text-center">
            <div className="w-20 h-20 rounded-[28px] mx-auto mb-10 flex items-center justify-center" style={{ backgroundColor: '#f0f4ff', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <Home className="w-9 h-9" style={{ color: '#6366f1' }} />
            </div>
            <h1 className="text-[2rem] leading-tight tracking-tight mb-4" style={{ color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span className="font-normal">Welcome to</span><br />
              <span className="font-extrabold">Digi Home.</span>
            </h1>
            <p className="text-base leading-relaxed mb-12" style={{ color: '#6b7280', lineHeight: 1.7 }}>
              Your life, organized. Connect your money, projects, and network in one place.
            </p>
            <button
              onClick={() => goTo(2)}
              className="w-full max-w-[340px] mx-auto py-4 rounded-[14px] font-semibold text-base transition-colors active:scale-[0.98]"
              style={{ backgroundColor: '#111827', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1f2937')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#111827')}
            >
              Get Started
            </button>
            <p className="text-xs mt-4" style={{ color: '#9ca3af' }}>
              By continuing you agree to our{' '}
              <a href="/terms" className="underline hover:text-white">Terms</a>{' '}and{' '}
              <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* SCREEN 2 — Connect Bank */}
        <div className="w-screen h-screen flex flex-col items-center justify-center px-8 flex-shrink-0">
          <div className="max-w-[420px] mx-auto text-center">
            <div className="w-20 h-20 rounded-[28px] mx-auto mb-10 flex items-center justify-center" style={{ backgroundColor: '#f0fdf4', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <Landmark className="w-9 h-9" style={{ color: '#16a34a' }} />
            </div>
            <h1 className="font-extrabold text-[2rem] leading-tight tracking-tight mb-4" style={{ color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Connect your bank.
            </h1>
            <p className="text-base leading-relaxed mb-12" style={{ color: '#6b7280', lineHeight: 1.7 }}>
              See your real balances, spending, and bills — automatically. Uses Plaid, trusted by millions.
            </p>
            <button
              onClick={() => {
                toast.info('Plaid integration will open here. Advancing for now.');
                goTo(3);
              }}
              className="w-full max-w-[340px] mx-auto py-4 rounded-[14px] font-semibold text-base transition-colors active:scale-[0.98]"
              style={{ backgroundColor: '#111827', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1f2937')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#111827')}
            >
              Connect Bank Account
            </button>
            <button
              onClick={() => skip('plaid', 3)}
              className="mt-4 text-sm font-medium cursor-pointer block mx-auto"
              style={{ color: '#9ca3af' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* SCREEN 3 — Credit Score */}
        <div className="w-screen h-screen flex flex-col items-center justify-center px-8 flex-shrink-0">
          <div className="max-w-[420px] mx-auto text-center">
            <div className="w-20 h-20 rounded-[28px] mx-auto mb-10 flex items-center justify-center" style={{ backgroundColor: '#fdf4ff', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <CreditCard className="w-9 h-9" style={{ color: '#a855f7' }} />
            </div>
            <h1 className="font-extrabold text-[2rem] leading-tight tracking-tight mb-4" style={{ color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Know your score.
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#6b7280', lineHeight: 1.7 }}>
              Your credit score affects everything. Enter it now and we'll track changes and show you how to improve.
            </p>
            <input
              type="number"
              min={300}
              max={850}
              value={creditScore}
              onChange={e => setCreditScore(e.target.value)}
              placeholder="785"
              className="w-[200px] mx-auto px-6 py-4 text-3xl font-extrabold text-center rounded-[16px] outline-none transition-colors"
              style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                color: '#111827',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
            <p className="text-sm mt-2 mb-8" style={{ color: '#9ca3af' }}>out of 850</p>
            <button
              onClick={handleSaveCredit}
              disabled={!creditScore || parseInt(creditScore) < 300 || parseInt(creditScore) > 850}
              className="w-full max-w-[340px] mx-auto py-4 rounded-[14px] font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-30"
              style={{ backgroundColor: '#111827', color: '#fff' }}
            >
              Save My Score
            </button>
            <button
              onClick={() => skip('credit', 4)}
              className="mt-4 text-sm font-medium cursor-pointer block mx-auto"
              style={{ color: '#9ca3af' }}
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* SCREEN 4 — First Goal */}
        <div className="w-screen h-screen flex flex-col items-center justify-center px-8 flex-shrink-0">
          <div className="max-w-[420px] mx-auto text-center">
            <div className="w-20 h-20 rounded-[28px] mx-auto mb-10 flex items-center justify-center" style={{ backgroundColor: '#fffbeb', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <Flag className="w-9 h-9" style={{ color: '#f59e0b' }} />
            </div>
            <h1 className="font-extrabold text-[2rem] leading-tight tracking-tight mb-4" style={{ color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Set your first goal.
            </h1>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#6b7280', lineHeight: 1.7 }}>
              What are you working toward? We'll track your progress and show you exactly how to get there.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-[320px] mx-auto mt-6">
              {goalOptions.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => { setSelectedGoal(opt.label); setShowCustomGoal(false); setCustomGoal(''); }}
                  className="px-4 py-3 text-sm font-semibold rounded-[14px] cursor-pointer transition-all"
                  style={{
                    backgroundColor: selectedGoal === opt.label ? '#111827' : '#f9fafb',
                    color: selectedGoal === opt.label ? '#fff' : '#374151',
                    border: `1px solid ${selectedGoal === opt.label ? '#111827' : '#e5e7eb'}`,
                  }}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
            {!showCustomGoal ? (
              <button
                onClick={() => { setShowCustomGoal(true); setSelectedGoal(''); }}
                className="text-sm mt-3 cursor-pointer block mx-auto"
                style={{ color: '#9ca3af' }}
              >
                or type your own...
              </button>
            ) : (
              <input
                type="text"
                value={customGoal}
                onChange={e => setCustomGoal(e.target.value)}
                placeholder="e.g. Start a business"
                autoFocus
                className="w-full max-w-[320px] mx-auto mt-3 px-4 py-3 text-sm rounded-[14px] outline-none"
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  color: '#111827',
                }}
              />
            )}
            <button
              onClick={handleCreateGoal}
              disabled={!selectedGoal && !customGoal.trim()}
              className="w-full max-w-[340px] mx-auto mt-8 py-4 rounded-[14px] font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-30"
              style={{ backgroundColor: '#111827', color: '#fff' }}
            >
              Create This Goal
            </button>
            <button
              onClick={() => skip('goal', 5)}
              className="mt-4 text-sm font-medium cursor-pointer block mx-auto"
              style={{ color: '#9ca3af' }}
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* SCREEN 5 — Import Contacts */}
        <div className="w-screen h-screen flex flex-col items-center justify-center px-8 flex-shrink-0">
          <div className="max-w-[420px] mx-auto text-center">
            <div className="w-20 h-20 rounded-[28px] mx-auto mb-10 flex items-center justify-center" style={{ backgroundColor: '#fff0f9', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <Users className="w-9 h-9" style={{ color: '#ec4899' }} />
            </div>
            <h1 className="font-extrabold text-[2rem] leading-tight tracking-tight mb-4" style={{ color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Bring your network.
            </h1>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#6b7280', lineHeight: 1.7 }}>
              Your relationships are your greatest asset. Import contacts from LinkedIn or Gmail to get started.
            </p>
            <div className="space-y-3 max-w-[300px] mx-auto mt-6">
              <button
                onClick={() => toast.info('LinkedIn import will open here')}
                className="w-full py-3.5 rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: '#0A66C2', color: '#ffffff' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Import from LinkedIn
              </button>
              <button
                onClick={() => toast.info('Gmail import will open here')}
                className="w-full py-3.5 rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', color: '#374151' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Import from Gmail
              </button>
            </div>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full max-w-[340px] mx-auto mt-8 py-4 rounded-[14px] font-semibold text-base transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#111827', color: '#fff' }}
            >
              {saving ? 'Setting up...' : 'Continue'}
            </button>
            <button
              onClick={() => { skip('contacts', 6); handleFinish(); }}
              className="mt-4 text-sm font-medium cursor-pointer block mx-auto"
              style={{ color: '#9ca3af' }}
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* SCREEN 6 — Complete */}
        <div className="w-screen h-screen flex flex-col items-center justify-center px-8 flex-shrink-0">
          <div className="max-w-[420px] mx-auto text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={currentStep === 6 ? { scale: 1, opacity: 1 } : {}}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-[28px] mx-auto mb-10 flex items-center justify-center"
              style={{ backgroundColor: '#f0fdf4', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
            >
              <CheckCircle className="w-9 h-9" style={{ color: '#22c55e' }} />
            </motion.div>
            <h1 className="font-extrabold text-[2rem] leading-tight tracking-tight mb-4" style={{ color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              You're all set.
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#6b7280', lineHeight: 1.7 }}>
              Digi Home is ready. Your financial life, relationships, and goals — all in one place.
            </p>

            {skippedSteps.length > 0 && (
              <div className="rounded-[16px] px-5 py-4 mt-6 max-w-[340px] mx-auto text-left" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>
                  Finish setting up later:
                </p>
                <div className="space-y-2">
                  {skippedSteps.map(stepId => (
                    <button
                      key={stepId}
                      onClick={() => {
                        handleFinish().then(() => navigate(skippedRoutes[stepId] || '/dashboard'));
                      }}
                      className="w-full flex items-center gap-2 text-sm font-medium cursor-pointer py-1"
                      style={{ color: '#374151' }}
                    >
                      <ChevronRight className="w-4 h-4" style={{ color: '#9ca3af' }} />
                      {skippedLabels[stepId]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full max-w-[340px] mx-auto mt-8 py-4 rounded-[14px] font-semibold text-base transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#111827', color: '#fff' }}
            >
              {saving ? 'Setting up...' : 'Go to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
