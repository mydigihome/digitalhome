import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Heart } from "lucide-react";
import myWhy1 from "@/assets/my-why-1.jpg";
import myWhy2 from "@/assets/my-why-2.jpg";
import myWhy3 from "@/assets/my-why-3.jpg";
import myWhy4 from "@/assets/my-why-4.jpg";
import myWhy5 from "@/assets/my-why-5.jpg";

const PLACEHOLDER_IMAGES = [
  { src: myWhy1, label: "Cover story era", objectPosition: "center 20%" },
  { src: myWhy2, label: "Private aviation lifestyle", objectPosition: "center center" },
  { src: myWhy3, label: "Luxury taste, legacy mindset", objectPosition: "center center" },
  { src: myWhy4, label: "Dream garage", objectPosition: "center 60%" },
  { src: myWhy5, label: "No risk, no Porsche", objectPosition: "center 30%" },
];

export default function MyWhyCard() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PLACEHOLDER_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = PLACEHOLDER_IMAGES[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-border bg-card/70 dark:bg-card/50 backdrop-blur-xl"
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={current.src}
            alt={current.label}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: current.objectPosition || "center center" }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                My Why
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm font-semibold text-white"
              >
                {current.label}
              </motion.p>
            </AnimatePresence>
          </div>
          <button className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors">
            <Pencil className="w-3.5 h-3.5 text-white/80" />
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 py-2.5">
        {PLACEHOLDER_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === currentIndex
                ? "w-5 bg-primary"
                : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
