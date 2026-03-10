import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TradingPair {
  id: string;
  user_id: string;
  symbol: string;
  display_name: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export function useTradingPairs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["trading_pairs", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("trading_pairs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as TradingPair[];
    },
    enabled: !!user,
  });
}

export function useAddTradingPair() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (pair: { symbol: string; display_name: string; category: string }) => {
      const { error } = await (supabase as any)
        .from("trading_pairs")
        .insert({ ...pair, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading_pairs"] }),
  });
}

export function useRemoveTradingPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("trading_pairs")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading_pairs"] }),
  });
}
