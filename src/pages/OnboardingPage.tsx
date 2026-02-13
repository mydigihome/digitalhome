import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUpsertPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import { Check } from 'lucide-react';
import ModernDoor from '@/components/doors/ModernDoor';
import TraditionalDoor from '@/components/doors/TraditionalDoor';
import EarthyDoor from '@/components/doors/EarthyDoor';

type HomeStyle = 'modern' | 'traditional' | 'earthy';
type Focus = 'organize' | 'money' | 'future' | 'build';

const focusOptions = [
  { id: 'organize' as Focus, icon: '📋', label: 'Organize my life' },
  { id: 'money' as Focus, icon: '💰', label: 'Track my money' },
  { id: 'future' as Focus, icon: '🎯', label: 'Plan my future' },
  { id: 'build' as Focus, icon: '✨', label: 'Build something meaningful' },
];

const getStep3Content = (focus: Focus) => {
  switch (focus) {
    case 'organize':
      return { title: 'Add your first goal', placeholder: 'What do you want to achieve?', dateLabel: 'Target date (optional)', multiline: false, amountLabel: '' };
    case 'money':
      return { title: 'Add one upcoming bill', placeholder: 'Bill name (e.g., Rent, Netflix)', dateLabel: 'Due date', amountLabel: 'Amount', multiline: false };
    case 'future':
      return { title: 'Add an upcoming event', placeholder: 'Event name', dateLabel: 'Event date', amountLabel: '', multiline: false };
    case 'build':
      return { title: 'Drop a dream into your vision room', placeholder: 'What do you want to create or achieve?', dateLabel: '', amountLabel: '', multiline: true };
  }
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const upsertPrefs = useUpsertPreferences();

  const [step, setStep] = useState(1);
  const [homeName, setHomeName] = useState(() => {
    const first = profile?.full_name?.split(' ')[0] || '';
    return first ? `${first}'s Home` : '';
  });
  const [homeStyle, setHomeStyle] = useState<HomeStyle | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [firstObject, setFirstObject] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleContinueStep1 = async () => {
    if (!homeName || !homeStyle) return;
    await upsertPrefs.mutateAsync({ home_name: homeName, home_style: homeStyle } as any);
    setStep(2);
  };

  const handleContinueStep2 = async () => {
    if (!focus) return;
    await upsertPrefs.mutateAsync({ onboarding_focus: focus } as any);
    setStep(3);
  };

  const handleSubmitFirstObject = async () => {
    if (!firstObject || !user) return;
    setSaving(true);
    try {
      if (focus === 'organize' || focus === 'future') {
        // Create a project with a task
        const { data: proj } = await (supabase as any)
          .from('projects')
          .insert({ name: focus === 'organize' ? 'My Goals' : 'Upcoming Events', user_id: user.id, type: 'personal' })
          .select('id')
          .single();
        if (proj) {
          await (supabase as any).from('tasks').insert({
            title: firstObject,
            project_id: proj.id,
            user_id: user.id,
            due_date: date || null,
          });
        }
      } else if (focus === 'money') {
        await (supabase as any).from('expenses').insert({
          description: firstObject,
          amount: parseFloat(amount) || 0,
          category: 'Bills',
          expense_date: date || new Date().toISOString().slice(0, 10),
          user_id: user.id,
        });
      } else if (focus === 'build') {
        await (supabase as any).from('brain_dumps').insert({
          content: firstObject,
          type: 'thought',
          user_id: user.id,
        });
      }
      await upsertPrefs.mutateAsync({ onboarding_completed: true } as any);
      setSaved(true);
      setTimeout(() => navigate('/welcome'), 1200);
    } catch {
      setSaving(false);
    }
  };

  const skipToWelcome = async () => {
    await upsertPrefs.mutateAsync({ onboarding_completed: true } as any);
    navigate('/welcome');
  };

  const getDoorPreview = (style: HomeStyle) => {
    const props = { isOpen: false, size: 'small' as const };
    switch (style) {
      case 'modern': return <ModernDoor {...props} />;
      case 'traditional': return <TraditionalDoor {...props} />;
      case 'earthy': return <EarthyDoor {...props} />;
    }
  };

  const slideVariants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -80, opacity: 0 },
  };

  const content = focus ? getStep3Content(focus) : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%)' }}>
      <div className="w-full max-w-[520px]">
        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }} className="space-y-8">
              <h1 className="text-2xl font-semibold text-foreground">Pick Your Home</h1>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">What do you call your home?</label>
                <input
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  placeholder="My Home"
                  className="w-full h-12 px-4 text-[15px] border border-input rounded-[10px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground">Add your name here</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Choose your door style</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['modern', 'traditional', 'earthy'] as HomeStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setHomeStyle(style)}
                      className={`bg-card rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                        homeStyle === style ? 'ring-[3px] ring-primary shadow-md' : 'border border-border'
                      }`}
                    >
                      <div className="h-[100px] flex items-center justify-center">{getDoorPreview(style)}</div>
                      <span className="text-sm font-medium text-foreground capitalize">{style}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">This becomes the door you enter each day.</p>
                <p className="text-xs text-muted-foreground">You can change it anytime in settings.</p>
              </div>

              <button
                onClick={handleContinueStep1}
                disabled={!homeName || !homeStyle}
                className="w-full h-12 bg-primary text-primary-foreground rounded-[10px] text-[15px] font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }} className="space-y-8">
              <h1 className="text-xl font-medium text-foreground text-center">
                What do you want this home to help you with first?
              </h1>

              <div className="space-y-3">
                {focusOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFocus(option.id)}
                    className={`w-full h-[72px] bg-card rounded-xl px-6 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
                      focus === option.id ? 'ring-2 ring-primary' : 'border border-border hover:border-primary hover:bg-secondary/50'
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-[15px] font-medium text-foreground">{option.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleContinueStep2}
                disabled={!focus}
                className="w-full h-12 bg-primary text-primary-foreground rounded-[10px] text-[15px] font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && content && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }} className="space-y-6">
              <h1 className="text-xl font-medium text-foreground text-center">{content.title}</h1>

              {saved ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4 py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Saved! Opening your home...</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {content.multiline ? (
                    <textarea
                      value={firstObject}
                      onChange={(e) => setFirstObject(e.target.value)}
                      placeholder={content.placeholder}
                      className="w-full min-h-[120px] p-4 text-[15px] border border-input rounded-[10px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-y font-[inherit]"
                    />
                  ) : (
                    <input
                      value={firstObject}
                      onChange={(e) => setFirstObject(e.target.value)}
                      placeholder={content.placeholder}
                      className="w-full h-12 px-4 text-[15px] border border-input rounded-[10px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  )}

                  {content.amountLabel && (
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-12 px-4 text-[15px] border border-input rounded-[10px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  )}

                  {content.dateLabel && (
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">{content.dateLabel}</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-12 px-4 text-[15px] border border-input rounded-[10px] bg-background text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSubmitFirstObject}
                    disabled={!firstObject || saving}
                    className="w-full h-12 bg-primary text-primary-foreground rounded-[10px] text-[15px] font-medium disabled:opacity-40 hover:opacity-90 transition-opacity mt-3"
                  >
                    {saving ? 'Saving...' : 'Add'}
                  </button>

                  <button onClick={skipToWelcome} className="w-full bg-transparent border-none text-muted-foreground text-sm mt-1 hover:text-foreground transition-colors">
                    Skip for now
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
