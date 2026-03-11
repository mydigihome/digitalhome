import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";
import type { TimeseriesPoint } from "@/hooks/useMarketData";
import { Button } from "@/components/ui/button";
import { CandlestickChart, LineChart, Minus, TrendingUp, RectangleHorizontal, MousePointer, Trash2, Pencil } from "lucide-react";

interface LiveChartProps {
  data: TimeseriesPoint[];
  symbol: string;
}

const TIMEFRAMES = [
  { label: "1D", interval: "5min", outputsize: "78" },
  { label: "1W", interval: "1h", outputsize: "35" },
  { label: "1M", interval: "1day", outputsize: "30" },
  { label: "3M", interval: "1day", outputsize: "90" },
  { label: "1Y", interval: "1week", outputsize: "52" },
  { label: "ALL", interval: "1month", outputsize: "60" },
];

export { TIMEFRAMES };

type DrawingTool = "none" | "hline" | "trendline" | "rect";

interface Drawing {
  id: string;
  type: DrawingTool;
  x1: number; y1: number;
  x2?: number; y2?: number;
  color: string;
}

export default function LiveChart({ data, symbol }: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<any>(null);
  const [chartType, setChartType] = useState<"candlestick" | "line">("line");
  const [activeTool, setActiveTool] = useState<DrawingTool>("none");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const [showTools, setShowTools] = useState(false);
  const drawingsRef = useRef<Drawing[]>([]);
  const chartHeightRef = useRef(350);

  // Keep ref in sync
  useEffect(() => { drawingsRef.current = drawings; }, [drawings]);

  const renderDrawings = useCallback((allDrawings: Drawing[], tempDrawing?: { x1: number; y1: number; x2: number; y2: number; type: DrawingTool }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawAll = [...allDrawings];
    if (tempDrawing) {
      drawAll.push({ id: "temp", type: tempDrawing.type, x1: tempDrawing.x1, y1: tempDrawing.y1, x2: tempDrawing.x2, y2: tempDrawing.y2, color: "hsl(258, 89%, 66%)" });
    }

    for (const d of drawAll) {
      ctx.save();
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 2 * dpr;
      ctx.setLineDash(d.id === "temp" ? [6 * dpr, 4 * dpr] : []);

      if (d.type === "hline") {
        ctx.beginPath();
        ctx.moveTo(0, d.y1 * dpr);
        ctx.lineTo(canvas.width, d.y1 * dpr);
        ctx.stroke();
        // Label
        ctx.setLineDash([]);
        ctx.fillStyle = d.color;
        ctx.fillRect(0, d.y1 * dpr - 8 * dpr, 4 * dpr, 16 * dpr);
      } else if (d.type === "trendline" && d.x2 !== undefined && d.y2 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(d.x1 * dpr, d.y1 * dpr);
        ctx.lineTo(d.x2 * dpr, d.y2 * dpr);
        ctx.stroke();
        // Endpoints
        ctx.setLineDash([]);
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x1 * dpr, d.y1 * dpr, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(d.x2 * dpr, d.y2 * dpr, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === "rect" && d.x2 !== undefined && d.y2 !== undefined) {
        // Semi-transparent fill
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = d.color;
        ctx.fillRect(d.x1 * dpr, d.y1 * dpr, (d.x2 - d.x1) * dpr, (d.y2 - d.y1) * dpr);
        ctx.globalAlpha = 1;
        ctx.strokeRect(d.x1 * dpr, d.y1 * dpr, (d.x2 - d.x1) * dpr, (d.y2 - d.y1) * dpr);
      }
      ctx.restore();
    }
  }, []);

  // Sync canvas size to match chart container
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const h = chartHeightRef.current;

    canvas.width = rect.width * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${h}px`;

    renderDrawings(drawingsRef.current);
  }, [renderDrawings]);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const isDark = document.documentElement.classList.contains("dark");

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "hsl(0, 0%, 63%)" : "hsl(30, 3%, 47%)",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: isDark ? "hsl(220, 13%, 20%)" : "hsl(40, 5%, 92%)" },
        horzLines: { color: isDark ? "hsl(220, 13%, 20%)" : "hsl(40, 5%, 92%)" },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: isDark ? "hsl(220, 13%, 25%)" : "hsl(40, 5%, 90%)" },
      timeScale: { borderColor: isDark ? "hsl(220, 13%, 25%)" : "hsl(40, 5%, 90%)", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: chartHeightRef.current,
    });

    chartRef.current = chart;

    const parsedCandles = data.map((d) => ({
      time: d.datetime.split(" ")[0] as string,
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
    })).sort((a, b) => a.time.localeCompare(b.time));

    const volumeData = data.map((d) => ({
      time: d.datetime.split(" ")[0] as string,
      value: parseInt(d.volume) || 0,
      color: parseFloat(d.close) >= parseFloat(d.open) ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
    })).sort((a, b) => a.time.localeCompare(b.time));

    if (chartType === "candlestick") {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#22c55e", downColor: "#ef4444",
        borderUpColor: "#22c55e", borderDownColor: "#ef4444",
        wickUpColor: "#22c55e", wickDownColor: "#ef4444",
      });
      series.setData(parsedCandles);
      seriesRef.current = series;
    } else {
      const lineData = parsedCandles.map((d) => ({ time: d.time, value: d.close }));
      const series = chart.addSeries(LineSeries, { color: "hsl(258, 89%, 66%)", lineWidth: 2 });
      series.setData(lineData);
      seriesRef.current = series;
    }

    const volSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "" });
    volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    volSeries.setData(volumeData);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
        syncCanvasSize();
      }
    };
    window.addEventListener("resize", handleResize);

    // Give lightweight-charts time to render, then sync canvas
    requestAnimationFrame(() => {
      setTimeout(syncCanvasSize, 100);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, chartType, syncCanvasSize]);

  // Canvas mouse handlers using native events for reliability
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseDown = (e: MouseEvent) => {
      if (activeTool === "none") return;
      e.preventDefault();
      e.stopPropagation();
      const pos = getPos(e);
      drawStartRef.current = pos;
      isDrawingRef.current = true;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current || !drawStartRef.current || activeTool === "none") return;
      e.preventDefault();
      const pos = getPos(e);
      const start = drawStartRef.current;
      renderDrawings(drawingsRef.current, {
        x1: start.x,
        y1: activeTool === "hline" ? start.y : start.y,
        x2: pos.x,
        y2: activeTool === "hline" ? start.y : pos.y,
        type: activeTool,
      });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDrawingRef.current || !drawStartRef.current || activeTool === "none") return;
      e.preventDefault();
      const pos = getPos(e);
      const start = drawStartRef.current;

      // Minimum drag distance to count as a drawing
      const dist = Math.sqrt(Math.pow(pos.x - start.x, 2) + Math.pow(pos.y - start.y, 2));
      if (dist < 3 && activeTool !== "hline") {
        isDrawingRef.current = false;
        drawStartRef.current = null;
        renderDrawings(drawingsRef.current);
        return;
      }

      const colors = ["hsl(258, 89%, 66%)", "#22c55e", "#ef4444", "#f59e0b", "#3b82f6"];
      const color = colors[drawingsRef.current.length % colors.length];

      const newDrawing: Drawing = {
        id: crypto.randomUUID(),
        type: activeTool,
        x1: start.x,
        y1: start.y,
        x2: pos.x,
        y2: activeTool === "hline" ? start.y : pos.y,
        color,
      };

      setDrawings((prev) => [...prev, newDrawing]);
      isDrawingRef.current = false;
      drawStartRef.current = null;
    };

    const onMouseLeave = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        drawStartRef.current = null;
        renderDrawings(drawingsRef.current);
      }
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [activeTool, renderDrawings]);

  // Re-render drawings when they change
  useEffect(() => {
    renderDrawings(drawings);
  }, [drawings, renderDrawings]);

  const tools: { tool: DrawingTool; icon: React.ReactNode; label: string }[] = [
    { tool: "none", icon: <MousePointer className="w-3.5 h-3.5" />, label: "Select" },
    { tool: "hline", icon: <Minus className="w-3.5 h-3.5" />, label: "H-Line" },
    { tool: "trendline", icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Trend" },
    { tool: "rect", icon: <RectangleHorizontal className="w-3.5 h-3.5" />, label: "Rect" },
  ];

  const isToolActive = activeTool !== "none";

  return (
    <div>
      {/* Chart type + drawing tools */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <Button variant={chartType === "line" ? "default" : "ghost"} size="sm" onClick={() => setChartType("line")} className="h-7 px-2 text-xs gap-1">
            <LineChart className="h-3 w-3" /> Line
          </Button>
          <Button variant={chartType === "candlestick" ? "default" : "ghost"} size="sm" onClick={() => setChartType("candlestick")} className="h-7 px-2 text-xs gap-1">
            <CandlestickChart className="h-3 w-3" /> Candles
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={showTools ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              const next = !showTools;
              setShowTools(next);
              if (!next) setActiveTool("none");
              else setActiveTool("hline"); // Auto-select first tool
            }}
            className="h-7 px-2 text-xs gap-1"
          >
            <Pencil className="w-3 h-3" /> Draw
          </Button>
          {drawings.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setDrawings([])} className="h-7 px-2 text-xs text-destructive hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Drawing toolbar */}
      {showTools && (
        <div className="flex items-center gap-1 mb-2 p-1 rounded-lg bg-muted/60 border border-border w-fit">
          {tools.map((t) => (
            <button
              key={t.tool}
              onClick={() => setActiveTool(t.tool)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTool === t.tool
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chart container with canvas overlay */}
      <div className="relative w-full rounded-xl overflow-hidden" style={{ height: chartHeightRef.current }}>
        <div ref={containerRef} className="w-full h-full" />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{
            width: "100%",
            height: chartHeightRef.current,
            zIndex: isToolActive ? 10 : 1,
            pointerEvents: isToolActive ? "auto" : "none",
            cursor: isToolActive ? "crosshair" : "default",
          }}
        />
        {/* Active tool indicator */}
        {isToolActive && (
          <div className="absolute top-2 left-2 z-20 px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-[10px] font-semibold uppercase tracking-wide pointer-events-none">
            {activeTool === "hline" ? "H-Line" : activeTool === "trendline" ? "Trendline" : "Rectangle"} — click & drag
          </div>
        )}
      </div>
    </div>
  );
}
