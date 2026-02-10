import { useState } from 'react';
import { DoorOpen } from 'lucide-react';

interface WelcomeScreenProps {
  userName: string;
  onEnter: () => void;
}

const WelcomeScreen = ({ userName, onEnter }: WelcomeScreenProps) => {
  const [isZooming, setIsZooming] = useState(false);

  const handleEnter = () => {
    setIsZooming(true);
    setTimeout(() => {
      onEnter();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center overflow-hidden">
      <div
        className={`text-center transition-all duration-[1500ms] ease-in-out ${
          isZooming ? 'scale-[20] opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <span className="text-white font-bold text-4xl">D</span>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Welcome Home
          </h1>
          <p className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            {userName}
          </p>
        </div>

        <button
          onClick={handleEnter}
          className="group relative mt-12 px-8 py-6 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
              <DoorOpen className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500 font-medium">Step Inside</p>
              <p className="text-2xl font-bold text-gray-900">Enter Your Home</p>
            </div>
          </div>
        </button>

        <p className="mt-8 text-gray-500 text-sm">Your life, organized in one place</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
