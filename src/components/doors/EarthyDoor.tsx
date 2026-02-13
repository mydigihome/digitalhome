import { motion } from 'framer-motion';

interface EarthyDoorProps {
  isOpen: boolean;
  size?: 'small' | 'large';
}

export default function EarthyDoor({ isOpen, size = 'large' }: EarthyDoorProps) {
  const width = size === 'large' ? 240 : 80;
  const height = size === 'large' ? 320 : 100;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 8 }}>
      <svg width={width} height={height} viewBox="0 0 240 320" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`earthWood-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A67B5B" />
            <stop offset="50%" stopColor="#8B6543" />
            <stop offset="100%" stopColor="#7A5634" />
          </linearGradient>
        </defs>

        {/* Dark interior */}
        <rect width="240" height="320" fill="#1a1a2e" />
        <rect x="25" y="15" width="190" height="290" rx="6" fill="#0f0f1a" opacity="0.5" />

        {/* Door frame */}
        <rect x="20" y="10" width="200" height="300" rx="8" fill="none" stroke="#6B4D2E" strokeWidth="5" />

        {/* Single wooden door */}
        <motion.g
          style={{ originX: '20px', originY: '160px' }}
          animate={isOpen ? { scaleX: 0.15, x: -70, skewY: -3 } : { scaleX: 1, x: 0, skewY: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <rect x="20" y="10" width="200" height="300" rx="6" fill={`url(#earthWood-${size})`} />

          {/* Wood grain lines */}
          <line x1="60" y1="20" x2="58" y2="300" stroke="#7A5634" strokeWidth="0.8" opacity="0.5" />
          <line x1="100" y1="15" x2="98" y2="305" stroke="#7A5634" strokeWidth="0.8" opacity="0.5" />
          <line x1="140" y1="18" x2="142" y2="302" stroke="#7A5634" strokeWidth="0.8" opacity="0.5" />
          <line x1="180" y1="20" x2="178" y2="300" stroke="#7A5634" strokeWidth="0.8" opacity="0.5" />

          {/* Door knob */}
          <circle cx="190" cy="170" r="8" fill="#C8A96E" />
          <circle cx="190" cy="170" r="4" fill="#B8954E" />
          {/* Keyhole */}
          <ellipse cx="190" cy="185" rx="3" ry="5" fill="#5A3E28" />

          {/* Hanging plant at top */}
          <g>
            {/* Cord */}
            <line x1="120" y1="0" x2="120" y2="30" stroke="#8B7355" strokeWidth="1.5" />
            {/* Pot */}
            <path d="M 108 30 L 112 50 L 128 50 L 132 30 Z" fill="#C4956A" />
            <rect x="106" y="27" width="28" height="5" rx="2" fill="#B8854E" />
            {/* Leaves */}
            <ellipse cx="105" cy="32" rx="12" ry="6" fill="#6B8F5E" transform="rotate(-30 105 32)" />
            <ellipse cx="135" cy="32" rx="12" ry="6" fill="#7AA06A" transform="rotate(30 135 32)" />
            <ellipse cx="120" cy="25" rx="10" ry="5" fill="#5A7F4E" transform="rotate(5 120 25)" />
          </g>
        </motion.g>

        {/* Welcome mat */}
        <rect x="60" y="300" width="120" height="15" rx="3" fill="#C4A77D" opacity="0.7" />
        <text x="120" y="311" textAnchor="middle" fontSize="7" fill="#7A5634" fontWeight="500">WELCOME</text>
      </svg>
    </div>
  );
}
