import { useState } from 'react';
import { motion } from 'framer-motion';

interface HomeNameStepProps {
  firstName: string;
  defaultName: string;
  onNext: (homeName: string) => void;
}

export default function HomeNameStep({ firstName, defaultName, onNext }: HomeNameStepProps) {
  const [homeName, setHomeName] = useState(defaultName);

  return (
    <motion.div
      key="homename"
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
          Name your home
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-10">
          This is your personal space. Make it yours.
        </p>

        <input
          type="text"
          value={homeName}
          onChange={(e) => setHomeName(e.target.value)}
          placeholder={`${firstName}'s Home`}
          autoFocus
          maxLength={50}
          className="w-full h-14 px-5 text-lg text-center bg-muted/50 border border-border rounded-xl outline-none transition-colors focus:border-primary focus:bg-background"
        />

        <button
          onClick={() => onNext(homeName.trim() || `${firstName}'s Home`)}
          disabled={!homeName.trim()}
          className="w-full h-14 mt-6 bg-foreground text-background rounded-xl text-base font-medium transition-opacity disabled:opacity-30 hover:opacity-90"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
