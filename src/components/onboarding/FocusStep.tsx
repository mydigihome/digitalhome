import { motion } from 'framer-motion';

type Focus = 'organize' | 'money' | 'future' | 'build';

const focusOptions: { id: Focus; icon: string; label: string; desc: string }[] = [
  { id: 'organize', icon: '📋', label: 'Organize my life', desc: 'Projects, tasks, and planning' },
  { id: 'money', icon: '💰', label: 'Track my money', desc: 'Bills, savings, and investments' },
  { id: 'future', icon: '🎯', label: 'Plan my future', desc: 'Goals, college, and career' },
  { id: 'build', icon: '✨', label: 'Build something meaningful', desc: 'Create, launch, and grow' },
];

interface FocusStepProps {
  onNext: (focus: Focus) => void;
}

export default function FocusStep({ onNext }: FocusStepProps) {
  return (
    <motion.div
      key="focus"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-screen px-6"
    >
      <div className="w-full max-w-md">
        <h1
          className="text-3xl md:text-4xl font-light text-foreground text-center mb-2"
          style={{ letterSpacing: '-0.02em' }}
        >
          What matters most?
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-10">
          You can explore everything later.
        </p>

        <div className="flex flex-col gap-3">
          {focusOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onNext(option.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <span className="text-2xl">{option.icon}</span>
              <div className="flex-1">
                <span className="text-base font-medium text-foreground block">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.desc}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
