import { motion } from 'framer-motion';
import woodenDoor from '@/assets/wooden-door.png';

interface TraditionalDoorProps {
  isOpen: boolean;
  size?: 'small' | 'large';
}

export default function TraditionalDoor({ isOpen, size = 'large' }: TraditionalDoorProps) {
  const width = size === 'large' ? 200 : 80;
  const height = size === 'large' ? 280 : 100;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 4 }}>
      <motion.img
        src={woodenDoor}
        alt="Traditional wooden door"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transformOrigin: 'left center',
        }}
        animate={isOpen
          ? { scaleX: 0.15, x: -width * 0.35, skewY: -2, opacity: 0.5 }
          : { scaleX: 1, x: 0, skewY: 0, opacity: 1 }
        }
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}
