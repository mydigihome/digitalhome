import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface IconDef {
  name: string;
  url: string;
  label: string;
  glowColor: string;
}

export const ICONS: IconDef[] = [
  {
    name: "house",
    url: "https://nbblxjnnihsgftqbfmfr.supabase.co/storage/v1/object/public/Icons/image-removebg-preview-3.png",
    label: "House",
    glowColor: "rgba(139,168,163,0.5)",
  },
  {
    name: "coffee",
    url: "https://nbblxjnnihsgftqbfmfr.supabase.co/storage/v1/object/public/Icons/image-removebg-preview-2.png",
    label: "Coffee",
    glowColor: "rgba(218,180,141,0.5)",
  },
  {
    name: "bread",
    url: "https://nbblxjnnihsgftqbfmfr.supabase.co/storage/v1/object/public/Icons/image-removebg-preview.png",
    label: "Bread",
    glowColor: "rgba(234,169,110,0.5)",
  },
  {
    name: "ramen",
    url: "https://nbblxjnnihsgftqbfmfr.supabase.co/storage/v1/object/public/Icons/IMG_3343-removebg-preview.png",
    label: "Ramen",
    glowColor: "rgba(255,160,80,0.5)",
  },
  {
    name: "lamp",
    url: "https://nbblxjnnihsgftqbfmfr.supabase.co/storage/v1/object/public/Icons/IMG_3349-removebg-preview.png",
    label: "Lamp",
    glowColor: "rgba(255,210,90,0.5)",
  },
];

export function useAnimatedIcon() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ICONS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return { icon: ICONS[currentIndex], index: currentIndex };
}

export function AnimatedIconImage({
  icon,
  size = 64,
  index,
}: {
  icon: IconDef;
  size?: number;
  index?: number;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.img
        key={index ?? icon.name}
        src={icon.url}
        alt={icon.label}
        width={size}
        height={size}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="icon-float"
        style={{ objectFit: "contain" }}
        draggable={false}
      />
    </AnimatePresence>
  );
}
