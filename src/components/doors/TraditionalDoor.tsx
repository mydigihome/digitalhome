import { motion } from 'framer-motion';

interface TraditionalDoorProps {
  isOpen: boolean;
  size?: 'small' | 'large';
}

export default function TraditionalDoor({ isOpen, size = 'large' }: TraditionalDoorProps) {
  const width = size === 'large' ? 240 : 80;
  const height = size === 'large' ? 320 : 100;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      <svg width={width} height={height} viewBox="0 0 240 320" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`woodGrad-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B6F47" />
            <stop offset="50%" stopColor="#7A5C38" />
            <stop offset="100%" stopColor="#6B4D2E" />
          </linearGradient>
        </defs>

        {/* Dark interior */}
        <rect width="240" height="320" fill="#1a1a2e" />

        {/* Arch shape interior */}
        <path d="M 20 320 L 20 100 Q 20 20 120 20 Q 220 20 220 100 L 220 320 Z" fill="#0f0f1a" opacity="0.5" />

        {/* Left door leaf */}
        <motion.g
          style={{ originX: '20px', originY: '160px' }}
          animate={isOpen ? { scaleX: 0.25, x: -30, skewY: -2 } : { scaleX: 1, x: 0, skewY: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <path d="M 20 320 L 20 100 Q 20 20 120 20 L 120 320 Z" fill={`url(#woodGrad-${size})`} />
          <path d="M 20 320 L 20 100 Q 20 20 120 20 L 120 320 Z" fill="none" stroke="#5A3E28" strokeWidth="2" />
          {/* Panels */}
          <rect x="35" y="60" width="70" height="80" rx="4" fill="none" stroke="#5A3E28" strokeWidth="1.5" />
          <rect x="35" y="160" width="70" height="100" rx="4" fill="none" stroke="#5A3E28" strokeWidth="1.5" />
          {/* Knob */}
          <circle cx="100" cy="200" r="6" fill="#C8A96E" />
          <circle cx="100" cy="200" r="3" fill="#B8954E" />
        </motion.g>

        {/* Right door leaf */}
        <motion.g
          style={{ originX: '220px', originY: '160px' }}
          animate={isOpen ? { scaleX: 0.25, x: 30, skewY: 2 } : { scaleX: 1, x: 0, skewY: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <path d="M 120 320 L 120 20 Q 220 20 220 100 L 220 320 Z" fill={`url(#woodGrad-${size})`} />
          <path d="M 120 320 L 120 20 Q 220 20 220 100 L 220 320 Z" fill="none" stroke="#5A3E28" strokeWidth="2" />
          <rect x="135" y="60" width="70" height="80" rx="4" fill="none" stroke="#5A3E28" strokeWidth="1.5" />
          <rect x="135" y="160" width="70" height="100" rx="4" fill="none" stroke="#5A3E28" strokeWidth="1.5" />
          <circle cx="140" cy="200" r="6" fill="#C8A96E" />
          <circle cx="140" cy="200" r="3" fill="#B8954E" />
        </motion.g>

        {/* Arch frame overlay */}
        <path d="M 10 320 L 10 100 Q 10 10 120 10 Q 230 10 230 100 L 230 320" fill="none" stroke="#4A3520" strokeWidth="4" />
      </svg>
    </div>
  );
}
