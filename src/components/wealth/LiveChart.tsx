import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";
import type { TimeseriesPoint } from "@/hooks/useMarketData";
import { Button } from "@/components/ui/button";
import { CandlestickChart, LineChart, Minus, TrendingUp, RectangleHorizontal, MousePointer, Trash2 } from "lucide-react";

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
  // For hline: y1 only; trendline: x1,y1,x2,y2; rect: x1,y1,x2,y2
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
  const [isDrawing, setIsDrawing] = useState(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const [showTools, setShowTools] = useState(false);

  // Convert pixel to price/time coordinates
  const pixelToCoord = useCallback((px: number, py: number) => {
    return { x: px, y: py };
  }, []);

  // Draw all annotations on canvas overlay
  const renderDrawings = useCallback((allDrawings: Drawing[], tempDrawing?: { x1: number; y1: number; x2: number; y2: number; type: DrawingTool }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dpr = window.devicePixelRatio || 1;

    const drawAll = [...allDrawings];
    if (tempDrawing) {
      drawAll.push({ id: "temp", type: tempDrawing.type, x1: tempDrawing.x1, y1: tempDrawing.y1, x2: tempDrawing.x2, y2: tempDrawing.y2, color: "hsl(258, 89%, 66%)" });
    }

    for (const d of drawAll) {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash(d.id === "temp" ? [4 * dpr, 4 * dpr] : []);

      if (d.type === "hline") {
        ctx.beginPath();
        ctx.moveTo(0, d.y1 * dpr);
        ctx.lineTo(canvas.width, d.y1 * dpr);
        ctx.stroke();
      } else if (d.type === "trendline" && d.x2 !== undefined && d.y2 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(d.x1 * dpr, d.y1 * dpr);
        ctx.lineTo(d.x2 * dpr, d.y2 * dpr);
        ctx.stroke();
      } else if (d.type === "rect" && d.x2 !== undefined && d.y2 !== undefined) {
        ctx.fillStyle = d.color.replace(")", ", 0.08)").replace("hsl(", "hsla(").replace("rgb(", "rgba(");
        ctx.fillRect(d.x1 * dpr, d.y1 * dpr, (d.x2 - d.x1) * dpr, (d.y2 - d.y1) * dpr);
        ctx.strokeRect(d.x1 * dpr, d.y1 * dpr, (d.x2 - d.x1) * dpr, (d.y2 - d.y1) * dpr);
      }
    }
    ctx.setLineDash([]);
  }, []);

  // Sync canvas size
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = 350 * dpr;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = "350px";
    renderDrawings(drawings);
  }, [drawings, renderDrawings]);

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
      height: 350,
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
    setTimeout(syncCanvasSize, 50);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, chartType, syncCanvasSize]);

  // Canvas mouse handlers for drawing
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "none") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawStartRef.current = { x, y };
    setIsDrawing(true);
  }, [activeTool]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStartRef.current || activeTool === "none") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const start = drawStartRef.current;
    renderDrawings(drawings, { x1: start.x, y1: activeTool === "hline" ? start.y : start.y, x2: x, y2: activeTool === "hline" ? start.y : y, type: activeTool });
  }, [isDrawing, activeTool, drawings, renderDrawings]);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStartRef.current || activeTool === "none") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const start = drawStartRef.current;

    const colors = ["hsl(258, 89%, 66%)", "#22c55e", "#ef4444", "#f59e0b", "#3b82f6"];
    const color = colors[drawings.length % colors.length];

    const newDrawing: Drawing = {
      id: crypto.randomUUID(),
      type: activeTool,
      x1: start.x,
      y1: activeTool === "hline" ? start.y : start.y,
      x2: x,
      y2: activeTool === "hline" ? start.y : y,
      color,
    };

    setDrawings((prev) => [...prev, newDrawing]);
    setIsDrawing(false);
    drawStartRef.current = null;
    renderDrawings([...drawings, newDrawing]);
  }, [isDrawing, activeTool, drawings, renderDrawings]);

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
          {/* Toggle tools */}
          <Button variant={showTools ? "default" : "ghost"} size="sm" onClick={() => { setShowTools(!showTools); if (showTools) setActiveTool("none"); }} className="h-7 px-2 text-xs">
            ✏️ Draw
          </Button>
          {drawings.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { setDrawings([]); renderDrawings([]); }} className="h-7 px-2 text-xs text-destructive hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Drawing toolbar */}
      {showTools && (
        <div className="flex items-center gap-1 mb-2 p-1.5 rounded-lg bg-muted/50 border border-border w-fit">
          {tools.map((t) => (
            <button
              key={t.tool}
              onClick={() => setActiveTool(t.tool)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                activeTool === t.tool ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart container with canvas overlay */}
      <div className="relative w-full rounded-xl overflow-hidden">
        <div ref={containerRef} className="w-full" />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full"
          style={{ height: 350, pointerEvents: activeTool !== "none" ? "auto" : "none", cursor: activeTool !== "none" ? "crosshair" : "default" }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        />
      </div>
    </div>
  );
}
