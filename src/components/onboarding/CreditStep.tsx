import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, GraduationCap } from 'lucide-react';

interface CreditStepProps {
  onNext: (data: { creditScore?: number; hasStudentLoans: boolean }) => void;
  onSkip: () => void;
}

export default function CreditStep({ onNext, onSkip }: CreditStepProps) {
  const [creditScore, setCreditScore] = useState('');
  const [hasLoans, setHasLoans] = useState(false);

  return (
    <motion.div
      key="credit"
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
          Your financial snapshot
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-10">
          Optional — helps us personalize your dashboard.
        </p>

        {/* Credit Score */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <CreditCard size={16} />
            Credit Score
          </label>
          <input
            type="number"
            min={300}
            max={850}
            value={creditScore}
            onChange={(e) => setCreditScore(e.target.value)}
            placeholder="e.g. 720"
            className="w-full h-14 px-5 text-lg text-center bg-muted/50 border border-border rounded-xl outline-none transition-colors focus:border-primary focus:bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            300 – 850 range
          </p>
        </div>

        {/* Student Loans Toggle */}
        <button
          onClick={() => setHasLoans(!hasLoans)}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors ${
            hasLoans
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:border-muted-foreground/30'
          }`}
        >
          <GraduationCap size={20} className={hasLoans ? 'text-primary' : 'text-muted-foreground'} />
          <span className="text-sm font-medium text-foreground flex-1 text-left">
            I have student loans
          </span>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              hasLoans ? 'border-primary bg-primary' : 'border-muted-foreground/40'
            }`}
          >
            {hasLoans && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>

        <button
          onClick={() =>
            onNext({
              creditScore: creditScore ? parseInt(creditScore) : undefined,
              hasStudentLoans: hasLoans,
            })
          }
          className="w-full h-14 mt-8 bg-foreground text-background rounded-xl text-base font-medium transition-opacity hover:opacity-90"
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
