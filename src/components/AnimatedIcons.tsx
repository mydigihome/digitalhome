import { motion } from "framer-motion";

export function RamenIcon({ size = 72 }: { size?: number }) {
  const s = size / 72;
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      {/* Steam wisps */}
      {[0, 0.6, 1.2].map((delay, i) => (
        <motion.path
          key={i}
          d={`M${28 + i * 8} 22 Q${30 + i * 8} 16 ${28 + i * 8} 10`}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity={0}
          animate={{
            opacity: [0, 0.5, 0],
            y: [0, -12, -20],
            x: [0, i % 2 === 0 ? 3 : -3, 0],
          }}
          transition={{ duration: 2, delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      {/* Bowl */}
      <ellipse cx="36" cy="46" rx="22" ry="8" fill="#6B3E26" />
      <path d="M14 42 C14 42 16 58 36 58 C56 58 58 42 58 42 Z" fill="#E8834A" />
      <ellipse cx="36" cy="42" rx="22" ry="8" fill="#C4622D" />
      {/* Noodles */}
      <path d="M22 42 Q28 38 34 42 Q40 46 46 42" stroke="#F5E6CC" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M26 40 Q32 36 38 40 Q44 44 50 40" stroke="#F5E6CC" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Egg */}
      <ellipse cx="44" cy="39" rx="5" ry="3.5" fill="#F9E784" />
      <ellipse cx="44" cy="39" rx="2.5" ry="1.8" fill="#FFF3C4" />
      {/* Green onion */}
      <circle cx="28" cy="38" r="2.5" fill="#7BC67E" />
      <circle cx="32" cy="40" r="2" fill="#7BC67E" />
    </svg>
  );
}

export function HouseAnimIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      {/* Chimney smoke */}
      {[0, 0.8, 1.6].map((delay, i) => (
        <motion.circle
          key={i}
          cx={50 + i * 2}
          cy={14}
          r={2.5}
          fill="#9CA3AF"
          opacity={0}
          animate={{
            opacity: [0, 0.3, 0],
            y: [0, -10, -18],
            scale: [0.5, 1.2, 1.5],
          }}
          transition={{ duration: 3, delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      {/* Chimney */}
      <rect x="46" y="16" width="8" height="14" rx="1" fill="#374151" />
      {/* Roof */}
      <path d="M12 34 L36 14 L60 34 Z" fill="#6D28D9" />
      <path d="M36 14 L60 34 L48 34 Z" fill="#5B21B6" />
      {/* Walls */}
      <rect x="18" y="34" width="36" height="26" fill="#FAFAFA" />
      <rect x="36" y="34" width="18" height="26" fill="#F0F0F0" />
      {/* Door */}
      <rect x="30" y="44" width="12" height="16" rx="1" fill="#8B5CF6" />
      <circle cx="39" cy="52" r="1.2" fill="#D4A96A" />
      {/* Windows with glow */}
      <rect x="21" y="38" width="7" height="6" rx="1" fill="#BAE6FD" />
      <motion.rect
        x="21" y="38" width="7" height="6" rx="1" fill="#FDE68A"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <rect x="44" y="38" width="7" height="6" rx="1" fill="#BAE6FD" />
      <motion.rect
        x="44" y="38" width="7" height="6" rx="1" fill="#FDE68A"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4, delay: 1, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

export function LampIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      {/* Light glow */}
      <motion.ellipse
        cx="36" cy="24" rx="18" ry="14"
        fill="url(#lampGlow)"
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <defs>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF9E6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFF9E6" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Shade */}
      <motion.g
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "36px 20px" }}
      >
        <path d="M24 28 L36 12 L48 28 Z" fill="#F5F0E8" stroke="#E5DDD0" strokeWidth="1" />
        {/* Bulb */}
        <circle cx="36" cy="28" r="3" fill="#FFF9E6" />
      </motion.g>
      {/* Pole */}
      <rect x="34.5" y="28" width="3" height="30" rx="1.5" fill="#D4A96A" />
      {/* Base */}
      <ellipse cx="36" cy="60" rx="10" ry="3" fill="#8B6914" />
      <ellipse cx="36" cy="59" rx="8" ry="2" fill="#D4A96A" />
    </svg>
  );
}
