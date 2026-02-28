import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Palette, RotateCcw, Timer, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Custom color picker with full spectrum ──────────────────────────
const PALETTE_ROWS = [
  // Row 1: Reds / Pinks
  ["#FF0000", "#E53935", "#D81B60", "#AD1457", "#880E4F", "#FF5252", "#FF1744", "#F50057", "#C51162", "#FF80AB"],
  // Row 2: Oranges / Yellows
  ["#FF6D00", "#FF9100", "#FFAB00", "#FFD600", "#FFEA00", "#FFC107", "#FF8F00", "#F57C00", "#E65100", "#BF360C"],
  // Row 3: Greens
  ["#00E676", "#00C853", "#2E7D32", "#1B5E20", "#4CAF50", "#8BC34A", "#CDDC39", "#76FF03", "#64DD17", "#33691E"],
  // Row 4: Blues / Cyans
  ["#2979FF", "#2962FF", "#0D47A1", "#1565C0", "#1976D2", "#42A5F5", "#00B0FF", "#0091EA", "#00BCD4", "#006064"],
  // Row 5: Purples / Neutrals
  ["#7C4DFF", "#651FFF", "#6200EA", "#AA00FF", "#D500F9", "#E040FB", "#9C27B0", "#4A148C", "#795548", "#3E2723"],
  // Row 6: Pastels
  ["#FFCDD2", "#F8BBD0", "#E1BEE7", "#C5CAE9", "#BBDEFB", "#B2EBF2", "#B2DFDB", "#C8E6C9", "#DCEDC8", "#FFF9C4"],
  // Row 7: Grays / BW
  ["#FFFFFF", "#F5F5F5", "#E0E0E0", "#BDBDBD", "#9E9E9E", "#757575", "#616161", "#424242", "#212121", "#000000"],
];

// ── Complex coloring pages ──────────────────────────────────────────
interface Section {
  id: string;
  d: string;
  fill: string;
}

const makeSections = (list: Omit<Section, "fill">[]): Section[] =>
  list.map((s, i) => ({ ...s, fill: i % 3 === 0 ? "#f5f5f5" : i % 3 === 1 ? "#ebebeb" : "#f0f0f0" }));

