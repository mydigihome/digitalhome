import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  percent_change: string;
  volume: string;
  previous_close: string;
  open: string;
  high: string;
  low: string;
}

export interface TimeseriesPoint {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export function useMarketQuote(symbol: string | null) {
  return useQuery({
    queryKey: ["market_quote", symbol],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("market-data", {
        body: { action: "quote", symbol },
      });
      if (error) throw error;
      return data as { quote: MarketQuote; timeseries: TimeseriesPoint[]; mock: boolean };
    },
    enabled: !!symbol,
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000,
  });
}

export function useTimeseries(symbol: string | null, interval: string = "1day", outputsize: string = "30") {
  return useQuery({
    queryKey: ["market_timeseries", symbol, interval, outputsize],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("market-data", {
        body: { action: "timeseries", symbol, interval, outputsize },
      });
      if (error) throw error;
      return data as { timeseries: TimeseriesPoint[]; mock: boolean };
    },
    enabled: !!symbol,
    staleTime: 30000,
  });
}

export function useSymbolSearch(query: string) {
  return useQuery({
    queryKey: ["symbol_search", query],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("market-data", {
        body: { action: "search", symbol: query },
      });
      if (error) throw error;
      return data?.data || [];
    },
    enabled: query.length >= 1,
    staleTime: 60000,
  });
}
