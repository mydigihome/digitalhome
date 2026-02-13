import { motion } from 'framer-motion';

interface ModernDoorProps {
  isOpen: boolean;
  size?: 'small' | 'large';
}

export default function ModernDoor({ isOpen, size = 'large' }: ModernDoorProps) {
  const width = size === 'large' ? 240 : 80;
  const height = size === 'large' ? 320 : 100;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 8 }}>
      <svg width={width} height={height} viewBox="0 0 240 320" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`metalGrad-${size}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b8b8b8" />
            <stop offset="30%" stopColor="#d8d8d8" />
            <stop offset="50%" stopColor="#e8e8e8" />
            <stop offset="70%" stopColor="#d8d8d8" />
            <stop offset="100%" stopColor="#b8b8b8" />
          </linearGradient>
        </defs>

        {/* Dark interior */}
        <rect width="240" height="320" fill="#1a1a2e" />
        <rect x="20" y="20" width="200" height="280" rx="4" fill="#0f0f1a" opacity="0.5" />

        {/* Left panel */}
        <motion.g
          animate={{ x: isOpen ? -125 : 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <rect x="0" y="0" width="120" height="320" fill={`url(#metalGrad-${size})`} />
          <rect x="0" y="0" width="120" height="320" fill="none" stroke="#999" strokeWidth="1.5" />
          <line x1="15" y1="30" x2="105" y2="30" stroke="#aaa" strokeWidth="0.8" />
          <line x1="15" y1="290" x2="105" y2="290" stroke="#aaa" strokeWidth="0.8" />
          <rect x="88" y="145" width="18" height="30" rx="3" fill="#777" />
          <rect x="92" y="155" width="10" height="10" rx="2" fill="#999" />
        </motion.g>

        {/* Right panel */}
        <motion.g
          animate={{ x: isOpen ? 125 : 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <rect x="120" y="0" width="120" height="320" fill={`url(#metalGrad-${size})`} />
          <rect x="120" y="0" width="120" height="320" fill="none" stroke="#999" strokeWidth="1.5" />
          <line x1="135" y1="30" x2="225" y2="30" stroke="#aaa" strokeWidth="0.8" />
          <line x1="135" y1="290" x2="225" y2="290" stroke="#aaa" strokeWidth="0.8" />
          <rect x="134" y="145" width="18" height="30" rx="3" fill="#777" />
          <rect x="138" y="155" width="10" height="10" rx="2" fill="#999" />
        </motion.g>

        {/* Frame overlay */}
        <rect x="0" y="0" width="240" height="320" fill="none" stroke="#666" strokeWidth="3" />
      </svg>
    </div>
  );
}
