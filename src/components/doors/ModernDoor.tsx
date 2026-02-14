import { motion } from 'framer-motion';

interface ModernDoorProps {
  isOpen: boolean;
  size?: 'small' | 'large';
}

export default function ModernDoor({ isOpen, size = 'large' }: ModernDoorProps) {
  const width = size === 'large' ? 240 : 80;
  const height = size === 'large' ? 320 : 100;
  const uid = `modern-${size}`;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 4 }}>
      <svg width={width} height={height} viewBox="0 0 240 320" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`metalGrad-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b8b8b8" />
            <stop offset="30%" stopColor="#d4d4d4" />
            <stop offset="50%" stopColor="#e8e8e8" />
            <stop offset="70%" stopColor="#d4d4d4" />
            <stop offset="100%" stopColor="#b8b8b8" />
          </linearGradient>
          <linearGradient id={`panelShadow-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#c0c0c0" stopOpacity="0" />
            <stop offset="100%" stopColor="#888888" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Frame only - NO background */}
        <rect x="30" y="40" width="180" height="260" fill="none" stroke="#c0c0c0" strokeWidth="6" rx="2" />

        {/* Floor indicator */}
        <rect x="95" y="15" width="50" height="20" fill="#e0e0e0" rx="2" />
        <rect x="97" y="17" width="46" height="16" fill="#0a0a0a" rx="1" />
        <text x="120" y="29" fontFamily="monospace" fontSize="12" fill="#00ff00" textAnchor="middle">37</text>

        {/* Button panel */}
        <g transform="translate(215, 145)">
          <rect width="18" height="30" rx="3" fill="#e8e8e8" />
          <circle cx="9" cy="8" r="4" fill="#00cc00" />
          <circle cx="9" cy="22" r="4" fill="#888888" />
        </g>

        {/* Left panel */}
        <motion.g
          animate={{ x: isOpen ? -120 : 0 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          style={{ originX: '40px' }}
        >
          <rect x="40" y="50" width="100" height="240" fill={`url(#metalGrad-${uid})`} />
          <rect x="40" y="50" width="100" height="240" fill={`url(#panelShadow-${uid})`} opacity="0.5" />
          <line x1="90" y1="60" x2="90" y2="280" stroke="#999999" strokeWidth="1" />
          <line x1="50" y1="100" x2="130" y2="100" stroke="#a8a8a8" strokeWidth="0.5" />
          <line x1="50" y1="220" x2="130" y2="220" stroke="#a8a8a8" strokeWidth="0.5" />
        </motion.g>

        {/* Right panel */}
        <motion.g
          animate={{ x: isOpen ? 120 : 0 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          style={{ originX: '140px' }}
        >
          <rect x="100" y="50" width="100" height="240" fill={`url(#metalGrad-${uid})`} />
          <rect x="100" y="50" width="100" height="240" fill={`url(#panelShadow-${uid})`} opacity="0.5" />
          <line x1="150" y1="60" x2="150" y2="280" stroke="#999999" strokeWidth="1" />
          <line x1="110" y1="100" x2="190" y2="100" stroke="#a8a8a8" strokeWidth="0.5" />
          <line x1="110" y1="220" x2="190" y2="220" stroke="#a8a8a8" strokeWidth="0.5" />
        </motion.g>

        {/* Center seam */}
        <line x1="120" y1="50" x2="120" y2="290" stroke="#666666" strokeWidth="2" />

        {/* Frame */}
        <rect x="0" y="0" width="240" height="320" fill="none" stroke="#555" strokeWidth="3" />
      </svg>
    </div>
  );
}
