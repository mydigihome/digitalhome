import { motion } from 'framer-motion';

interface TraditionalDoorProps {
  isOpen: boolean;
  size?: 'small' | 'large';
}

export default function TraditionalDoor({ isOpen, size = 'large' }: TraditionalDoorProps) {
  const width = size === 'large' ? 200 : 80;
  const height = size === 'large' ? 280 : 100;
  const uid = `traditional-${size}`;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 4 }}>
      <svg width={width} height={height} viewBox="0 0 200 280" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`brownGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b6f47" />
            <stop offset="50%" stopColor="#7a5d3a" />
            <stop offset="100%" stopColor="#6b4e2d" />
          </linearGradient>
        </defs>

        {/* Simple rectangular frame - NO background */}
        <rect x="50" y="30" width="100" height="220" fill="none" stroke="#9d7e57" strokeWidth="4" rx="4" />

        {/* Door panel */}
        <motion.g
          style={{ originX: '55px', originY: '140px' }}
          animate={isOpen
            ? { scaleX: 0.15, x: -70, skewY: -2, opacity: 0.5 }
            : { scaleX: 1, x: 0, skewY: 0, opacity: 1 }
          }
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Main door panel */}
          <rect x="55" y="35" width="90" height="210" rx="3" fill={`url(#brownGrad-${uid})`} stroke="#6b4e2d" strokeWidth="3" />

          {/* Outer frame detail */}
          <rect x="62" y="42" width="76" height="196" rx="2" fill="none" stroke="#9d7e57" strokeWidth="2" />

          {/* Top decorative panel */}
          <rect x="72" y="55" width="56" height="50" rx="2" fill="none" stroke="#6b4e2d" strokeWidth="2" />

          {/* Two bottom panels */}
          <rect x="72" y="155" width="56" height="75" rx="2" fill="none" stroke="#6b4e2d" strokeWidth="2" />

          {/* Door knob (right side) */}
          <circle cx="130" cy="155" r="5" fill="#c0a080" />
          <circle cx="130" cy="155" r="3" fill="#d4b896" />
        </motion.g>
      </svg>
    </div>
  );
}
