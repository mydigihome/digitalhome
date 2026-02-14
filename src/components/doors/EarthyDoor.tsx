import { motion } from 'framer-motion';

interface EarthyDoorProps {
  isOpen: boolean;
  size?: 'small' | 'large';
}

export default function EarthyDoor({ isOpen, size = 'large' }: EarthyDoorProps) {
  const width = size === 'large' ? 240 : 80;
  const height = size === 'large' ? 320 : 100;
  const uid = `earthy-${size}`;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 4 }}>
      <svg width={width} height={height} viewBox="0 0 240 320" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`blackDoorGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="50%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
          <linearGradient id={`glassGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#87ceeb" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4682b4" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Frame only - NO background */}
        <path d="M 40 300 L 40 80 Q 40 30 70 30 L 170 30 Q 200 30 200 80 L 200 300" 
              fill="none" stroke="#c0c0c0" strokeWidth="8" />

        {/* Left door leaf */}
        <motion.g
          style={{ originX: '55px', originY: '170px' }}
          animate={isOpen
            ? { scaleX: 0.2, x: -80, skewY: -2, opacity: 0.4 }
            : { scaleX: 1, x: 0, skewY: 0, opacity: 1 }
          }
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        >
          <path d="M 55 50 L 55 80 Q 55 45 75 45 L 115 45 L 115 285 L 55 285 Z"
                fill={`url(#blackDoorGrad-${uid})`} stroke="#0a0a0a" strokeWidth="2" />
          {/* Glass panel */}
          <rect x="65" y="70" width="40" height="90" rx="3" fill={`url(#glassGrad-${uid})`} />
          <line x1="85" y1="70" x2="85" y2="160" stroke="#1a1a1a" strokeWidth="3" />
          <line x1="65" y1="115" x2="105" y2="115" stroke="#1a1a1a" strokeWidth="3" />
          {/* Lower panel */}
          <rect x="65" y="230" width="40" height="45" rx="3" fill="none" stroke="#000000" strokeWidth="2" />
        </motion.g>

        {/* Right door leaf */}
        <motion.g
          style={{ originX: '185px', originY: '170px' }}
          animate={isOpen
            ? { scaleX: 0.2, x: 80, skewY: 2, opacity: 0.4 }
            : { scaleX: 1, x: 0, skewY: 0, opacity: 1 }
          }
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        >
          <path d="M 185 50 L 185 80 Q 185 45 165 45 L 125 45 L 125 285 L 185 285 Z"
                fill={`url(#blackDoorGrad-${uid})`} stroke="#0a0a0a" strokeWidth="2" />
          <rect x="135" y="70" width="40" height="90" rx="3" fill={`url(#glassGrad-${uid})`} />
          <line x1="155" y1="70" x2="155" y2="160" stroke="#1a1a1a" strokeWidth="3" />
          <line x1="135" y1="115" x2="175" y2="115" stroke="#1a1a1a" strokeWidth="3" />
          <rect x="135" y="230" width="40" height="45" rx="3" fill="none" stroke="#000000" strokeWidth="2" />
          {/* Handle */}
          <rect x="142" y="155" width="3" height="25" rx="1.5" fill="#c0c0c0" />
        </motion.g>

        {/* Lantern */}
        <g transform="translate(120, 20)">
          <line x1="0" y1="-10" x2="0" y2="5" stroke="#1a1a1a" strokeWidth="1" />
          <rect x="-8" y="5" width="16" height="12" fill="#1a1a1a" />
          <circle cx="-5" cy="12" r="2" fill="#ffb347" />
          <circle cx="5" cy="12" r="2" fill="#ffb347" />
        </g>

        {/* Welcome mat */}
        <rect x="70" y="295" width="100" height="15" rx="2" fill="#8b7355" />
        <text x="120" y="305" fontFamily="serif" fontSize="8" fill="#d4b896" textAnchor="middle">WELCOME</text>
      </svg>
    </div>
  );
}
