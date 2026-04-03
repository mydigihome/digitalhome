/**
 * NEW ONBOARDING FLOW — 4-step clean flow
 * 
 * Steps:
 * 1. Welcome
 * 2. Set your first goal
 * 3. Connect your bank (Plaid — skippable)
 * 4. You're all set → Dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences, useUpsertPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, Landmark, Flag, CheckCircle, ChevronRight, Building2 } from 'lucide-react';

const TOTAL_SCREENS = 4;

const goalOptions = [
  { label: 'Buy a Home' },
  { label: 'Build Savings' },
  { label: 'Invest' },
  { label: 'Travel / Experience' },
];

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
  const { user } = useAuth();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();

  const [currentStep, setCurrentStep] = useState(1);
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [showCustomGoal, setShowCustomGoal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Disable browser back during onboarding
  useEffect(() => {
    const handler = () => {
      window.history.pushState(null, '', '/welcome');
    };
    window.history.pushState(null, '', '/welcome');
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const goTo = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const skip = useCallback((stepId: string, nextStep: number) => {
    setSkippedSteps(prev => [...prev, stepId]);
    setCurrentStep(nextStep);
  }, []);

  const handleSkipAll = useCallback(async () => {
    setSaving(true);
    try {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);
      await upsertPrefs.mutateAsync({
        onboarding_completed: true,
        onboarding_step: TOTAL_SCREENS,
        onboarding_skipped_steps: ['goal', 'plaid'],
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
      } as any);
      navigate('/dashboard');
      toast.success('Welcome to Digital Home!', { description: 'Your personal OS is ready.' });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [upsertPrefs, navigate]);

  // Step 2: Create goal
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
    goTo(3);
  }, [customGoal, selectedGoal, user, goTo]);

  // Final: Complete onboarding
  const handleFinish = useCallback(async () => {
    setSaving(true);
    try {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);
      await upsertPrefs.mutateAsync({
        onboarding_completed: true,
        onboarding_step: TOTAL_SCREENS,
        onboarding_skipped_steps: skippedSteps,
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
      } as any);
      navigate('/dashboard');
      toast.success('Welcome to Digital Home!', { description: 'Your personal OS is ready.' });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [upsertPrefs, skippedSteps, navigate]);

  const skippedLabels: Record<string, string> = {
    plaid: 'Connect bank account',
    goal: 'Create first goal',
  };

  const skippedRoutes: Record<string, string> = {
    plaid: '/finance/wealth',
    goal: '/projects',
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-hidden">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 h-[52px] flex items-center justify-between px-6 z-[10001]">
        <span className="font-bold text-sm" style={{ color: '#111827' }}>Digi Home</span>
        {currentStep > 1 && currentStep < TOTAL_SCREENS && (
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
              <a href="/terms" className="underline hover:text-gray-500">Terms</a>{' '}and{' '}
              <a href="/privacy" className="underline hover:text-gray-500">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* SCREEN 2 — Set Your First Goal */}
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
                  {opt.label}
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
              onClick={() => skip('goal', 3)}
              className="mt-4 text-sm font-medium cursor-pointer block mx-auto"
              style={{ color: '#9ca3af' }}
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* SCREEN 3 — Connect Your Bank */}
        <div className="w-screen h-screen flex flex-col items-center justify-center px-8 flex-shrink-0">
          <div className="max-w-[420px] mx-auto text-center">
            <div className="w-20 h-20 rounded-[28px] mx-auto mb-10 flex items-center justify-center" style={{ backgroundColor: '#EFF6FF', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <Building2 className="w-9 h-9" style={{ color: '#3B82F6' }} />
            </div>
            <h1 className="font-extrabold text-[2rem] leading-tight tracking-tight mb-4" style={{ color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Connect your bank.
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#6b7280', lineHeight: 1.7, maxWidth: '320px', margin: '0 auto' }}>
              Link your accounts to track spending, net worth, and bills automatically. You can always do this later in Money.
            </p>
            <button
              onClick={() => {
                toast.info('Plaid integration will open here. Advancing for now.');
                goTo(4);
              }}
              className="w-full max-w-[340px] mx-auto py-4 rounded-[14px] font-semibold text-base transition-colors active:scale-[0.98]"
              style={{ backgroundColor: '#3B82F6', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2563EB')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3B82F6')}
            >
              Connect Bank Account
            </button>
            <button
              onClick={() => skip('plaid', 4)}
              className="mt-4 text-sm font-medium cursor-pointer block mx-auto"
              style={{ color: '#9ca3af' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* SCREEN 4 — Complete */}
        <div className="w-screen h-screen flex flex-col items-center justify-center px-8 flex-shrink-0">
          <div className="max-w-[420px] mx-auto text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={currentStep === 4 ? { scale: 1, opacity: 1 } : {}}
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
              Digi Home is ready. Your financial life, projects, and goals — all in one place.
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
              style={{ backgroundColor: '#10B981', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#059669')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#10B981')}
            >
              {saving ? 'Setting up...' : 'Take me to my Dashboard →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
