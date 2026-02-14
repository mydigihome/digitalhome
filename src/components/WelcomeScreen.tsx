import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences, useUpsertPreferences } from '@/hooks/useUserPreferences';
import ModernDoor from '@/components/doors/ModernDoor';
import TraditionalDoor from '@/components/doors/TraditionalDoor';
import EarthyDoor from '@/components/doors/EarthyDoor';
import { X } from 'lucide-react';

const encouragingMessages = [
  "You made progress yesterday.",
  "Ready to continue?",
  "Your future is waiting inside.",
  "Ready when you are.",
  "You're doing better than you think."
];

const getRandomMessage = () => {
  if (Math.random() < 0.4) {
    return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  }
  return null;
};

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const [doorOpened, setDoorOpened] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [message] = useState(() => getRandomMessage());

  // Video modal state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const homeStyle = (prefs as any)?.home_style || 'modern';
  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const welcomeVideoWatched = (prefs as any)?.welcome_video_watched;
  const welcomeVideoUrl = (prefs as any)?.welcome_video_url || 'https://www.loom.com/embed/your-video-id';

  // Show video modal 1s after mount if not watched
  useEffect(() => {
    if (prefs && welcomeVideoWatched === false) {
      const timer = setTimeout(() => setShowVideoModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [prefs, welcomeVideoWatched]);

  // Auto-close video after 2 minutes
  useEffect(() => {
    if (showVideoPlayer) {
      const timer = setTimeout(() => handleCloseVideo(), 120000);
      return () => clearTimeout(timer);
    }
  }, [showVideoPlayer]);

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
    if (showVideoModal || showVideoPlayer) return;
    setDoorOpened(true);
    setTimeout(() => setIsEntering(true), 800);
    setTimeout(() => navigate('/dashboard'), 1600);
  };

  const handleWatchVideo = () => {
    setShowVideoModal(false);
    setShowVideoPlayer(true);
  };

  const handleSkipVideo = async () => {
    setShowVideoModal(false);
    await upsertPrefs.mutateAsync({ welcome_video_watched: true } as any);
  };

  const handleCloseVideo = async () => {
    setShowVideoPlayer(false);
    await upsertPrefs.mutateAsync({ welcome_video_watched: true } as any);
  };

  return (
    <div
      onClick={handleEnter}
      className="min-h-screen flex flex-col items-center justify-center cursor-pointer select-none"
      style={{ background: getBackground() }}
    >
      {/* Welcome text */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isEntering ? 0 : 1, y: isEntering ? -10 : 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-medium text-foreground"
        style={{ marginBottom: message ? '12px' : '80px', textAlign: 'center' }}
      >
        Welcome home, {firstName}.
      </motion.p>

      {/* Random encouraging message */}
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: isEntering ? 0 : 0.8 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-sm text-muted-foreground"
          style={{ marginBottom: '80px', textAlign: 'center' }}
        >
          {message}
        </motion.p>
      )}

      {/* Door with breathing/zoom animation */}
      <motion.div
        animate={
          !doorOpened
            ? { scale: [0.98, 1, 0.98] }
            : isEntering
            ? { scale: 1.5, opacity: 0 }
            : { scale: 1, opacity: 1 }
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

      {/* Welcome Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10001 }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-8 shadow-xl"
              style={{ width: '420px', maxWidth: '90vw' }}
            >
              <p className="text-base text-foreground leading-relaxed mb-3">
                Hi, I'm glad you're here.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Would you like a quick 60-second tour?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleWatchVideo}
                  className="w-full h-11 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Watch the guide
                </button>
                <button
                  onClick={handleSkipVideo}
                  className="w-full bg-transparent border-none text-muted-foreground text-sm py-2 hover:text-foreground transition-colors cursor-pointer"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player Modal */}
      <AnimatePresence>
        {showVideoPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10001 }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 shadow-xl"
              style={{ width: '640px', maxWidth: '95vw' }}
            >
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleCloseVideo}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div className="w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={welcomeVideoUrl}
                  frameBorder="0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomeScreen;
