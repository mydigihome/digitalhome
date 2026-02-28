import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eraser, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const COLORS = ["#7C3AED", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#1F2937", "#FFFFFF"];

interface DrawingCanvasProps {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export default function DrawingCanvas({ open, onClose, onSave }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [open]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    lastPos.current = getPos(e);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current || !lastPos.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? "#FFFFFF" : color;
    ctx.lineWidth = isEraser ? brushSize * 3 : brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing, color, brushSize, isEraser, getPos]);

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
    onClose();
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
            <h3 className="text-sm font-semibold text-foreground">Drawing Canvas</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Save Drawing
              </Button>
              <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-2">
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setIsEraser(false); }}
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c && !isEraser ? "hsl(var(--primary))" : "transparent",
                  }}
                />
              ))}
            </div>
            <div className="mx-2 h-6 w-px bg-border" />
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`rounded-md p-1.5 transition-colors ${isEraser ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
            >
              <Eraser className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-muted-foreground">Size</span>
              <Slider
                value={[brushSize]}
                onValueChange={([v]) => setBrushSize(v)}
                min={1}
                max={20}
                step={1}
                className="w-24"
              />
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden p-4">
            <canvas
              ref={canvasRef}
              className="h-full w-full cursor-crosshair rounded-lg border border-border"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
