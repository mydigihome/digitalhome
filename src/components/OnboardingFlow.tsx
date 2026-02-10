import { useState } from 'react';
import { ChevronRight, X, Play, GripVertical } from 'lucide-react';

interface Widget {
  id: string;
  name: string;
  enabled: boolean;
}

interface OnboardingFlowProps {
  onComplete: (userName: string, widgets: Widget[]) => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'today-todo', name: "Today's To-Do", enabled: true },
    { id: 'this-week', name: "This Week", enabled: true },
    { id: 'date-time', name: 'Date & Time', enabled: true },
    { id: 'priority-projects', name: 'Top Priority Projects', enabled: true },
    { id: 'everyday-links', name: 'Everyday Links', enabled: true },
    { id: 'calendar', name: 'Calendar Preview', enabled: false },
    { id: 'recent-activity', name: 'Recent Activity', enabled: false },
    { id: 'quick-stats', name: 'Quick Stats', enabled: true },
  ]);

  const steps = [
    {
      id: 1,
      title: "Welcome to Digital Home",
      subtitle: "Your real life, organized in one place",
    },
    {
      id: 2,
      title: "What's your name?",
      subtitle: "We'll personalize your experience",
    },
    {
      id: 3,
      title: "Customize your dashboard",
      subtitle: "Select the widgets you want to see",
    },
  ];

  const toggleWidget = (id: string) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const handleNext = () => {
    if (currentStep === 3) {
      onComplete(userName || 'Friend', widgets);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 2) return userName.trim().length > 0;
    return true;
  };

  const step = steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {currentStep} of 3</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{step.title}</h1>
            <p className="text-lg text-gray-600">{step.subtitle}</p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 1 && (
              <div className="text-center py-8 space-y-6">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl mx-auto flex items-center justify-center">
                  <span className="text-white font-bold text-5xl">D</span>
                </div>
                
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition font-medium"
                >
                  <Play className="w-5 h-5" />
                  Watch Platform Tutorial (2 min)
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  autoFocus
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">Drag to reorder • Toggle to show/hide</p>
                
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                  >
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    <span className="flex-1 font-medium text-gray-900">{widget.name}</span>
                    <button
                      onClick={() => toggleWidget(widget.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        widget.enabled ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          widget.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`ml-auto px-8 py-4 rounded-xl font-semibold transition flex items-center gap-2 ${
                canProceed()
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentStep === 3 ? "Get Started" : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Tutorial Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Platform Tutorial</h2>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center mb-6">
              <div className="text-center text-white">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Video tutorial would play here</p>
                <p className="text-sm opacity-75 mt-2">Integrate with YouTube/Vimeo/Loom</p>
              </div>
            </div>

            <button
              onClick={() => setShowVideoModal(false)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Continue Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingFlow;
