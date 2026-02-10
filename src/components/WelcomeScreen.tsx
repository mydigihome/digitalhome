import { useState } from 'react';
import { DoorOpen } from 'lucide-react';

interface WelcomeScreenProps {
  userName: string;
  onEnter: () => void;
}

const WelcomeScreen = ({ userName, onEnter }: WelcomeScreenProps) => {
  const [isBlurring, setIsBlurring] = useState(false);

  const handleEnter = () => {
    setIsBlurring(true);
    setTimeout(() => {
      onEnter();
    }, 1000);
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 flex items-center justify-center transition-all duration-1000 ${
        isBlurring ? 'blur-xl opacity-0' : 'blur-0 opacity-100'
      }`}
    >
      <div className="text-center">
        <div className="mb-8 animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <span className="text-primary-foreground font-bold text-4xl">D</span>
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-4">
            Welcome Home
          </h1>
          <p className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
            {userName}
          </p>
        </div>

        <button
          onClick={handleEnter}
          className="group relative mt-12 px-8 py-6 bg-card rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-border"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center group-hover:from-primary/90 group-hover:to-primary/60 transition-all">
              <DoorOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground font-medium">Step Inside</p>
              <p className="text-2xl font-bold text-foreground">Enter Your Home</p>
            </div>
          </div>
        </button>

        <p className="mt-8 text-muted-foreground text-sm">Your life, organized in one place</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
