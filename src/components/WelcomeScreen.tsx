import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import MinimalWhiteDoor from '@/components/doors/MinimalWhiteDoor';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [doorOpened, setDoorOpened] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  const handleEnter = () => {
    if (doorOpened) return;
    setDoorOpened(true);
    setTimeout(() => setIsEntering(true), 800);
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  return (
    <div
      onClick={handleEnter}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        cursor: 'pointer',
        userSelect: 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        paddingTop: '40px',
      }}
    >
      {/* Welcome text */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isEntering ? 0 : 1, y: isEntering ? -20 : 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          fontSize: '48px',
          fontWeight: 600,
          color: '#1F2937',
          marginBottom: '0',
          letterSpacing: '-0.02em',
          textAlign: 'center',
        }}
      >
        Welcome home, {firstName}.
      </motion.h1>

      {/* Spacer */}
      <div style={{ height: '80px' }} />

      {/* Door with breathing animation - BIG 500px */}
      <motion.div
        animate={
          !doorOpened
            ? { scale: [0.98, 1, 0.98] }
            : isEntering
            ? { scale: 2.5, opacity: 0 }
            : { scale: 1, opacity: 1 }
        }
        transition={
          !doorOpened
            ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 1.2, ease: [0.4, 0, 0.2, 1] }
        }
      >
        <MinimalWhiteDoor isOpen={doorOpened} height={500} />
      </motion.div>

      {/* Click hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: isEntering ? 0 : 0.4 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{
          marginTop: '32px',
          fontSize: '14px',
          color: '#9CA3AF',
        }}
      >
        Click anywhere to enter
      </motion.p>
    </div>
  );
};

export default WelcomeScreen;
