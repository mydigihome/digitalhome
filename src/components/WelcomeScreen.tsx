import { useState } from 'react';
import doorImage from '@/assets/wooden-door.png';

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
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center transition-all duration-1000 ${
        isBlurring ? 'blur-xl opacity-0' : 'blur-0 opacity-100'
      }`}
    >
      <div className="text-center"
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
            <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
              <img src={doorImage} alt="Wooden door" className="w-full h-full object-cover rounded-xl" />
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
