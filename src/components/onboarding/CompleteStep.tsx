import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface CompleteStepProps {
  onFinish: () => void;
}

export default function CompleteStep({ onFinish }: CompleteStepProps) {
  return (
    <motion.div
      key="complete"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-screen px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-8"
      >
        <Check size={40} className="text-white" strokeWidth={3} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="text-3xl md:text-4xl font-light text-foreground text-center mb-2"
        style={{ letterSpacing: '-0.02em' }}
      >
        You're all set
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-muted-foreground text-center text-sm mb-12"
      >
        Your digital home is ready.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        onClick={onFinish}
        className="px-8 h-14 bg-foreground text-background rounded-xl text-base font-medium transition-opacity hover:opacity-90"
      >
        Enter Digital Home →
      </motion.button>
    </motion.div>
  );
}
