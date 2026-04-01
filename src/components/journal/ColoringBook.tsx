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
  seaTurtle: {
    name: "🐢 Sea Turtle",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Shell (main dome)
      { id: "st1", d: "M150 200 Q150 120 250 100 Q350 120 350 200 Q350 280 250 300 Q150 280 150 200" },
      // Shell pattern segments
      { id: "st2", d: "M200 130 Q220 110 250 108 Q280 110 300 130 L280 170 Q250 150 220 170 Z" },
      { id: "st3", d: "M165 170 Q180 140 200 130 L220 170 Q200 190 180 200 Z" },
      { id: "st4", d: "M300 130 Q320 140 335 170 L320 200 Q300 190 280 170 Z" },
      { id: "st5", d: "M155 210 Q160 185 180 200 L200 240 Q180 260 160 260 Z" },
      { id: "st6", d: "M220 170 Q250 155 280 170 L270 220 Q250 200 230 220 Z" },
      { id: "st7", d: "M320 200 Q340 185 345 210 L340 260 Q320 260 300 240 Z" },
      { id: "st8", d: "M160 260 Q170 275 200 285 L200 240 Q180 260 160 260" },
      { id: "st9", d: "M230 220 Q250 205 270 220 L260 270 Q250 260 240 270 Z" },
      { id: "st10", d: "M300 240 Q330 260 340 260 Q340 275 320 285 L300 240" },
      { id: "st11", d: "M200 285 Q225 295 250 298 Q275 295 300 285 L260 270 Q250 280 240 270 Z" },
      // Head
      { id: "st12", d: "M250 100 Q240 70 230 55 Q240 45 250 42 Q260 45 270 55 Q260 70 250 100" },
      { id: "st13", d: "M243 58 A4 4 0 1 1 243 66 A4 4 0 1 1 243 58" },
      { id: "st14", d: "M257 58 A4 4 0 1 1 257 66 A4 4 0 1 1 257 58" },
      // Flippers
      { id: "st15", d: "M150 180 Q100 140 80 160 Q70 180 110 200 Q130 200 150 200" },
      { id: "st16", d: "M350 180 Q400 140 420 160 Q430 180 390 200 Q370 200 350 200" },
      { id: "st17", d: "M180 280 Q140 320 130 340 Q140 350 170 330 Q190 310 200 290" },
      { id: "st18", d: "M320 280 Q360 320 370 340 Q360 350 330 330 Q310 310 300 290" },
      // Tail
      { id: "st19", d: "M250 300 Q248 330 240 350 Q250 345 260 350 Q252 330 250 300" },
      // Water bubbles
      { id: "st20", d: "M100 100 A12 12 0 1 1 100 124 A12 12 0 1 1 100 100" },
      { id: "st21", d: "M380 80 A10 10 0 1 1 380 100 A10 10 0 1 1 380 80" },
      { id: "st22", d: "M420 260 A8 8 0 1 1 420 276 A8 8 0 1 1 420 260" },
      // Seaweed
      { id: "st23", d: "M60 500 C55 460 50 430 55 400 C60 420 68 410 70 400 C75 430 78 460 72 500 Z" },
      { id: "st24", d: "M420 500 C415 470 410 440 415 410 C420 430 428 420 430 410 C435 440 438 470 432 500 Z" },
      // Ocean floor
      { id: "st25", d: "M0 420 Q60 400 120 420 Q180 440 250 420 Q320 400 380 420 Q440 440 500 420 L500 500 L0 500 Z" },
      // Coral
      { id: "st26", d: "M180 500 C175 470 170 450 175 430 C180 445 188 440 190 430 C195 450 198 470 192 500 Z" },
      { id: "st27", d: "M320 500 C315 475 308 460 312 440 C318 455 325 450 328 440 C335 460 338 478 332 500 Z" },
      // Small fish
      { id: "st28", d: "M60 300 C75 290 95 290 105 300 C95 310 75 310 60 300 M105 300 L120 290 L120 310 Z" },
      { id: "st29", d: "M380 360 C395 350 415 350 425 360 C415 370 395 370 380 360 M425 360 L440 350 L440 370 Z" },
    ]),
  },
  mandalaElephant: {
    name: "🐘 Elephant Mandala",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Head dome
      { id: "me1", d: "M170 200 Q170 100 250 80 Q330 100 330 200 Q330 240 310 260 Q250 280 190 260 Q170 240 170 200" },
      // Ears
      { id: "me2", d: "M170 170 Q120 140 100 180 Q90 220 120 250 Q150 260 170 230" },
      { id: "me3", d: "M330 170 Q380 140 400 180 Q410 220 380 250 Q350 260 330 230" },
      // Inner ears
      { id: "me4", d: "M155 180 Q130 165 120 190 Q115 215 135 235 Q150 240 160 220" },
      { id: "me5", d: "M345 180 Q370 165 380 190 Q385 215 365 235 Q350 240 340 220" },
      // Eyes
      { id: "me6", d: "M215 180 A12 12 0 1 1 215 204 A12 12 0 1 1 215 180" },
      { id: "me7", d: "M285 180 A12 12 0 1 1 285 204 A12 12 0 1 1 285 180" },
      // Forehead decoration
      { id: "me8", d: "M230 120 Q250 100 270 120 L260 145 Q250 135 240 145 Z" },
      { id: "me9", d: "M250 108 A8 8 0 1 1 250 124 A8 8 0 1 1 250 108" },
      // Crown/headdress
      { id: "me10", d: "M200 95 Q210 70 230 75 Q240 60 250 55 Q260 60 270 75 Q290 70 300 95 L270 90 Q260 80 250 78 Q240 80 230 90 Z" },
      // Trunk
      { id: "me11", d: "M235 240 Q230 280 225 320 Q220 360 230 380 Q240 390 250 385 Q260 390 270 380 Q280 360 275 320 Q270 280 265 240" },
      // Trunk rings
      { id: "me12", d: "M232 270 Q250 260 268 270 Q250 280 232 270" },
      { id: "me13", d: "M228 310 Q250 300 272 310 Q250 320 228 310" },
      { id: "me14", d: "M225 350 Q250 340 275 350 Q250 360 225 350" },
      // Tusks
      { id: "me15", d: "M220 245 Q200 270 195 300 Q200 305 210 295 Q215 270 225 250" },
      { id: "me16", d: "M280 245 Q300 270 305 300 Q300 305 290 295 Q285 270 275 250" },
      // Body (decorative mandala pattern below)
      { id: "me17", d: "M150 380 Q150 330 190 300 Q250 280 310 300 Q350 330 350 380 Q350 420 330 450 Q250 480 170 450 Q150 420 150 380" },
      // Mandala circles on body
      { id: "me18", d: "M250 340 A30 30 0 1 1 250 400 A30 30 0 1 1 250 340" },
      { id: "me19", d: "M250 350 A20 20 0 1 1 250 390 A20 20 0 1 1 250 350" },
      { id: "me20", d: "M250 360 L265 370 L250 380 L235 370 Z" },
      // Side decorations
      { id: "me21", d: "M185 360 A15 15 0 1 1 185 390 A15 15 0 1 1 185 360" },
      { id: "me22", d: "M315 360 A15 15 0 1 1 315 390 A15 15 0 1 1 315 360" },
      // Feet
      { id: "me23", d: "M175 450 Q170 470 180 480 Q195 485 200 470 Q200 460 195 450" },
      { id: "me24", d: "M305 450 Q300 470 310 480 Q325 485 330 470 Q330 460 325 450" },
      // Mandala border petals
      { id: "me25", d: "M250 20 C265 40 270 55 250 70 C230 55 235 40 250 20" },
      { id: "me26", d: "M60 250 C80 235 95 230 110 250 C95 270 80 265 60 250" },
      { id: "me27", d: "M440 250 C420 235 405 230 390 250 C405 270 420 265 440 250" },
      { id: "me28", d: "M100 100 C120 110 125 125 110 140 C95 125 90 110 100 100" },
      { id: "me29", d: "M400 100 C380 110 375 125 390 140 C405 125 410 110 400 100" },
    ]),
  },
  lionMane: {
    name: "🦁 Lion",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Mane outer ring (petals)
      { id: "lm1", d: "M250 40 C270 60 275 80 250 100 C225 80 230 60 250 40" },
      { id: "lm2", d: "M310 55 C325 80 325 100 300 110 C285 90 290 70 310 55" },
      { id: "lm3", d: "M360 90 C370 115 365 135 340 140 C330 120 340 100 360 90" },
      { id: "lm4", d: "M390 140 C395 170 385 185 360 185 C355 165 365 150 390 140" },
      { id: "lm5", d: "M400 200 C398 230 385 245 360 240 C360 220 370 205 400 200" },
      { id: "lm6", d: "M395 260 C388 290 370 300 350 290 C355 270 365 258 395 260" },
      { id: "lm7", d: "M370 315 C358 340 340 348 325 335 C335 318 345 308 370 315" },
      { id: "lm8", d: "M335 360 C318 380 298 382 290 365 C305 355 318 350 335 360" },
      { id: "lm9", d: "M280 385 C265 400 245 400 240 385 C255 378 268 378 280 385" },
      { id: "lm10", d: "M210 380 C195 395 180 390 175 375 C190 370 200 372 210 380" },
      { id: "lm11", d: "M170 350 C155 365 140 358 138 340 C155 340 165 342 170 350" },
      { id: "lm12", d: "M145 310 C130 325 115 315 115 295 C130 300 140 305 145 310" },
      { id: "lm13", d: "M120 260 C105 270 95 260 98 242 C112 248 118 255 120 260" },
      { id: "lm14", d: "M110 205 Q95 215 95 200 Q98 180 115 185 Q118 195 110 205" },
      { id: "lm15", d: "M118 150 Q105 155 105 140 Q110 125 125 135 Q125 145 118 150" },
      { id: "lm16", d: "M145 105 Q135 105 138 90 Q145 78 158 90 Q155 100 145 105" },
      { id: "lm17", d: "M190 65 Q180 60 185 48 Q195 40 205 52 Q200 60 190 65" },
      // Face
      { id: "lm18", d: "M180 160 Q180 120 250 110 Q320 120 320 160 Q320 260 300 300 Q250 330 200 300 Q180 260 180 160" },
      // Eyes
      { id: "lm19", d: "M215 185 A10 12 0 1 1 215 209 A10 12 0 1 1 215 185" },
      { id: "lm20", d: "M275 185 A10 12 0 1 1 275 209 A10 12 0 1 1 275 185" },
      // Nose
      { id: "lm21", d: "M240 240 Q250 230 260 240 Q255 250 250 255 Q245 250 240 240" },
      // Mouth
      { id: "lm22", d: "M230 260 Q240 270 250 265 Q260 270 270 260" },
      // Whisker dots
      { id: "lm23", d: "M210 250 A3 3 0 1 1 210 256 A3 3 0 1 1 210 250" },
      { id: "lm24", d: "M200 260 A3 3 0 1 1 200 266 A3 3 0 1 1 200 260" },
      { id: "lm25", d: "M290 250 A3 3 0 1 1 290 256 A3 3 0 1 1 290 250" },
      { id: "lm26", d: "M300 260 A3 3 0 1 1 300 266 A3 3 0 1 1 300 260" },
      // Forehead marking
      { id: "lm27", d: "M235 145 Q250 130 265 145 Q255 160 250 165 Q245 160 235 145" },
      // Body
      { id: "lm28", d: "M200 330 Q200 400 220 450 Q250 470 280 450 Q300 400 300 330" },
      // Paws
      { id: "lm29", d: "M190 450 Q185 470 195 480 Q210 485 215 470 Q215 460 210 450" },
      { id: "lm30", d: "M290 450 Q285 470 295 480 Q310 485 315 470 Q315 460 310 450" },
    ]),
  },
  butterflyWings: {
    name: "🦋 Butterfly",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Left upper wing
      { id: "bw1", d: "M248 200 Q200 100 100 80 Q50 100 40 160 Q30 220 80 260 Q140 280 248 240" },
      // Left upper wing inner
      { id: "bw2", d: "M240 210 Q200 140 130 120 Q90 135 85 175 Q80 215 115 240 Q160 255 240 230" },
      // Left upper wing spot
      { id: "bw3", d: "M140 165 A25 25 0 1 1 140 215 A25 25 0 1 1 140 165" },
      // Right upper wing
      { id: "bw4", d: "M252 200 Q300 100 400 80 Q450 100 460 160 Q470 220 420 260 Q360 280 252 240" },
      // Right upper wing inner
      { id: "bw5", d: "M260 210 Q300 140 370 120 Q410 135 415 175 Q420 215 385 240 Q340 255 260 230" },
      // Right upper wing spot
      { id: "bw6", d: "M360 165 A25 25 0 1 1 360 215 A25 25 0 1 1 360 165" },
      // Left lower wing
      { id: "bw7", d: "M248 260 Q180 300 120 360 Q100 400 120 430 Q150 460 200 440 Q240 410 248 320" },
      // Left lower wing inner
      { id: "bw8", d: "M244 280 Q195 310 155 355 Q140 385 155 405 Q175 425 210 412 Q238 390 244 310" },
      // Left lower wing spot
      { id: "bw9", d: "M180 370 A15 15 0 1 1 180 400 A15 15 0 1 1 180 370" },
      // Right lower wing
      { id: "bw10", d: "M252 260 Q320 300 380 360 Q400 400 380 430 Q350 460 300 440 Q260 410 252 320" },
      // Right lower wing inner
      { id: "bw11", d: "M256 280 Q305 310 345 355 Q360 385 345 405 Q325 425 290 412 Q262 390 256 310" },
      // Right lower wing spot
      { id: "bw12", d: "M320 370 A15 15 0 1 1 320 400 A15 15 0 1 1 320 370" },
      // Body
      { id: "bw13", d: "M245 150 Q248 140 250 135 Q252 140 255 150 L255 420 Q252 430 250 435 Q248 430 245 420 Z" },
      // Body segments
      { id: "bw14", d: "M245 180 L255 180 L255 210 L245 210 Z" },
      { id: "bw15", d: "M245 220 L255 220 L255 250 L245 250 Z" },
      { id: "bw16", d: "M245 260 L255 260 L255 290 L245 290 Z" },
      { id: "bw17", d: "M245 300 L255 300 L255 330 L245 330 Z" },
      { id: "bw18", d: "M245 340 L255 340 L255 370 L245 370 Z" },
      // Head
      { id: "bw19", d: "M250 130 A10 10 0 1 1 250 150 A10 10 0 1 1 250 130" },
      // Antennae
      { id: "bw20", d: "M248 130 Q230 90 215 70 Q210 65 212 60 A5 5 0 1 1 218 68 Q220 72 248 130" },
      { id: "bw21", d: "M252 130 Q270 90 285 70 Q290 65 288 60 A5 5 0 1 1 282 68 Q280 72 252 130" },
      // Additional wing details
      { id: "bw22", d: "M100 160 A8 8 0 1 1 100 176 A8 8 0 1 1 100 160" },
      { id: "bw23", d: "M400 160 A8 8 0 1 1 400 176 A8 8 0 1 1 400 160" },
      // Flowers below
      { id: "bw24", d: "M80 480 Q90 460 100 480 Q110 460 120 480 Q100 470 80 480" },
      { id: "bw25", d: "M380 480 Q390 460 400 480 Q410 460 420 480 Q400 470 380 480" },
    ]),
  },
  mountainLandscape: {
    name: "⛰️ Mountain Landscape",
    viewBox: "0 0 500 400",
    sections: makeSections([
      // Sky
      { id: "ml1", d: "M0 0 L500 0 L500 150 L0 150 Z" },
      // Sun
      { id: "ml2", d: "M400 60 A30 30 0 1 1 400 120 A30 30 0 1 1 400 60" },
      // Clouds
      { id: "ml3", d: "M80 50 Q100 30 130 40 Q150 30 170 45 Q160 60 130 55 Q100 60 80 50" },
      { id: "ml4", d: "M260 70 Q280 55 300 65 Q315 55 330 68 Q320 80 300 78 Q280 82 260 70" },
      // Far mountain
      { id: "ml5", d: "M0 250 L80 120 L160 250 Z" },
      { id: "ml6", d: "M80 120 L100 150 L60 150 Z" },
      // Main mountain
      { id: "ml7", d: "M100 300 L250 80 L400 300 Z" },
      // Snow cap
      { id: "ml8", d: "M250 80 L220 140 L240 135 L250 150 L260 135 L280 140 Z" },
      // Mountain right
      { id: "ml9", d: "M300 280 L420 130 L500 280 Z" },
      { id: "ml10", d: "M420 130 L400 165 L440 165 Z" },
      // Pine trees (left)
      { id: "ml11", d: "M50 300 L65 240 L80 300 Z" },
      { id: "ml12", d: "M55 270 L65 220 L75 270 Z" },
      { id: "ml13", d: "M62 300 L68 300 L68 320 L62 320 Z" },
      // Pine trees (right group)
      { id: "ml14", d: "M420 290 L435 230 L450 290 Z" },
      { id: "ml15", d: "M425 260 L435 210 L445 260 Z" },
      { id: "ml16", d: "M432 290 L438 290 L438 310 L432 310 Z" },
      // Pine tree center
      { id: "ml17", d: "M180 310 L200 240 L220 310 Z" },
      { id: "ml18", d: "M185 280 L200 220 L215 280 Z" },
      { id: "ml19", d: "M197 310 L203 310 L203 330 L197 330 Z" },
      // Lake
      { id: "ml20", d: "M50 320 Q150 300 250 320 Q350 340 450 320 L460 360 L40 360 Z" },
      // Lake reflection
      { id: "ml21", d: "M150 330 Q200 320 250 330 Q300 340 350 330 L340 350 Q290 355 250 345 Q210 355 160 350 Z" },
      // Foreground grass
      { id: "ml22", d: "M0 350 Q60 340 120 355 Q180 365 250 350 Q320 340 380 355 Q440 365 500 350 L500 400 L0 400 Z" },
      // Path
      { id: "ml23", d: "M200 400 Q220 370 250 355 Q280 370 300 400 Z" },
      // Birds
      { id: "ml24", d: "M150 90 Q155 85 160 90 Q165 85 170 90" },
      { id: "ml25", d: "M330 45 Q335 40 340 45 Q345 40 350 45" },
      // Rocks
      { id: "ml26", d: "M120 350 Q130 340 145 350 Q135 355 120 350" },
      { id: "ml27", d: "M360 345 Q370 335 385 345 Q375 350 360 345" },
    ]),
  },
  flowerBouquet: {
    name: "🌸 Flower Bouquet",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Vase
      { id: "fb1", d: "M180 350 Q175 400 185 450 Q200 480 250 485 Q300 480 315 450 Q325 400 320 350 Z" },
      { id: "fb2", d: "M170 340 Q170 330 180 325 Q250 315 320 325 Q330 330 330 340 Q330 355 320 350 Q250 340 180 350 Q170 355 170 340" },
      // Stems
      { id: "fb3", d: "M248 325 L248 200 L252 200 L252 325 Z" },
      { id: "fb4", d: "M248 280 Q200 240 180 200 L184 198 Q202 238 250 275" },
      { id: "fb5", d: "M252 280 Q300 240 320 200 L316 198 Q298 238 250 275" },
      { id: "fb6", d: "M248 300 Q220 280 200 250 L204 248 Q222 278 250 296" },
      { id: "fb7", d: "M252 300 Q280 280 300 250 L296 248 Q278 278 250 296" },
      // Center rose (top)
      { id: "fb8", d: "M250 200 Q230 180 220 160 Q225 140 250 130 Q275 140 280 160 Q270 180 250 200" },
      { id: "fb9", d: "M250 190 Q240 175 235 160 Q240 148 250 142 Q260 148 265 160 Q260 175 250 190" },
      { id: "fb10", d: "M250 170 A10 10 0 1 1 250 190 A10 10 0 1 1 250 170" },
      // Left flower
      { id: "fb11", d: "M180 200 Q160 185 150 165 Q155 145 180 140 Q205 145 210 165 Q200 185 180 200" },
      { id: "fb12", d: "M180 190 Q170 178 167 165 Q172 155 180 152 Q188 155 193 165 Q190 178 180 190" },
      { id: "fb13", d: "M180 170 A8 8 0 1 1 180 186 A8 8 0 1 1 180 170" },
      // Right flower
      { id: "fb14", d: "M320 200 Q340 185 350 165 Q345 145 320 140 Q295 145 290 165 Q300 185 320 200" },
      { id: "fb15", d: "M320 190 Q330 178 333 165 Q328 155 320 152 Q312 155 307 165 Q310 178 320 190" },
      { id: "fb16", d: "M320 170 A8 8 0 1 1 320 186 A8 8 0 1 1 320 170" },
      // Lower left daisy
      { id: "fb17", d: "M200 260 Q185 245 185 225 Q190 215 205 215 Q215 220 215 240 Q215 250 200 260" },
      { id: "fb18", d: "M200 260 Q215 245 220 225 Q215 215 200 215 Q190 220 190 240 Q195 250 200 260" },
      { id: "fb19", d: "M200 230 A8 8 0 1 1 200 246 A8 8 0 1 1 200 230" },
      // Lower right daisy
      { id: "fb20", d: "M300 260 Q315 245 315 225 Q310 215 295 215 Q285 220 285 240 Q285 250 300 260" },
      { id: "fb21", d: "M300 260 Q285 245 280 225 Q285 215 300 215 Q310 220 310 240 Q305 250 300 260" },
      { id: "fb22", d: "M300 230 A8 8 0 1 1 300 246 A8 8 0 1 1 300 230" },
      // Leaves
      { id: "fb23", d: "M240 280 Q210 270 195 285 Q210 295 240 280" },
      { id: "fb24", d: "M260 280 Q290 270 305 285 Q290 295 260 280" },
      { id: "fb25", d: "M235 250 Q215 240 200 250 Q215 260 235 250" },
      { id: "fb26", d: "M265 250 Q285 240 300 250 Q285 260 265 250" },
      // Baby's breath (small accent flowers)
      { id: "fb27", d: "M155 180 A5 5 0 1 1 155 190 A5 5 0 1 1 155 180" },
      { id: "fb28", d: "M345 180 A5 5 0 1 1 345 190 A5 5 0 1 1 345 180" },
      { id: "fb29", d: "M230 135 A4 4 0 1 1 230 143 A4 4 0 1 1 230 135" },
      { id: "fb30", d: "M270 135 A4 4 0 1 1 270 143 A4 4 0 1 1 270 135" },
    ]),
  },
  owlFeathers: {
    name: "🦉 Owl",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Body
      { id: "ow1", d: "M160 220 Q160 350 200 420 Q250 460 300 420 Q340 350 340 220 Q340 140 250 100 Q160 140 160 220" },
      // Chest feather pattern
      { id: "ow2", d: "M200 250 Q220 235 250 230 Q280 235 300 250 Q280 265 250 270 Q220 265 200 250" },
      { id: "ow3", d: "M195 290 Q220 275 250 270 Q280 275 305 290 Q280 305 250 310 Q220 305 195 290" },
      { id: "ow4", d: "M200 330 Q225 315 250 310 Q275 315 300 330 Q275 345 250 350 Q225 345 200 330" },
      { id: "ow5", d: "M210 370 Q230 355 250 350 Q270 355 290 370 Q270 385 250 390 Q230 385 210 370" },
      // Left eye socket
      { id: "ow6", d: "M185 170 A35 35 0 1 1 185 240 A35 35 0 1 1 185 170" },
      // Left eye
      { id: "ow7", d: "M200 190 A20 20 0 1 1 200 230 A20 20 0 1 1 200 190" },
      { id: "ow8", d: "M208 200 A10 10 0 1 1 208 220 A10 10 0 1 1 208 200" },
      // Right eye socket
      { id: "ow9", d: "M275 170 A35 35 0 1 1 275 240 A35 35 0 1 1 275 170" },
      // Right eye
      { id: "ow10", d: "M260 190 A20 20 0 1 1 260 230 A20 20 0 1 1 260 190" },
      { id: "ow11", d: "M268 200 A10 10 0 1 1 268 220 A10 10 0 1 1 268 200" },
      // Beak
      { id: "ow12", d: "M240 235 Q250 225 260 235 L250 260 Z" },
      // Ear tufts
      { id: "ow13", d: "M190 130 Q170 80 165 50 Q175 60 190 70 Q185 95 200 120" },
      { id: "ow14", d: "M310 130 Q330 80 335 50 Q325 60 310 70 Q315 95 300 120" },
      // Wings (left)
      { id: "ow15", d: "M160 200 Q120 180 80 200 Q60 240 70 300 Q85 350 130 370 Q155 370 165 340" },
      { id: "ow16", d: "M80 250 Q90 240 110 250 Q100 260 80 250" },
      { id: "ow17", d: "M90 290 Q100 280 120 290 Q110 300 90 290" },
      // Wings (right)
      { id: "ow18", d: "M340 200 Q380 180 420 200 Q440 240 430 300 Q415 350 370 370 Q345 370 335 340" },
      { id: "ow19", d: "M390 250 Q400 240 420 250 Q410 260 390 250" },
      { id: "ow20", d: "M380 290 Q390 280 410 290 Q400 300 380 290" },
      // Feet
      { id: "ow21", d: "M220 430 Q210 450 195 460 Q205 465 215 455 Q220 465 230 455 Q235 465 240 460 Q230 450 225 430" },
      { id: "ow22", d: "M275 430 Q265 450 255 460 Q265 465 275 455 Q280 465 290 455 Q295 465 300 460 Q290 450 280 430" },
      // Branch
      { id: "ow23", d: "M100 460 Q200 445 300 460 Q400 475 480 455 L480 465 Q400 485 300 470 Q200 455 100 470 Z" },
      // Leaves on branch
      { id: "ow24", d: "M130 455 Q145 440 160 455 Q145 465 130 455" },
      { id: "ow25", d: "M380 460 Q395 445 410 460 Q395 470 380 460" },
      // Stars
      { id: "ow26", d: "M50 80 L53 72 L56 80 L63 77 L58 84 L63 91 L56 88 L53 96 L50 88 L43 91 L48 84 L43 77 Z" },
      { id: "ow27", d: "M430 60 L433 52 L436 60 L443 57 L438 64 L443 71 L436 68 L433 76 L430 68 L423 71 L428 64 L423 57 Z" },
      // Moon
      { id: "ow28", d: "M440 100 A25 25 0 1 1 440 150 A15 15 0 1 0 440 100" },
    ]),
  },
  geometricMandala: {
    name: " Geometric Mandala",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Outer ring segments
      { id: "gm1", d: "M250 30 A220 220 0 0 1 420 110 L360 170 A150 150 0 0 0 250 100 Z" },
      { id: "gm2", d: "M420 110 A220 220 0 0 1 470 290 L390 270 A150 150 0 0 0 360 170 Z" },
      { id: "gm3", d: "M470 290 A220 220 0 0 1 360 440 L320 370 A150 150 0 0 0 390 270 Z" },
      { id: "gm4", d: "M360 440 A220 220 0 0 1 150 440 L190 370 A150 150 0 0 0 320 370 Z" },
      { id: "gm5", d: "M150 440 A220 220 0 0 1 40 290 L120 270 A150 150 0 0 0 190 370 Z" },
      { id: "gm6", d: "M40 290 A220 220 0 0 1 90 110 L150 170 A150 150 0 0 0 120 270 Z" },
      { id: "gm7", d: "M90 110 A220 220 0 0 1 250 30 L250 100 A150 150 0 0 0 150 170 Z" },
      // Middle ring
      { id: "gm8", d: "M250 100 A150 150 0 0 1 360 170 L310 210 A80 80 0 0 0 250 180 Z" },
      { id: "gm9", d: "M360 170 A150 150 0 0 1 390 270 L330 260 A80 80 0 0 0 310 210 Z" },
      { id: "gm10", d: "M390 270 A150 150 0 0 1 320 370 L290 310 A80 80 0 0 0 330 260 Z" },
      { id: "gm11", d: "M320 370 A150 150 0 0 1 190 370 L220 310 A80 80 0 0 0 290 310 Z" },
      { id: "gm12", d: "M190 370 A150 150 0 0 1 120 270 L180 260 A80 80 0 0 0 220 310 Z" },
      { id: "gm13", d: "M120 270 A150 150 0 0 1 150 170 L200 210 A80 80 0 0 0 180 260 Z" },
      { id: "gm14", d: "M150 170 A150 150 0 0 1 250 100 L250 180 A80 80 0 0 0 200 210 Z" },
      // Inner petals
      { id: "gm15", d: "M250 180 C270 200 275 220 250 240 C225 220 230 200 250 180" },
      { id: "gm16", d: "M310 210 C310 235 300 250 275 250 C280 230 290 220 310 210" },
      { id: "gm17", d: "M330 260 C315 280 300 285 280 275 C295 265 310 260 330 260" },
      { id: "gm18", d: "M290 310 C275 320 260 320 250 305 C265 300 278 300 290 310" },
      { id: "gm19", d: "M220 310 C225 320 240 320 250 305 C235 300 222 300 220 310" },
      { id: "gm20", d: "M180 260 C195 280 210 285 230 275 C215 265 200 260 180 260" },
      { id: "gm21", d: "M200 210 C200 235 210 250 235 250 C230 230 220 220 200 210" },
      // Center
      { id: "gm22", d: "M250 220 A30 30 0 1 1 250 280 A30 30 0 1 1 250 220" },
      { id: "gm23", d: "M250 230 L270 250 L250 270 L230 250 Z" },
      { id: "gm24", d: "M250 238 A12 12 0 1 1 250 262 A12 12 0 1 1 250 238" },
    ]),
  },
  treeOfLife: {
    name: "🌳 Tree of Life",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Trunk
      { id: "tl1", d: "M230 280 Q225 340 220 400 Q218 440 225 480 L275 480 Q282 440 280 400 Q275 340 270 280 Z" },
      // Roots
      { id: "tl2", d: "M225 480 Q200 490 170 500 L180 500 Q210 495 225 485" },
      { id: "tl3", d: "M275 480 Q300 490 330 500 L320 500 Q290 495 275 485" },
      { id: "tl4", d: "M235 485 Q230 495 220 500 L230 500 Q238 496 240 488" },
      { id: "tl5", d: "M265 485 Q270 495 280 500 L270 500 Q262 496 260 488" },
      // Main branches
      { id: "tl6", d: "M240 280 Q200 250 160 200 Q150 190 155 180 Q165 180 170 190 Q205 245 250 275" },
      { id: "tl7", d: "M260 280 Q300 250 340 200 Q350 190 345 180 Q335 180 330 190 Q295 245 250 275" },
      { id: "tl8", d: "M245 260 Q220 220 190 180 Q180 165 185 155 Q195 158 200 170 Q225 215 250 255" },
      { id: "tl9", d: "M255 260 Q280 220 310 180 Q320 165 315 155 Q305 158 300 170 Q275 215 250 255" },
      // Crown foliage (large circles)
      { id: "tl10", d: "M250 100 A80 80 0 1 1 250 260 A80 80 0 1 1 250 100" },
      // Sub-foliage clusters
      { id: "tl11", d: "M150 130 A45 45 0 1 1 150 220 A45 45 0 1 1 150 130" },
      { id: "tl12", d: "M350 130 A45 45 0 1 1 350 220 A45 45 0 1 1 350 130" },
      { id: "tl13", d: "M190 70 A35 35 0 1 1 190 140 A35 35 0 1 1 190 70" },
      { id: "tl14", d: "M310 70 A35 35 0 1 1 310 140 A35 35 0 1 1 310 70" },
      { id: "tl15", d: "M250 40 A30 30 0 1 1 250 100 A30 30 0 1 1 250 40" },
      // Leaf details inside crown
      { id: "tl16", d: "M220 140 Q230 120 250 130 Q240 145 220 140" },
      { id: "tl17", d: "M260 130 Q270 115 285 125 Q275 140 260 130" },
      { id: "tl18", d: "M230 170 Q245 155 260 170 Q245 180 230 170" },
      { id: "tl19", d: "M200 180 Q215 165 225 180 Q215 190 200 180" },
      { id: "tl20", d: "M280 175 Q295 160 305 175 Q295 185 280 175" },
      // Fruits/seeds
      { id: "tl21", d: "M175 170 A6 6 0 1 1 175 182 A6 6 0 1 1 175 170" },
      { id: "tl22", d: "M325 160 A6 6 0 1 1 325 172 A6 6 0 1 1 325 160" },
      { id: "tl23", d: "M250 80 A6 6 0 1 1 250 92 A6 6 0 1 1 250 80" },
      // Ground
      { id: "tl24", d: "M0 470 Q100 455 200 470 Q300 485 400 470 Q450 465 500 470 L500 500 L0 500 Z" },
      // Small flowers at base
      { id: "tl25", d: "M130 475 Q140 465 150 475 Q140 480 130 475" },
      { id: "tl26", d: "M350 475 Q360 465 370 475 Q360 480 350 475" },
      // Birds
      { id: "tl27", d: "M80 100 Q85 95 90 100 Q95 95 100 100" },
      { id: "tl28", d: "M400 80 Q405 75 410 80 Q415 75 420 80" },
    ]),
  },
  castleFairytale: {
    name: "🏰 Castle",
    viewBox: "0 0 500 500",
    sections: makeSections([
      // Main wall
      { id: "cf1", d: "M120 300 L120 200 L380 200 L380 300 L350 300 L350 250 L310 250 L310 300 L190 300 L190 250 L150 250 L150 300 Z" },
      // Left tower
      { id: "cf2", d: "M80 300 L80 150 L160 150 L160 300 Z" },
      { id: "cf3", d: "M70 150 L120 80 L170 150 Z" },
      // Right tower
      { id: "cf4", d: "M340 300 L340 150 L420 150 L420 300 Z" },
      { id: "cf5", d: "M330 150 L380 80 L430 150 Z" },
      // Center tower (tallest)
      { id: "cf6", d: "M200 200 L200 120 L300 120 L300 200 Z" },
      { id: "cf7", d: "M190 120 L250 40 L310 120 Z" },
      // Flag
      { id: "cf8", d: "M248 40 L252 40 L252 20 L248 20 Z" },
      { id: "cf9", d: "M252 20 L285 30 L252 40 Z" },
      // Battlements (top wall)
      { id: "cf10", d: "M120 200 L120 190 L140 190 L140 200" },
      { id: "cf11", d: "M160 200 L160 190 L180 190 L180 200" },
      { id: "cf12", d: "M320 200 L320 190 L340 190 L340 200" },
      { id: "cf13", d: "M360 200 L360 190 L380 190 L380 200" },
      // Windows (left tower)
      { id: "cf14", d: "M110 180 A10 15 0 1 1 110 210 A10 15 0 1 1 110 180" },
      { id: "cf15", d: "M130 250 L130 275 L140 275 L140 250 Z" },
      // Windows (right tower)
      { id: "cf16", d: "M370 180 A10 15 0 1 1 370 210 A10 15 0 1 1 370 180" },
      { id: "cf17", d: "M370 250 L370 275 L380 275 L380 250 Z" },
      // Windows (center)
      { id: "cf18", d: "M235 145 A15 20 0 1 1 235 185 A15 20 0 1 1 235 145" },
      { id: "cf19", d: "M265 145 A15 20 0 1 1 265 185 A15 20 0 1 1 265 145" },
      // Gate / Door
      { id: "cf20", d: "M220 300 Q220 260 250 240 Q280 260 280 300 Z" },
      { id: "cf21", d: "M248 300 L248 265 L252 265 L252 300 Z" },
      // Ground
      { id: "cf22", d: "M0 300 L500 300 L500 340 L0 340 Z" },
      // Path
      { id: "cf23", d: "M220 340 Q230 380 240 420 Q250 450 250 500 L260 500 Q260 450 270 420 Q280 380 290 340 Z" },
      // Moat
      { id: "cf24", d: "M0 340 Q50 360 120 340 Q200 330 250 340 Q300 330 380 340 Q450 360 500 340 L500 370 L0 370 Z" },
      // Bushes
      { id: "cf25", d: "M30 300 Q40 280 60 285 Q75 275 90 290 Q80 305 60 300 Q45 305 30 300" },
      { id: "cf26", d: "M410 300 Q420 280 440 285 Q455 275 470 290 Q460 305 440 300 Q425 305 410 300" },
      // Clouds
      { id: "cf27", d: "M50 50 Q70 35 100 42 Q120 35 135 48 Q125 60 100 56 Q75 62 50 50" },
      { id: "cf28", d: "M350 40 Q370 25 400 32 Q420 25 435 38 Q425 50 400 46 Q375 52 350 40" },
      // Stars/sun
      { id: "cf29", d: "M440 80 A15 15 0 1 1 440 110 A15 15 0 1 1 440 80" },
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
  const [selectedPage, setSelectedPage] = useState<PageKey>("seaTurtle");
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
