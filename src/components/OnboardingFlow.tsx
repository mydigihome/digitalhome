import { useState } from 'react';
import { ChevronRight, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingFlowProps {
  onComplete: (userName: string) => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);

  const steps = [
    {
      id: 1,
      title: "Welcome to Digital Home! 🏠",
      subtitle: "Let's get you set up in just 3 easy steps",
      description: "Digital Home is like having your entire life organized in one magical place. Think of it as your personal command center!",
    },
    {
      id: 2,
      title: "What should we call you?",
      subtitle: "We'll use this to personalize your experience",
      description: "Don't worry, you can always change this later in settings!",
    },
    {
      id: 3,
      title: "What do you want to organize?",
      subtitle: "Pick the areas of your life you want to manage",
      description: "You can always add more workspaces later, so just pick what feels right for now!",
    },
    {
      id: 4,
      title: "You're all set! 🎉",
      subtitle: "Here's what you can do in Digital Home",
      description: "We've prepared everything for you. Let's explore!",
    },
  ];

  const workspaces = [
    { id: 'personal', name: 'Personal Projects', icon: '🏠', description: 'Like building a home or planning renovations' },
    { id: 'trips', name: 'Trips & Travel', icon: '✈️', description: 'Vacations, weekend getaways, and adventures' },
    { id: 'goals', name: 'Life Goals', icon: '🎯', description: 'Learning new skills, graduating, career goals' },
  ];

  const features = [
    { icon: '📋', title: 'Daily To-Do Lists', description: 'See your tasks for today and this week' },
    { icon: '📁', title: 'Project Workspaces', description: 'Organize everything in one place' },
    { icon: '👥', title: 'Team Collaboration', description: 'Invite friends and family to help' },
    { icon: '🤖', title: 'AI Assistant', description: 'Get help organizing and planning' },
  ];

  const handleNext = () => {
    if (currentStep === 4) {
      onComplete(userName || 'Friend');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 2) return userName.trim().length > 0;
    if (currentStep === 3) return selectedWorkspaces.length > 0;
    return true;
  };

  const toggleWorkspace = (id: string) => {
    if (selectedWorkspaces.includes(id)) {
      setSelectedWorkspaces(selectedWorkspaces.filter(w => w !== id));
    } else {
      setSelectedWorkspaces([...selectedWorkspaces, id]);
    }
  };

  const step = steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Step {currentStep} of 4</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / 4) * 100)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              animate={{ width: `${(currentStep / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          className="bg-card rounded-3xl shadow-2xl p-8 md:p-12 border border-border"
          layout
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{step.title}</h1>
                <p className="text-lg text-muted-foreground mb-2">{step.subtitle}</p>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>

              {/* Step Content */}
              <div className="mb-8">
                {currentStep === 1 && (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-3xl mx-auto mb-6 flex items-center justify-center animate-bounce">
                      <Sparkles className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <p className="text-lg text-foreground/80">Ready to organize your life? Let's go! 🚀</p>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full px-6 py-4 text-lg border-2 border-border rounded-xl bg-background text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 transition placeholder:text-muted-foreground"
                      autoFocus
                    />
                    {userName && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-2xl">👋</span>
                        <div>
                          <p className="font-medium text-foreground">Nice to meet you, {userName}!</p>
                          <p className="text-sm text-muted-foreground">We'll use this to make everything feel personal</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => toggleWorkspace(workspace.id)}
                        className={`p-6 rounded-2xl border-2 transition-all text-left ${
                          selectedWorkspaces.includes(workspace.id)
                            ? 'border-primary bg-primary/5 shadow-lg scale-105'
                            : 'border-border hover:border-muted-foreground/30 bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-4xl">{workspace.icon}</span>
                          {selectedWorkspaces.includes(workspace.id) && (
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{workspace.name}</h3>
                        <p className="text-sm text-muted-foreground">{workspace.description}</p>
                      </button>
                    ))}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl hover:bg-muted transition"
                      >
                        <span className="text-3xl">{feature.icon}</span>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            {currentStep > 1 && currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 text-muted-foreground hover:text-foreground font-medium transition"
              >
                Back
              </button>
            ) : <div />}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-8 py-4 rounded-xl font-semibold transition flex items-center gap-2 ${
                canProceed()
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {currentStep === 4 ? "Let's Go!" : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        <p className="text-center mt-6 text-muted-foreground text-sm">
          Need help? We're here to guide you every step of the way! 💙
        </p>
      </div>
    </div>
  );
};

export default OnboardingFlow;
