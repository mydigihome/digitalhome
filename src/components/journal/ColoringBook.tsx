import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const FILL_COLORS = [
  "#7C3AED", "#EC4899", "#3B82F6", "#10B981", "#F59E0B",
  "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16",
  "#A855F7", "#FB923C", "#38BDF8", "#4ADE80", "#FBBF24",
];

interface Section {
  id: string;
  d: string;
  fill: string;
}

// Mandala-style coloring page with fillable sections
const COLORING_PAGES = {
  mandala: {
    name: "Mandala",
    viewBox: "0 0 400 400",
    sections: [
      { id: "m1", d: "M200 50 L250 150 L200 200 L150 150 Z", fill: "#f5f5f5" },
      { id: "m2", d: "M250 150 L350 200 L200 200 Z", fill: "#ebebeb" },
      { id: "m3", d: "M350 200 L250 250 L200 200 Z", fill: "#f5f5f5" },
      { id: "m4", d: "M250 250 L200 350 L200 200 Z", fill: "#ebebeb" },
      { id: "m5", d: "M200 350 L150 250 L200 200 Z", fill: "#f5f5f5" },
      { id: "m6", d: "M150 250 L50 200 L200 200 Z", fill: "#ebebeb" },
      { id: "m7", d: "M50 200 L150 150 L200 200 Z", fill: "#f5f5f5" },
      { id: "m8", d: "M200 50 L150 150 L200 200 Z", fill: "#ebebeb" },
      // Outer petals
      { id: "m9", d: "M200 20 L230 80 L200 50 L170 80 Z", fill: "#f0f0f0" },
      { id: "m10", d: "M380 200 L320 230 L350 200 L320 170 Z", fill: "#f0f0f0" },
      { id: "m11", d: "M200 380 L170 320 L200 350 L230 320 Z", fill: "#f0f0f0" },
      { id: "m12", d: "M20 200 L80 170 L50 200 L80 230 Z", fill: "#f0f0f0" },
      // Inner ring
      { id: "m13", d: "M200 130 A70 70 0 0 1 270 200 L200 200 Z", fill: "#e8e8e8" },
      { id: "m14", d: "M270 200 A70 70 0 0 1 200 270 L200 200 Z", fill: "#f2f2f2" },
      { id: "m15", d: "M200 270 A70 70 0 0 1 130 200 L200 200 Z", fill: "#e8e8e8" },
      { id: "m16", d: "M130 200 A70 70 0 0 1 200 130 L200 200 Z", fill: "#f2f2f2" },
    ] as Section[],
  },
  flower: {
    name: "Flower",
    viewBox: "0 0 400 400",
    sections: [
      // Petals
      { id: "f1", d: "M200 200 C200 140 160 80 200 60 C240 80 200 140 200 200", fill: "#f5f5f5" },
      { id: "f2", d: "M200 200 C260 200 320 160 340 200 C320 240 260 200 200 200", fill: "#ebebeb" },
      { id: "f3", d: "M200 200 C200 260 240 320 200 340 C160 320 200 260 200 200", fill: "#f5f5f5" },
      { id: "f4", d: "M200 200 C140 200 80 240 60 200 C80 160 140 200 200 200", fill: "#ebebeb" },
      // Diagonal petals
      { id: "f5", d: "M200 200 C230 170 290 110 310 90 C290 130 230 170 200 200", fill: "#f0f0f0" },
      { id: "f6", d: "M200 200 C230 230 290 290 310 310 C270 290 230 230 200 200", fill: "#e8e8e8" },
      { id: "f7", d: "M200 200 C170 230 110 290 90 310 C110 270 170 230 200 200", fill: "#f0f0f0" },
      { id: "f8", d: "M200 200 C170 170 110 110 90 90 C130 110 170 170 200 200", fill: "#e8e8e8" },
      // Center
      { id: "f9", d: "M200 175 A25 25 0 1 1 200 225 A25 25 0 1 1 200 175", fill: "#f2f2f2" },
      // Leaves
      { id: "f10", d: "M200 340 C180 360 160 390 200 400 C240 390 220 360 200 340", fill: "#f0f0f0" },
      { id: "f11", d: "M160 350 C130 370 100 380 110 400 C140 390 160 370 160 350", fill: "#e8e8e8" },
    ] as Section[],
  },
  butterfly: {
    name: "Butterfly",
    viewBox: "0 0 400 400",
    sections: [
      // Left wing upper
      { id: "b1", d: "M200 200 C160 160 60 100 40 140 C60 180 160 180 200 200", fill: "#f5f5f5" },
      { id: "b2", d: "M200 200 C160 180 60 180 40 140 C20 180 80 220 200 200", fill: "#ebebeb" },
      // Right wing upper
      { id: "b3", d: "M200 200 C240 160 340 100 360 140 C340 180 240 180 200 200", fill: "#f5f5f5" },
      { id: "b4", d: "M200 200 C240 180 340 180 360 140 C380 180 320 220 200 200", fill: "#ebebeb" },
      // Left wing lower
      { id: "b5", d: "M200 200 C160 220 80 280 60 260 C80 240 160 220 200 200", fill: "#f0f0f0" },
      { id: "b6", d: "M200 200 C160 240 80 300 100 320 C140 300 180 240 200 200", fill: "#e8e8e8" },
      // Right wing lower
      { id: "b7", d: "M200 200 C240 220 320 280 340 260 C320 240 240 220 200 200", fill: "#f0f0f0" },
      { id: "b8", d: "M200 200 C240 240 320 300 300 320 C260 300 220 240 200 200", fill: "#e8e8e8" },
      // Body
      { id: "b9", d: "M195 140 L205 140 L205 280 L195 280 Z", fill: "#f2f2f2" },
      // Head
      { id: "b10", d: "M200 130 A12 12 0 1 1 200 154 A12 12 0 1 1 200 130", fill: "#f0f0f0" },
      // Wing details
      { id: "b11", d: "M120 150 A20 20 0 1 1 120 190 A20 20 0 1 1 120 150", fill: "#f5f5f5" },
      { id: "b12", d: "M280 150 A20 20 0 1 1 280 190 A20 20 0 1 1 280 150", fill: "#f5f5f5" },
    ] as Section[],
  },
  ocean: {
    name: "Ocean Wave",
    viewBox: "0 0 400 300",
    sections: [
      // Sky sections
      { id: "o1", d: "M0 0 L200 0 L200 80 L0 80 Z", fill: "#f0f0f0" },
      { id: "o2", d: "M200 0 L400 0 L400 80 L200 80 Z", fill: "#e8e8e8" },
      // Sun
      { id: "o3", d: "M320 50 A30 30 0 1 1 320 110 A30 30 0 1 1 320 50", fill: "#f5f5f5" },
      // Waves
      { id: "o4", d: "M0 80 Q50 60 100 80 Q150 100 200 80 Q250 60 300 80 Q350 100 400 80 L400 140 L0 140 Z", fill: "#ebebeb" },
      { id: "o5", d: "M0 120 Q60 100 120 120 Q180 140 240 120 Q300 100 360 120 Q380 130 400 120 L400 180 L0 180 Z", fill: "#f0f0f0" },
      { id: "o6", d: "M0 160 Q80 140 160 160 Q240 180 320 160 Q360 150 400 160 L400 220 L0 220 Z", fill: "#e8e8e8" },
      // Seabed
      { id: "o7", d: "M0 200 Q100 190 200 200 Q300 210 400 200 L400 300 L0 300 Z", fill: "#f2f2f2" },
      // Fish
      { id: "o8", d: "M100 240 L130 230 L130 250 Z", fill: "#f5f5f5" },
      { id: "o9", d: "M250 220 L280 210 L280 230 Z", fill: "#ebebeb" },
      // Seaweed
      { id: "o10", d: "M60 300 C55 270 65 250 60 230 C65 250 75 270 70 300 Z", fill: "#f0f0f0" },
      { id: "o11", d: "M340 300 C335 275 345 255 340 240 C345 255 355 275 350 300 Z", fill: "#f0f0f0" },
    ] as Section[],
  },
};

