import { useState, useEffect } from 'react';
import { Sparkles, X, Lightbulb } from 'lucide-react';

interface Tip {
  id: string;
  message: string;
  context: string;
}

const BestPracticeBot = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);
  const [opacity, setOpacity] = useState(0.95);

  const tips: Tip[] = [
    {
      id: '1',
      message: '💡 Tip: Break large goals into smaller 30-day habits to build consistency!',
      context: 'budget-tracker',
    },
    {
      id: '2',
      message: '📊 Did you know? You can track multiple brokers in one place!',
      context: 'investment-tracker',
    },
    {
      id: '3',
      message: '🎯 Set check-in dates for your goals to stay accountable!',
      context: 'goal-tracker',
    },
    {
      id: '4',
      message: '✨ Pro tip: Use templates to create projects faster!',
      context: 'project-creation',
    },
  ];

  useEffect(() => {
    // Show random tip every 30 seconds
    const interval = setInterval(() => {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setCurrentTip(randomTip);
      setIsVisible(true);

      // Auto-hide after 10 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 10000);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !currentTip) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 animate-slide-up"
      style={{ opacity }}
    >
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-4 max-w-sm backdrop-blur-sm border border-white/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm leading-relaxed">
              {currentTip.message}
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition flex-shrink-0"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Opacity Slider */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80">Transparency:</span>
            <input
              type="range"
              min="50"
              max="100"
              value={opacity * 100}
              onChange={(e) => setOpacity(Number(e.target.value) / 100)}
              className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPracticeBot;
