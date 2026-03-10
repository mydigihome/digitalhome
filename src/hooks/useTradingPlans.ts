import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TradingPlan {
  id: string;
  user_id: string;
  symbol: string;
  asset_name: string;
  current_price: number | null;
  entry_price: number | null;
  position_size: number | null;
  total_investment: number | null;
  stop_loss: number | null;
  take_profit_1: number | null;
  take_profit_2: number | null;
  risk_reward_ratio: number | null;
  strategy_notes: string | null;
  time_frame: string;
  status: string;
  target_price: number | null;
  trading_pair_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useTradingPlans() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["trading_plans", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("trading_plans")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TradingPlan[];
    },
    enabled: !!user,
  });
}

export function useCreateTradingPlan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (plan: Omit<TradingPlan, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { error } = await (supabase as any)
        .from("trading_plans")
        .insert({ ...plan, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading_plans"] }),
  });
}

export function useUpdateTradingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TradingPlan> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("trading_plans")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading_plans"] }),
  });
}

export function useDeleteTradingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("trading_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading_plans"] }),
  });
}