type PageKey = keyof typeof COLORING_PAGES;

interface ColoringBookProps {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export default function ColoringBook({ open, onClose, onSave }: ColoringBookProps) {
  const [selectedPage, setSelectedPage] = useState<PageKey>("mandala");
  const [selectedColor, setSelectedColor] = useState(FILL_COLORS[0]);
  const [sectionFills, setSectionFills] = useState<Record<string, Record<string, string>>>({});

  const page = COLORING_PAGES[selectedPage];
  const fills = sectionFills[selectedPage] || {};

  const handleSectionClick = (sectionId: string) => {
    setSectionFills((prev) => ({
      ...prev,
      [selectedPage]: {
        ...(prev[selectedPage] || {}),
        [sectionId]: selectedColor,
      },
    }));
  };

  const resetPage = () => {
    setSectionFills((prev) => ({ ...prev, [selectedPage]: {} }));
  };

  const handleSave = () => {
    // Render SVG to canvas, then to data URL
    const svgEl = document.getElementById("coloring-svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 800, 800);
      ctx.drawImage(img, 0, 0, 800, 800);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
      onClose();
    };
    img.src = url;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Coloring Book</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={resetPage}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Save
              </Button>
              <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Page selector */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 overflow-x-auto">
            {(Object.keys(COLORING_PAGES) as PageKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedPage(key)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedPage === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {COLORING_PAGES[key].name}
              </button>
            ))}
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 overflow-x-auto">
            <span className="text-xs text-muted-foreground shrink-0">Pick color:</span>
            {FILL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className="h-7 w-7 shrink-0 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: selectedColor === c ? "hsl(var(--foreground))" : "transparent",
                }}
              />
            ))}
          </div>

          {/* SVG Canvas */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <svg
              id="coloring-svg"
              viewBox={page.viewBox}
              className="max-h-full max-w-full"
              style={{ width: "min(90vw, 600px)", height: "auto" }}
            >
              <rect width="100%" height="100%" fill="white" />
              {page.sections.map((section) => (
                <path
                  key={section.id}
                  d={section.d}
                  fill={fills[section.id] || section.fill}
                  stroke="#999"
                  strokeWidth="1"
                  className="cursor-pointer transition-colors hover:opacity-80"
                  onClick={() => handleSectionClick(section.id)}
                />
              ))}
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
