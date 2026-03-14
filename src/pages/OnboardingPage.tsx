import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUpsertPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';

import ProgressDots from '@/components/onboarding/ProgressDots';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import HomeNameStep from '@/components/onboarding/HomeNameStep';
import CreditStep from '@/components/onboarding/CreditStep';
import GoalStep from '@/components/onboarding/GoalStep';
import FocusStep from '@/components/onboarding/FocusStep';
import CompleteStep from '@/components/onboarding/CompleteStep';

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const upsertPrefs = useUpsertPreferences();

  const [step, setStep] = useState(1);
  const [homeName, setHomeName] = useState('');
  const [saving, setSaving] = useState(false);

  const firstName = profile?.full_name?.split(' ')[0] || 'Your';

  const goTo = useCallback((s: number) => setStep(s), []);

  // Step 2: Home name
  const handleHomeName = useCallback((name: string) => {
    setHomeName(name);
    setStep(3);
  }, []);

  // Step 3: Credit & loans
  const handleCredit = useCallback(
    async (data: { creditScore?: number; hasStudentLoans: boolean }) => {
      if (!user) return;
      try {
        // Save credit score to user_finances if provided
        if (data.creditScore) {
          await (supabase as any).from('user_finances').upsert(
            {
              user_id: user.id,
              credit_score: data.creditScore,
              has_student_loans: data.hasStudentLoans,
              onboarding_completed: false,
            },
            { onConflict: 'user_id' }
          );
        }
      } catch (e) {
        console.error('Credit step error:', e);
      }
      setStep(4);
    },
    [user]
  );

  // Step 4: Goal
  const handleGoal = useCallback(
    async (goal: { text: string; targetDate?: string }) => {
      if (!user) return;
      try {
        await (supabase as any).from('projects').insert({
          user_id: user.id,
          name: goal.text,
          type: 'goal',
          end_date: goal.targetDate || null,
        });
      } catch (e) {
        console.error('Goal step error:', e);
      }
      setStep(5);
    },
    [user]
  );

  // Step 5: Focus selection → finalize
  const handleFocus = useCallback(
    async (focus: string) => {
      if (!user || saving) return;
      setSaving(true);
      try {
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 7);

        await upsertPrefs.mutateAsync({
          home_name: homeName || `${firstName}'s Home`,
          home_style: 'minimal',
          onboarding_focus: focus,
          onboarding_completed: true,
          trial_start_date: now.toISOString(),
          trial_end_date: trialEnd.toISOString(),
        } as any);

        setStep(6);
      } catch (error) {
        console.error('Finalize error:', error);
      } finally {
        setSaving(false);
      }
    },
    [user, saving, homeName, firstName, upsertPrefs]
  );

  // Step 6: Complete → dashboard
  const handleFinish = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Progress dots top-right (hidden on step 1 & 6) */}
      {step > 1 && step < 6 && <ProgressDots total={TOTAL_STEPS} current={step} />}

      <AnimatePresence mode="wait">
        {step === 1 && <WelcomeStep onNext={() => goTo(2)} />}
        {step === 2 && (
          <HomeNameStep
            firstName={firstName}
            defaultName={homeName || `${firstName}'s Home`}
            onNext={handleHomeName}
          />
        )}
        {step === 3 && <CreditStep onNext={handleCredit} onSkip={() => goTo(4)} />}
        {step === 4 && <GoalStep onNext={handleGoal} onSkip={() => goTo(5)} />}
        {step === 5 && <FocusStep onNext={handleFocus} />}
        {step === 6 && <CompleteStep onFinish={handleFinish} />}
      </AnimatePresence>
    </div>
  );
}
