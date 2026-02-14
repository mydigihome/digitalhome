import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import ModernDoor from '@/components/doors/ModernDoor';
import TraditionalDoor from '@/components/doors/TraditionalDoor';
import EarthyDoor from '@/components/doors/EarthyDoor';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: prefs } = useUserPreferences();
  const [doorOpened, setDoorOpened] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const homeStyle = (prefs as any)?.home_style || 'modern';
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  const getBackground = () => {
    switch (homeStyle) {
      case 'modern': return 'linear-gradient(180deg, hsl(210 20% 98%) 0%, hsl(0 0% 100%) 100%)';
      case 'earthy': return 'linear-gradient(180deg, hsl(200 10% 96%) 0%, hsl(200 5% 92%) 100%)';
      case 'traditional': return 'linear-gradient(180deg, hsl(30 30% 96%) 0%, hsl(30 25% 93%) 100%)';
      default: return 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%)';
    }
  };

  const getDoorComponent = () => {
    const props = { isOpen: doorOpened, size: 'large' as const };
    switch (homeStyle) {
      case 'modern': return <ModernDoor {...props} />;
      case 'earthy': return <EarthyDoor {...props} />;
      case 'traditional': return <TraditionalDoor {...props} />;
      default: return <ModernDoor {...props} />;
    }
  };

  const handleEnter = () => {
    // Step 1: Door opens (800ms)
    setDoorOpened(true);
    
    // Step 2: After door opens, zoom and fade (800ms)
    setTimeout(() => {
      setIsEntering(true);
    }, 800);
    
    // Step 3: Navigate after zoom completes (1200ms total)
    setTimeout(() => {
      navigate('/dashboard');
    }, 1600);
  };

  return (
    <div
      onClick={handleEnter}
      className="min-h-screen flex flex-col items-center justify-center cursor-pointer select-none"
      style={{ background: getBackground() }}
    >
      {/* Text at TOP */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isEntering ? 0 : 1, y: isEntering ? -10 : 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-10 text-xl font-medium text-foreground"
      >
        Welcome home, {firstName}.
      </motion.p>

      {/* Door BELOW text with zoom animation */}
      <motion.div
        animate={
          !doorOpened
            ? { scale: [0.98, 1, 0.98] } // breathing animation
            : isEntering
            ? { scale: 1.5, opacity: 0 } // zoom and fade
            : { scale: 1, opacity: 1 } // door just opened
        }
        transition={
          !doorOpened
            ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
        }
      >
        {getDoorComponent()}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: isEntering ? 0 : !doorOpened ? 0.5 : 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-8 text-sm text-muted-foreground"
      >
        Click anywhere to enter
      </motion.p>
    </div>
  );
};

export default WelcomeScreen;
