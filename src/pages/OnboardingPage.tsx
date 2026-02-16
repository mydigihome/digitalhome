import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUpsertPreferences } from '@/hooks/useUserPreferences';

type Focus = 'organize' | 'money' | 'future' | 'build';

const focusOptions = [
  { id: 'organize' as Focus, icon: '📋', label: 'Organize my life' },
  { id: 'money' as Focus, icon: '💰', label: 'Track my money' },
  { id: 'future' as Focus, icon: '🎯', label: 'Plan my future' },
  { id: 'build' as Focus, icon: '✨', label: 'Build something meaningful' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const upsertPrefs = useUpsertPreferences();

  const [step, setStep] = useState(1);
  const [homeName, setHomeName] = useState(() => {
    const first = profile?.full_name?.split(' ')[0] || '';
    return first ? `${first}'s Home` : '';
  });
  const [saving, setSaving] = useState(false);

  const handleComplete = async (focus: Focus) => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);

      await upsertPrefs.mutateAsync({
        home_name: homeName,
        home_style: 'minimal',
        onboarding_focus: focus,
        onboarding_completed: true,
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
      } as any);
      navigate('/welcome');
    } catch (error) {
      console.error('Error:', error);
      setSaving(false);
    }
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Your';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <AnimatePresence mode="wait">
          {/* STEP 1: Name your home */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 600,
                  color: '#1F2937',
                  textAlign: 'center',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                What should we call your home?
              </h1>

              <p
                style={{
                  fontSize: '15px',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  margin: '0 0 24px 0',
                }}
              >
                This is your personal space.
              </p>

              <input
                type="text"
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
                placeholder={`${firstName}'s Home`}
                autoFocus
                maxLength={50}
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 20px',
                  fontSize: '17px',
                  color: '#1F2937',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8B5CF6';
                  e.target.style.backgroundColor = '#FFFFFF';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.backgroundColor = '#F9FAFB';
                }}
              />

              <button
                onClick={() => setStep(2)}
                disabled={!homeName.trim()}
                style={{
                  width: '100%',
                  height: '52px',
                  marginTop: '16px',
                  backgroundColor: homeName.trim() ? '#8B5CF6' : '#F3F4F6',
                  color: homeName.trim() ? '#FFFFFF' : '#9CA3AF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: 600,
                  cursor: homeName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (homeName.trim()) e.currentTarget.style.backgroundColor = '#7C3AED';
                }}
                onMouseLeave={(e) => {
                  if (homeName.trim()) e.currentTarget.style.backgroundColor = '#8B5CF6';
                }}
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 2: Choose focus */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 600,
                  color: '#1F2937',
                  textAlign: 'center',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                What do you want help with first?
              </h1>

              <p
                style={{
                  fontSize: '15px',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  margin: '0 0 24px 0',
                }}
              >
                You can explore everything later.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {focusOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleComplete(option.id)}
                    disabled={saving}
                    style={{
                      width: '100%',
                      height: '64px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '0 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: saving ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.currentTarget.style.borderColor = '#8B5CF6';
                        e.currentTarget.style.backgroundColor = '#FAFBFC';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{option.icon}</span>
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 500,
                        color: '#1F2937',
                      }}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                style={{
                  marginTop: '16px',
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
