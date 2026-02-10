import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeScreenProps {
  userName: string;
  onEnter: () => void;
}

const WelcomeScreen = ({ userName, onEnter }: WelcomeScreenProps) => {
  const [doorOpen, setDoorOpen] = useState(false);
  const [expanding, setExpanding] = useState(false);

  const handleClick = () => {
    setDoorOpen(true);
    setTimeout(() => setExpanding(true), 600);
    setTimeout(() => onEnter(), 1400);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Expanding overlay that "becomes" the dashboard */}
      <AnimatePresence>
        {expanding && (
          <motion.div
            className="absolute inset-0 bg-background z-50"
            initial={{ clipPath: 'circle(0% at 50% 60%)' }}
            animate={{ clipPath: 'circle(150% at 50% 60%)' }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
        )}
      </AnimatePresence>

      {/* Welcome text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          Welcome Home, <span className="text-primary">{userName}</span>
        </h1>
      </motion.div>

      {/* Door */}
      <motion.button
        onClick={handleClick}
        disabled={doorOpen}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative w-32 h-48 cursor-pointer focus:outline-none group"
        whileHover={!doorOpen ? { scale: 1.05 } : undefined}
        whileTap={!doorOpen ? { scale: 0.98 } : undefined}
      >
        {/* Door frame */}
        <div className="absolute inset-0 rounded-t-xl border-4 border-primary/30 bg-primary/5" />

        {/* Door panel — pivots open from the left edge */}
        <motion.div
          className="absolute inset-[4px] rounded-t-lg bg-gradient-to-b from-primary to-primary/80 origin-left shadow-lg"
          animate={doorOpen ? { rotateY: -110, opacity: 0.7 } : { rotateY: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ perspective: 800, transformStyle: 'preserve-3d' }}
        >
          {/* Door knob */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary-foreground/80 shadow-md" />

          {/* Door panels decorative */}
          <div className="absolute inset-3 flex flex-col gap-2">
            <div className="flex-1 rounded border border-primary-foreground/10" />
            <div className="flex-1 rounded border border-primary-foreground/10" />
          </div>
        </motion.div>

        {/* Warm glow behind the door when open */}
        <AnimatePresence>
          {doorOpen && (
            <motion.div
              className="absolute inset-[4px] rounded-t-lg bg-gradient-to-b from-amber-100/80 to-amber-50/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-muted-foreground text-sm"
      >
        {doorOpen ? 'Stepping inside…' : 'Tap the door to enter'}
      </motion.p>
    </div>
  );
};

export default WelcomeScreen;
