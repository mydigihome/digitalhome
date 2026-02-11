import { useState, useEffect, useMemo } from "react";
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
    url: "https://nbblxjnnihsgftqbfmfr.supabase.co/storage/v1/object/public/Icons/IMG_3333-removebg-preview.png",
    label: "Home",
    glowColor: "rgba(139,168,163,0.5)",
  },
  {
    name: "coffee",
    url: "https://nbblxjnnihsgftqbfmfr.supabase.co/storage/v1/object/public/Icons/image-removebg-preview-2.png",
    label: "Coffee Break",
    glowColor: "rgba(218,180,141,0.5)",
  },
  {
    name: "bread",
    url: "https://nbblxjnnihsgftqbfmfr.supabase.co/storage/v1/object/public/Icons/image-removebg-preview.png",
    label: "Fresh Bread",
    glowColor: "rgba(234,169,110,0.5)",
  },
  {
    name: "ramen",
    url: "https://nbblxjnnihsgftqbfmfr.supabase.co/storage/v1/object/public/Icons/IMG_3343-removebg-preview.png",
    label: "Ramen Bowl",
    glowColor: "rgba(255,160,80,0.5)",
  },
  {
    name: "lamp",
    url: "https://nbblxjnnihsgftqbfmfr.supabase.co/storage/v1/object/public/Icons/IMG_3349-removebg-preview.png",
    label: "Lamp",
    glowColor: "rgba(255,210,90,0.5)",
  },
];

export function getTimeBasedIcon(hour: number): IconDef {
  if (hour >= 5 && hour < 9) return ICONS[4]; // lamp (morning)
  if (hour >= 9 && hour < 12) return ICONS[1]; // coffee (late morning)
  if (hour >= 12 && hour < 15) return ICONS[2]; // bread (lunch)
  if (hour >= 15 && hour < 18) return ICONS[0]; // house (afternoon)
  if (hour >= 18 && hour < 22) return ICONS[3]; // ramen (dinner)
  return ICONS[4]; // lamp (night)
}

export function useAnimatedIcon() {
  const [currentIcon, setCurrentIcon] = useState<IconDef>(() =>
    getTimeBasedIcon(new Date().getHours())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      setCurrentIcon(getTimeBasedIcon(hour));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return currentIcon;
}

export function AnimatedIconImage({
  icon,
  size = 64,
}: {
  icon: IconDef;
  size?: number;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.img
        key={icon.name}
        src={icon.url}
        alt={icon.label}
        width={size}
        height={size}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ objectFit: "contain" }}
        draggable={false}
      />
    </AnimatePresence>
  );
}