const COLORING_PAGES = {
  zenGarden: {
    name: "🧘 Zen Garden",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Ground layers
      { id: "zg1", d: "M0 350 Q125 320 250 350 Q375 380 500 350 L500 500 L0 500 Z" },
      { id: "zg2", d: "M0 380 Q100 360 200 380 Q300 400 400 380 Q450 370 500 380 L500 500 L0 500 Z" },
      { id: "zg3", d: "M0 420 Q125 400 250 420 Q375 440 500 420 L500 500 L0 500 Z" },
      // Zen circles (raked sand)
      { id: "zg4", d: "M250 400 A40 20 0 1 1 250 440 A40 20 0 1 1 250 400" },
      { id: "zg5", d: "M250 390 A55 30 0 1 1 250 450 A55 30 0 1 1 250 390" },
      { id: "zg6", d: "M250 380 A70 40 0 1 1 250 460 A70 40 0 1 1 250 380" },
      // Rock formation left
      { id: "zg7", d: "M80 350 Q60 300 90 280 Q120 260 140 290 Q150 320 130 360 Z" },
      { id: "zg8", d: "M70 360 Q50 330 65 310 Q80 290 100 310 Q110 340 90 370 Z" },
      // Rock formation right
      { id: "zg9", d: "M380 340 Q370 290 400 270 Q430 260 440 300 Q450 340 420 370 Z" },
      { id: "zg10", d: "M400 350 Q390 320 405 300 Q420 290 430 310 Q435 340 415 360 Z" },
      // Bamboo left
      { id: "zg11", d: "M30 350 L35 100 L45 100 L40 350 Z" },
      { id: "zg12", d: "M32 200 C20 180 10 160 15 140 C20 160 25 170 35 195" },
      { id: "zg13", d: "M38 160 C50 140 60 120 55 100 C50 120 45 130 36 155" },
      { id: "zg14", d: "M32 250 C18 230 8 210 12 190 C18 210 24 225 35 245" },
      // Bamboo right
      { id: "zg15", d: "M460 350 L465 80 L475 80 L470 350 Z" },
      { id: "zg16", d: "M462 180 C450 160 440 140 445 120 C450 140 455 155 465 175" },
      { id: "zg17", d: "M468 130 C480 110 490 90 485 70 C480 90 475 105 466 125" },
      // Cherry blossom tree
      { id: "zg18", d: "M240 350 L245 200 L255 200 L260 350 Z" },
      { id: "zg19", d: "M250 210 Q200 180 180 140 Q200 160 230 170 Q210 140 220 100 Q230 130 250 160 Q250 120 270 80 Q270 120 260 160 Q280 130 290 100 Q290 140 270 170 Q300 160 320 140 Q300 180 250 210" },
      // Blossom clusters
      { id: "zg20", d: "M200 140 A15 15 0 1 1 200 170 A15 15 0 1 1 200 140" },
      { id: "zg21", d: "M230 110 A12 12 0 1 1 230 134 A12 12 0 1 1 230 110" },
      { id: "zg22", d: "M270 110 A12 12 0 1 1 270 134 A12 12 0 1 1 270 110" },
      { id: "zg23", d: "M300 140 A15 15 0 1 1 300 170 A15 15 0 1 1 300 140" },
      { id: "zg24", d: "M250 85 A10 10 0 1 1 250 105 A10 10 0 1 1 250 85" },
      { id: "zg25", d: "M215 160 A8 8 0 1 1 215 176 A8 8 0 1 1 215 160" },
      { id: "zg26", d: "M285 160 A8 8 0 1 1 285 176 A8 8 0 1 1 285 160" },
      // Stepping stones
      { id: "zg27", d: "M150 400 A20 10 0 1 1 150 420 A20 10 0 1 1 150 400" },
      { id: "zg28", d: "M200 430 A18 9 0 1 1 200 448 A18 9 0 1 1 200 430" },
      { id: "zg29", d: "M340 410 A20 10 0 1 1 340 430 A20 10 0 1 1 340 410" },
      // Lantern
      { id: "zg30", d: "M470 340 L475 310 L485 310 L490 340 Z" },
      { id: "zg31", d: "M473 310 L477 290 L483 290 L487 310 Z" },
      { id: "zg32", d: "M477 290 L478 280 L482 280 L483 290 Z" },
      // Sky
      { id: "zg33", d: "M0 0 L500 0 L500 80 L0 80 Z" },
      { id: "zg34", d: "M0 80 L500 80 L500 160 L0 160 Z" },
      // Moon
      { id: "zg35", d: "M400 50 A30 30 0 1 1 400 110 A30 30 0 1 1 400 50" },
      // Cloud wisps
      { id: "zg36", d: "M60 60 Q80 40 120 50 Q140 45 160 55 Q140 70 100 65 Q80 70 60 60" },
      { id: "zg37", d: "M280 40 Q300 25 330 35 Q350 30 360 40 Q340 55 310 50 Q290 52 280 40" },
    ]),
  },
  dreamCatcher: {
    name: "🌙 Dream Catcher",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Outer ring
      { id: "dc1", d: "M250 50 A200 200 0 1 1 250 450 A200 200 0 1 1 250 50 M250 70 A180 180 0 1 0 250 430 A180 180 0 1 0 250 70" },
      // Web - radial lines (as thin triangles for fillability)
      { id: "dc2", d: "M250 70 L248 250 L252 250 Z" },
      { id: "dc3", d: "M250 430 L248 250 L252 250 Z" },
      { id: "dc4", d: "M70 250 L250 248 L250 252 Z" },
      { id: "dc5", d: "M430 250 L250 248 L250 252 Z" },
      { id: "dc6", d: "M123 123 L249 249 L251 251 Z" },
      { id: "dc7", d: "M377 377 L249 249 L251 251 Z" },
      { id: "dc8", d: "M377 123 L249 249 L251 251 Z" },
      { id: "dc9", d: "M123 377 L249 249 L251 251 Z" },
      // Concentric web rings
      { id: "dc10", d: "M250 110 A140 140 0 1 1 250 390 A140 140 0 1 1 250 110 M250 125 A125 125 0 1 0 250 375 A125 125 0 1 0 250 125" },
      { id: "dc11", d: "M250 150 A100 100 0 1 1 250 350 A100 100 0 1 1 250 150 M250 165 A85 85 0 1 0 250 335 A85 85 0 1 0 250 165" },
      { id: "dc12", d: "M250 190 A60 60 0 1 1 250 310 A60 60 0 1 1 250 190 M250 205 A45 45 0 1 0 250 295 A45 45 0 1 0 250 205" },
      // Center gem
      { id: "dc13", d: "M250 225 L275 250 L250 275 L225 250 Z" },
      { id: "dc14", d: "M250 230 A20 20 0 1 1 250 270 A20 20 0 1 1 250 230" },
      // Feathers hanging (left)
      { id: "dc15", d: "M150 440 C140 460 130 490 135 500 C140 490 145 475 150 460 Z" },
      { id: "dc16", d: "M150 440 C160 460 170 490 165 500 C160 490 155 475 150 460 Z" },
      { id: "dc17", d: "M148 445 L152 445 L152 500 L148 500 Z" },
      // Feathers (center)
      { id: "dc18", d: "M250 450 C240 470 230 500 235 510 C240 500 245 485 250 470 Z" },
      { id: "dc19", d: "M250 450 C260 470 270 500 265 510 C260 500 255 485 250 470 Z" },
      { id: "dc20", d: "M248 455 L252 455 L252 510 L248 510 Z" },
      // Feathers (right)
      { id: "dc21", d: "M350 440 C340 460 330 490 335 500 C340 490 345 475 350 460 Z" },
      { id: "dc22", d: "M350 440 C360 460 370 490 365 500 C360 490 355 475 350 460 Z" },
      { id: "dc23", d: "M348 445 L352 445 L352 500 L348 500 Z" },
      // Beads on strings
      { id: "dc24", d: "M150 435 A5 5 0 1 1 150 445 A5 5 0 1 1 150 435" },
      { id: "dc25", d: "M250 445 A5 5 0 1 1 250 455 A5 5 0 1 1 250 445" },
      { id: "dc26", d: "M350 435 A5 5 0 1 1 350 445 A5 5 0 1 1 350 435" },
      // Decorative elements in web quadrants
      { id: "dc27", d: "M220 130 L230 145 L210 145 Z" },
      { id: "dc28", d: "M280 130 L290 145 L270 145 Z" },
      { id: "dc29", d: "M320 200 L335 210 L335 190 Z" },
      { id: "dc30", d: "M180 200 L165 210 L165 190 Z" },
      { id: "dc31", d: "M320 300 L335 310 L335 290 Z" },
      { id: "dc32", d: "M180 300 L165 310 L165 290 Z" },
      { id: "dc33", d: "M220 370 L230 355 L210 355 Z" },
      { id: "dc34", d: "M280 370 L290 355 L270 355 Z" },
    ]),
  },
  cosmicMandala: {
    name: "✨ Cosmic Mandala",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Background quadrants
      { id: "cm1", d: "M0 0 L250 0 L250 250 L0 250 Z" },
      { id: "cm2", d: "M250 0 L500 0 L500 250 L250 250 Z" },
      { id: "cm3", d: "M0 250 L250 250 L250 500 L0 500 Z" },
      { id: "cm4", d: "M250 250 L500 250 L500 500 L250 500 Z" },
      // Large outer petals (8)
      { id: "cm5", d: "M250 30 C280 80 290 120 250 160 C210 120 220 80 250 30" },
      { id: "cm6", d: "M470 250 C420 280 380 290 340 250 C380 210 420 220 470 250" },
      { id: "cm7", d: "M250 470 C220 420 210 380 250 340 C290 380 280 420 250 470" },
      { id: "cm8", d: "M30 250 C80 220 120 210 160 250 C120 290 80 280 30 250" },
      // Diagonal petals
      { id: "cm9", d: "M390 110 C350 140 320 150 310 120 C320 90 350 80 390 110" },
      { id: "cm10", d: "M390 390 C350 360 320 350 310 380 C320 410 350 420 390 390" },
      { id: "cm11", d: "M110 390 C140 360 150 320 120 310 C90 320 80 350 110 390" },
      { id: "cm12", d: "M110 110 C140 140 150 180 120 190 C90 180 80 150 110 110" },
      // Medium ring segments (8)
      { id: "cm13", d: "M250 100 A150 150 0 0 1 356 144 L310 190 A100 100 0 0 0 250 160 Z" },
      { id: "cm14", d: "M356 144 A150 150 0 0 1 400 250 L340 250 A100 100 0 0 0 310 190 Z" },
      { id: "cm15", d: "M400 250 A150 150 0 0 1 356 356 L310 310 A100 100 0 0 0 340 250 Z" },
      { id: "cm16", d: "M356 356 A150 150 0 0 1 250 400 L250 340 A100 100 0 0 0 310 310 Z" },
      { id: "cm17", d: "M250 400 A150 150 0 0 1 144 356 L190 310 A100 100 0 0 0 250 340 Z" },
      { id: "cm18", d: "M144 356 A150 150 0 0 1 100 250 L160 250 A100 100 0 0 0 190 310 Z" },
      { id: "cm19", d: "M100 250 A150 150 0 0 1 144 144 L190 190 A100 100 0 0 0 160 250 Z" },
      { id: "cm20", d: "M144 144 A150 150 0 0 1 250 100 L250 160 A100 100 0 0 0 190 190 Z" },
      // Inner petals (8)
      { id: "cm21", d: "M250 160 C265 190 270 210 250 230 C230 210 235 190 250 160" },
      { id: "cm22", d: "M340 250 C310 265 290 270 270 250 C290 230 310 235 340 250" },
      { id: "cm23", d: "M250 340 C235 310 230 290 250 270 C270 290 265 310 250 340" },
      { id: "cm24", d: "M160 250 C190 235 210 230 230 250 C210 270 190 265 160 250" },
      { id: "cm25", d: "M310 190 C290 200 275 205 270 225 C285 210 295 200 310 190" },
      { id: "cm26", d: "M310 310 C290 300 275 295 270 275 C285 290 295 300 310 310" },
      { id: "cm27", d: "M190 310 C210 300 225 295 230 275 C215 290 205 300 190 310" },
      { id: "cm28", d: "M190 190 C210 200 225 205 230 225 C215 210 205 200 190 190" },
      // Center
      { id: "cm29", d: "M250 220 A30 30 0 1 1 250 280 A30 30 0 1 1 250 220" },
      { id: "cm30", d: "M250 230 L265 250 L250 270 L235 250 Z" },
      // Stars scattered
      { id: "cm31", d: "M60 60 L65 50 L70 60 L80 55 L72 65 L80 75 L70 70 L65 80 L60 70 L50 75 L58 65 L50 55 Z" },
      { id: "cm32", d: "M430 70 L435 60 L440 70 L450 65 L442 75 L450 85 L440 80 L435 90 L430 80 L420 85 L428 75 L420 65 Z" },
      { id: "cm33", d: "M60 430 L65 420 L70 430 L80 425 L72 435 L80 445 L70 440 L65 450 L60 440 L50 445 L58 435 L50 425 Z" },
      { id: "cm34", d: "M430 430 L435 420 L440 430 L450 425 L442 435 L450 445 L440 440 L435 450 L430 440 L420 445 L428 435 L420 425 Z" },
    ]),
  },
  tropicalParadise: {
    name: "🌴 Tropical Paradise",
    viewBox: "0 0 500 400",
    sections: makeSections([
      // Sky gradient zones
      { id: "tp1", d: "M0 0 L500 0 L500 60 L0 60 Z" },
      { id: "tp2", d: "M0 60 L500 60 L500 120 L0 120 Z" },
      // Sun
      { id: "tp3", d: "M400 80 A40 40 0 1 1 400 160 A40 40 0 1 1 400 80" },
      // Sun rays
      { id: "tp4", d: "M400 30 L395 70 L405 70 Z" },
      { id: "tp5", d: "M450 60 L430 75 L435 85 Z" },
      { id: "tp6", d: "M460 120 L430 115 L430 125 Z" },
      { id: "tp7", d: "M340 60 L370 75 L365 85 Z" },
      { id: "tp8", d: "M340 120 L370 115 L370 125 Z" },
      // Clouds
      { id: "tp9", d: "M80 50 Q100 30 130 40 Q150 30 170 45 Q160 60 130 55 Q100 60 80 50" },
      { id: "tp10", d: "M220 70 Q240 55 260 65 Q275 55 290 68 Q280 80 260 78 Q240 82 220 70" },
      // Ocean layers
      { id: "tp11", d: "M0 120 Q60 100 120 120 Q180 140 240 120 Q300 100 360 120 Q420 140 500 120 L500 180 L0 180 Z" },
      { id: "tp12", d: "M0 160 Q70 145 140 160 Q210 175 280 160 Q350 145 420 160 Q460 170 500 160 L500 220 L0 220 Z" },
      { id: "tp13", d: "M0 200 Q80 185 160 200 Q240 215 320 200 Q400 185 500 200 L500 260 L0 260 Z" },
      // Island
      { id: "tp14", d: "M120 250 Q150 220 200 230 Q250 220 300 230 Q350 220 380 250 L380 260 L120 260 Z" },
      // Sand beach
      { id: "tp15", d: "M100 260 Q150 250 250 255 Q350 250 400 260 L410 280 L90 280 Z" },
      // Palm tree trunk
      { id: "tp16", d: "M240 260 C235 220 230 180 245 130 C250 180 248 220 255 260 Z" },
      // Palm fronds
      { id: "tp17", d: "M245 130 C210 110 170 100 140 110 C170 105 210 110 245 130" },
      { id: "tp18", d: "M245 130 C220 100 200 70 180 65 C200 75 220 100 245 130" },
      { id: "tp19", d: "M245 130 C270 100 300 80 320 85 C300 85 270 100 245 130" },
      { id: "tp20", d: "M245 130 C280 115 310 110 340 120 C310 112 280 115 245 130" },
      { id: "tp21", d: "M245 130 C250 95 255 65 260 50 C258 65 252 95 245 130" },
      // Second palm
      { id: "tp22", d: "M320 260 C325 230 330 200 325 160 C330 200 328 230 335 260 Z" },
      { id: "tp23", d: "M325 160 C350 140 380 130 400 140 C380 135 350 140 325 160" },
      { id: "tp24", d: "M325 160 C310 130 300 100 290 95 C300 100 310 130 325 160" },
      { id: "tp25", d: "M325 160 C340 130 350 100 360 90 C352 100 342 130 325 160" },
      // Coconuts
      { id: "tp26", d: "M240 135 A6 6 0 1 1 240 147 A6 6 0 1 1 240 135" },
      { id: "tp27", d: "M250 132 A5 5 0 1 1 250 142 A5 5 0 1 1 250 132" },
      // Underwater section
      { id: "tp28", d: "M0 280 L500 280 L500 400 L0 400 Z" },
      // Coral
      { id: "tp29", d: "M80 400 C75 370 65 350 70 330 C80 350 85 340 90 330 C95 350 100 370 95 400 Z" },
      { id: "tp30", d: "M400 400 C395 375 385 360 390 340 C395 355 405 350 410 340 C415 360 420 375 415 400 Z" },
      // Fish
      { id: "tp31", d: "M150 340 C165 330 185 330 195 340 C185 350 165 350 150 340 M195 340 L210 330 L210 350 Z" },
      { id: "tp32", d: "M300 360 C315 350 335 350 345 360 C335 370 315 370 300 360 M345 360 L360 350 L360 370 Z" },
      // Starfish
      { id: "tp33", d: "M250 380 L255 370 L260 380 L270 375 L263 385 L272 392 L260 390 L255 400 L250 390 L238 392 L247 385 L240 375 Z" },
      // Seashell
      { id: "tp34", d: "M180 390 Q190 375 200 390 Q195 395 190 400 Q185 395 180 390" },
      // Bubbles
      { id: "tp35", d: "M130 310 A8 8 0 1 1 130 326 A8 8 0 1 1 130 310" },
      { id: "tp36", d: "M350 320 A6 6 0 1 1 350 332 A6 6 0 1 1 350 320" },
      { id: "tp37", d: "M450 300 A10 10 0 1 1 450 320 A10 10 0 1 1 450 300" },
    ]),
  },
  goalsStar: {
    name: "⭐ Goals Star",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Large star outer
      { id: "gs1", d: "M250 30 L290 180 L450 180 L320 270 L360 430 L250 340 L140 430 L180 270 L50 180 L210 180 Z" },
      // Star inner fill divisions
      { id: "gs2", d: "M250 30 L290 180 L250 200 L210 180 Z" },
      { id: "gs3", d: "M290 180 L450 180 L320 270 L250 200 Z" },
      { id: "gs4", d: "M320 270 L360 430 L250 340 L250 200 Z" },
      { id: "gs5", d: "M250 340 L140 430 L180 270 L250 200 Z" },
      { id: "gs6", d: "M180 270 L50 180 L210 180 L250 200 Z" },
      // Surrounding circles (goals orbiting)
      { id: "gs7", d: "M250 10 A20 20 0 1 1 250 50 A20 20 0 1 1 250 10" },
      { id: "gs8", d: "M460 170 A20 20 0 1 1 460 210 A20 20 0 1 1 460 170" },
      { id: "gs9", d: "M370 430 A20 20 0 1 1 370 470 A20 20 0 1 1 370 430" },
      { id: "gs10", d: "M130 430 A20 20 0 1 1 130 470 A20 20 0 1 1 130 430" },
      { id: "gs11", d: "M30 170 A20 20 0 1 1 30 210 A20 20 0 1 1 30 170" },
      // Radiating lines as thin shapes
      { id: "gs12", d: "M250 50 L248 90 L252 90 Z" },
      { id: "gs13", d: "M440 190 L400 192 L400 188 Z" },
      { id: "gs14", d: "M355 440 L330 410 L335 405 Z" },
      { id: "gs15", d: "M145 440 L170 410 L165 405 Z" },
      { id: "gs16", d: "M50 190 L100 192 L100 188 Z" },
      // Sparkles around
      { id: "gs17", d: "M100 80 L105 70 L110 80 L120 75 L112 85 L120 95 L110 90 L105 100 L100 90 L90 95 L98 85 L90 75 Z" },
      { id: "gs18", d: "M400 80 L405 70 L410 80 L420 75 L412 85 L420 95 L410 90 L405 100 L400 90 L390 95 L398 85 L390 75 Z" },
      { id: "gs19", d: "M80 350 L85 340 L90 350 L100 345 L92 355 L100 365 L90 360 L85 370 L80 360 L70 365 L78 355 L70 345 Z" },
      { id: "gs20", d: "M420 350 L425 340 L430 350 L440 345 L432 355 L440 365 L430 360 L425 370 L420 360 L410 365 L418 355 L410 345 Z" },
      // Inner decorative ring
      { id: "gs21", d: "M250 140 A60 60 0 1 1 250 260 A60 60 0 1 1 250 140 M250 155 A45 45 0 1 0 250 245 A45 45 0 1 0 250 155" },
      // Center diamond
      { id: "gs22", d: "M250 170 L280 200 L250 230 L220 200 Z" },
      { id: "gs23", d: "M250 180 A20 20 0 1 1 250 220 A20 20 0 1 1 250 180" },
      // Corner decorations
      { id: "gs24", d: "M20 20 L60 20 L60 60 L20 60 Z" },
      { id: "gs25", d: "M440 20 L480 20 L480 60 L440 60 Z" },
      { id: "gs26", d: "M20 440 L60 440 L60 480 L20 480 Z" },
      { id: "gs27", d: "M440 440 L480 440 L480 480 L440 480 Z" },
      // Hearts in circles
      { id: "gs28", d: "M245 15 C245 10 250 8 250 15 C250 8 255 10 255 15 C255 22 250 28 250 28 C250 28 245 22 245 15" },
      { id: "gs29", d: "M455 185 C455 180 460 178 460 185 C460 178 465 180 465 185 C465 192 460 198 460 198 C460 198 455 192 455 185" },
    ]),
  },
  underwaterWorld: {
    name: "🐠 Underwater World",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Water layers
      { id: "uw1", d: "M0 0 L500 0 L500 100 L0 100 Z" },
      { id: "uw2", d: "M0 100 L500 100 L500 200 L0 200 Z" },
      { id: "uw3", d: "M0 200 L500 200 L500 300 L0 300 Z" },
      { id: "uw4", d: "M0 300 L500 300 L500 400 L0 400 Z" },
      // Sea floor
      { id: "uw5", d: "M0 400 Q60 380 120 400 Q180 420 240 400 Q300 380 360 400 Q420 420 500 400 L500 500 L0 500 Z" },
      // Large jellyfish
      { id: "uw6", d: "M100 100 Q80 80 100 60 Q120 40 150 60 Q170 40 190 60 Q210 80 190 100 Q150 120 100 100" },
      { id: "uw7", d: "M110 100 C105 130 100 160 110 180" },
      { id: "uw8", d: "M140 105 C135 140 130 170 140 200" },
      { id: "uw9", d: "M170 100 C175 135 180 165 170 190" },
      // Turtle
      { id: "uw10", d: "M300 140 A50 35 0 1 1 300 210 A50 35 0 1 1 300 140" },
      { id: "uw11", d: "M300 150 A35 20 0 1 1 300 190 A35 20 0 1 1 300 150" },
      { id: "uw12", d: "M260 165 L240 155 L245 170 Z" },
      { id: "uw13", d: "M340 160 L355 150 L355 165 Z" },
      { id: "uw14", d: "M270 190 L260 210 L280 205 Z" },
      { id: "uw15", d: "M330 190 L340 210 L320 205 Z" },
      { id: "uw16", d: "M350 175 L370 175 L365 180 Z" },
      // Seahorse
      { id: "uw17", d: "M420 220 C430 200 440 190 440 210 C440 230 430 240 420 250 C410 260 405 270 410 280 C415 290 420 295 415 300 C410 305 405 300 410 290 C415 280 410 270 405 260" },
      { id: "uw18", d: "M420 220 A8 8 0 1 1 420 236 A8 8 0 1 1 420 220" },
      // Large tropical fish
      { id: "uw19", d: "M150 280 C180 260 220 260 240 280 C220 300 180 300 150 280" },
      { id: "uw20", d: "M240 280 L270 265 L270 295 Z" },
      { id: "uw21", d: "M170 275 A5 5 0 1 1 170 285 A5 5 0 1 1 170 275" },
      { id: "uw22", d: "M190 268 L190 292 L220 280 Z" },
      // Octopus
      { id: "uw23", d: "M80 320 A30 25 0 1 1 80 370 A30 25 0 1 1 80 320" },
      { id: "uw24", d: "M55 365 C45 385 40 400 50 410 C55 400 55 385 60 370" },
      { id: "uw25", d: "M70 370 C65 390 60 410 70 420 C75 410 72 390 75 375" },
      { id: "uw26", d: "M85 372 C85 395 85 415 95 420 C95 410 90 395 90 375" },
      { id: "uw27", d: "M100 368 C110 385 115 400 110 415 C105 405 105 390 100 375" },
      // Coral reef
      { id: "uw28", d: "M350 400 C345 370 335 350 340 330 C350 350 355 340 360 330 C365 350 370 370 365 400 Z" },
      { id: "uw29", d: "M380 400 C378 380 372 365 375 350 C380 365 385 358 388 350 C392 365 395 380 390 400 Z" },
      { id: "uw30", d: "M420 400 C415 375 408 360 412 340 C418 355 425 348 428 340 C435 360 438 378 432 400 Z" },
      // Bubbles
      { id: "uw31", d: "M200 150 A12 12 0 1 1 200 174 A12 12 0 1 1 200 150" },
      { id: "uw32", d: "M210 120 A8 8 0 1 1 210 136 A8 8 0 1 1 210 120" },
      { id: "uw33", d: "M195 100 A6 6 0 1 1 195 112 A6 6 0 1 1 195 100" },
      { id: "uw34", d: "M380 300 A10 10 0 1 1 380 320 A10 10 0 1 1 380 300" },
      { id: "uw35", d: "M390 270 A7 7 0 1 1 390 284 A7 7 0 1 1 390 270" },
      // Seaweed
      { id: "uw36", d: "M460 500 C455 470 450 450 455 430 C460 450 465 440 468 430 C472 450 475 470 470 500 Z" },
      { id: "uw37", d: "M30 500 C25 475 20 455 25 440 C30 455 35 448 38 440 C42 458 45 478 40 500 Z" },
      // Treasure chest
      { id: "uw38", d: "M220 430 L280 430 L280 470 L220 470 Z" },
      { id: "uw39", d: "M218 425 Q250 410 282 425 L282 435 L218 435 Z" },
      { id: "uw40", d: "M245 435 L255 435 L255 445 L245 445 Z" },
    ]),
  },
};

