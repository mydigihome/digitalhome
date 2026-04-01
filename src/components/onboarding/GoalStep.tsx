import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

const EXAMPLE_GOALS = [
  { emoji: '', label: 'Buy investment property' },
  { emoji: '', label: 'Save $10K' },
  { emoji: '', label: 'Pay off loans' },
  { emoji: '', label: 'Start a business' },
];

interface GoalStepProps {
  onNext: (goal: { text: string; targetDate?: string }) => void;
  onSkip: () => void;
}

export default function GoalStep({ onNext, onSkip }: GoalStepProps) {
  const [goalText, setGoalText] = useState('');
  const [targetDate, setTargetDate] = useState('');

  return (
    <motion.div
      key="goal"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-screen px-6"
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Target size={24} className="text-primary" />
          </div>
        </div>

        <h1
          className="text-3xl md:text-4xl font-light text-foreground text-center mb-2"
          style={{ letterSpacing: '-0.02em' }}
        >
          Set your first goal
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          What are you working towards?
        </p>

        {/* Example pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {EXAMPLE_GOALS.map((g) => (
            <button
              key={g.label}
              onClick={() => setGoalText(g.label)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                goalText === g.label
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-muted-foreground/50'
              }`}
            >
              {g.emoji} {g.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="Or type your own goal..."
          className="w-full h-14 px-5 text-base text-center bg-muted/50 border border-border rounded-xl outline-none transition-colors focus:border-primary focus:bg-background"
        />

        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full h-12 px-5 mt-3 text-sm text-center bg-muted/50 border border-border rounded-xl outline-none transition-colors focus:border-primary focus:bg-background text-muted-foreground"
          placeholder="Target date (optional)"
        />

        <button
          onClick={() => onNext({ text: goalText, targetDate: targetDate || undefined })}
          disabled={!goalText.trim()}
          className="w-full h-14 mt-6 bg-foreground text-background rounded-xl text-base font-medium transition-opacity disabled:opacity-30 hover:opacity-90"
        >
          Continue
        </button>

        <button
          onClick={onSkip}
          className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
}
