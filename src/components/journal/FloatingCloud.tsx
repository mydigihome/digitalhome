import { motion } from "framer-motion";
import { Cloud } from "lucide-react";

interface FloatingCloudProps {
  onClick: () => void;
}

export default function FloatingCloud({ onClick }: FloatingCloudProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-24 right-6 z-40 lg:bottom-8 lg:right-8 flex items-center justify-center rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        width: 60,
        height: 60,
        background: "linear-gradient(135deg, #f0eaff 0%, #e8e0ff 40%, #ddd6fe 70%, #c4b5fd 100%)",
        boxShadow: "0 8px 24px -4px rgba(139,92,246,0.25), 0 4px 8px -2px rgba(139,92,246,0.1)",
      }}
      animate={{
        y: [0, -6, 0],
      }}
      transition={{
        y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
      }}
      whileHover={{
        scale: 1.1,
        boxShadow: "0 12px 32px -4px rgba(139,92,246,0.35), 0 6px 12px -2px rgba(139,92,246,0.15)",
      }}
      whileTap={{ scale: 0.95 }}
      aria-label="Open Journal"
      title="Open Journal"
    >
      {/* Puffy cloud SVG */}
      <svg width="36" height="24" viewBox="0 0 36 24" fill="none">
        <ellipse cx="18" cy="16" rx="14" ry="7" fill="white" fillOpacity="0.9" />
        <ellipse cx="12" cy="12" rx="8" ry="8" fill="white" fillOpacity="0.95" />
        <ellipse cx="22" cy="10" rx="9" ry="9" fill="white" fillOpacity="0.92" />
        <ellipse cx="28" cy="14" rx="6" ry="6" fill="white" fillOpacity="0.88" />
        <ellipse cx="8" cy="15" rx="5" ry="5" fill="white" fillOpacity="0.85" />
      </svg>
    </motion.button>
  );
}
