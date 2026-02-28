import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";
import type { TimeseriesPoint } from "@/hooks/useMarketData";
import { Button } from "@/components/ui/button";
import { CandlestickChart, LineChart } from "lucide-react";

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

export default function LiveChart({ data, symbol }: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const [chartType, setChartType] = useState<"candlestick" | "line">("line");

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "hsl(30, 3%, 47%)",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "hsl(40, 5%, 92%)" },
        horzLines: { color: "hsl(40, 5%, 92%)" },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: "hsl(40, 5%, 90%)",
      },
      timeScale: {
        borderColor: "hsl(40, 5%, 90%)",
        timeVisible: true,
      },
      width: containerRef.current.clientWidth,
      height: 350,
    });

    chartRef.current = chart;

    // Parse data
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
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      series.setData(parsedCandles);
    } else {
      const lineData = parsedCandles.map((d) => ({
        time: d.time,
        value: d.close,
      }));
      const series = chart.addSeries(LineSeries, {
        color: "hsl(258, 89%, 66%)",
        lineWidth: 2,
      });
      series.setData(lineData);
    }

    // Volume
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volSeries.setData(volumeData);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, chartType]);

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <Button
          variant={chartType === "line" ? "default" : "ghost"}
          size="sm"
          onClick={() => setChartType("line")}
          className="h-7 px-2 text-xs gap-1"
        >
          <LineChart className="h-3 w-3" /> Line
        </Button>
        <Button
          variant={chartType === "candlestick" ? "default" : "ghost"}
          size="sm"
          onClick={() => setChartType("candlestick")}
          className="h-7 px-2 text-xs gap-1"
        >
          <CandlestickChart className="h-3 w-3" /> Candles
        </Button>
      </div>
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden" />
    </div>
  );
}