type PageKey = keyof typeof COLORING_PAGES;

interface ColoringBookProps {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

// ── Timer display ────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ColoringBook({ open, onClose, onSave }: ColoringBookProps) {
  const [selectedPage, setSelectedPage] = useState<PageKey>("zenGarden");
  const [selectedColor, setSelectedColor] = useState("#7C4DFF");
  const [sectionFills, setSectionFills] = useState<Record<string, Record<string, string>>>({});
  const [customColor, setCustomColor] = useState("#7C4DFF");
  const [undoStack, setUndoStack] = useState<Record<string, Record<string, string>[]>>({});

  // Timer state
  const [timerStarted, setTimerStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const page = COLORING_PAGES[selectedPage];
  const fills = sectionFills[selectedPage] || {};

  // Timer effect
  useEffect(() => {
    if (timerStarted) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerStarted]);

  // Reset timer on page change
  useEffect(() => {
    setTimerStarted(false);
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [selectedPage]);

  const handleSectionClick = useCallback(
    (sectionId: string) => {
      // Start timer on first color drop
      if (!timerStarted) setTimerStarted(true);

      // Push current state to undo stack
      setUndoStack((prev) => ({
        ...prev,
        [selectedPage]: [...(prev[selectedPage] || []), { ...(sectionFills[selectedPage] || {}) }],
      }));

      setSectionFills((prev) => ({
        ...prev,
        [selectedPage]: {
          ...(prev[selectedPage] || {}),
          [sectionId]: selectedColor,
        },
      }));
    },
    [selectedColor, selectedPage, sectionFills, timerStarted]
  );

  const handleUndo = () => {
    const stack = undoStack[selectedPage] || [];
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    setSectionFills((s) => ({ ...s, [selectedPage]: prev }));
    setUndoStack((s) => ({ ...s, [selectedPage]: stack.slice(0, -1) }));
  };

  const resetPage = () => {
    setSectionFills((prev) => ({ ...prev, [selectedPage]: {} }));
    setUndoStack((prev) => ({ ...prev, [selectedPage]: [] }));
    setTimerStarted(false);
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSave = () => {
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
      onSave(canvas.toDataURL("image/png"));
      onClose();
    };
    img.src = url;
  };

  const filledCount = Object.keys(fills).length;
  const totalCount = page.sections.length;
  const progress = Math.round((filledCount / totalCount) * 100);

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
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Coloring Book</h3>
              {/* Timer */}
              <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono ${timerStarted ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                <Timer className="h-3.5 w-3.5" />
                {formatTime(elapsed)}
              </div>
              {/* Progress */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{progress}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="ghost" onClick={handleUndo} disabled={!(undoStack[selectedPage]?.length)}>
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={resetPage}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Download className="mr-1 h-3.5 w-3.5" />
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
          <div className="border-b border-border px-4 py-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">Color</span>
              {/* Custom color input */}
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setSelectedColor(e.target.value);
                  }}
                  className="h-7 w-7 cursor-pointer rounded-full border-0 p-0 appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-2 [&::-webkit-color-swatch]:border-border"
                />
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1 overflow-x-auto">
                {PALETTE_ROWS.flat().slice(0, 20).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className="h-5 w-5 shrink-0 rounded-full border transition-all hover:scale-125"
                    style={{
                      backgroundColor: c,
                      borderColor: selectedColor === c ? "hsl(var(--foreground))" : c === "#FFFFFF" ? "#ddd" : "transparent",
                      boxShadow: selectedColor === c ? "0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--foreground))" : "none",
                    }}
                  />
                ))}
              </div>
            </div>
            {/* Expanded palette rows */}
            <details className="group">
              <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground select-none">
                Show full palette ▸
              </summary>
              <div className="mt-1.5 space-y-1">
                {PALETTE_ROWS.map((row, ri) => (
                  <div key={ri} className="flex items-center gap-0.5">
                    {row.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className="h-5 w-5 shrink-0 rounded-sm border transition-all hover:scale-125"
                        style={{
                          backgroundColor: c,
                          borderColor: selectedColor === c ? "hsl(var(--foreground))" : c === "#FFFFFF" ? "#ddd" : "transparent",
                          boxShadow: selectedColor === c ? "0 0 0 2px hsl(var(--background)), 0 0 0 3px hsl(var(--foreground))" : "none",
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </details>
          </div>

          {/* SVG Canvas */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-secondary/30">
            <svg
              id="coloring-svg"
              viewBox={page.viewBox}
              className="max-h-full max-w-full drop-shadow-lg"
              style={{ width: "min(90vw, 650px)", height: "auto", background: "white", borderRadius: 12 }}
            >
              <rect width="100%" height="100%" fill="white" rx="12" />
              {page.sections.map((section) => (
                <path
                  key={section.id}
                  d={section.d}
                  fill={fills[section.id] || section.fill}
                  stroke="#bbb"
                  strokeWidth="0.8"
                  className="cursor-pointer transition-colors duration-150"
                  style={{ filter: fills[section.id] ? "none" : "brightness(1)" }}
                  onClick={() => handleSectionClick(section.id)}
                  onMouseEnter={(e) => {
                    if (!fills[section.id]) (e.target as SVGPathElement).style.opacity = "0.7";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as SVGPathElement).style.opacity = "1";
                  }}
                />
              ))}
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
