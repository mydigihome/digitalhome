import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserFinances {
  id: string;
  user_id: string;
  monthly_income: number;
  total_debt: number;
  credit_score: number | null;
  savings_goal: number;
  current_savings: number;
  has_student_loans: boolean;
  invests: boolean;
  investment_types: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserFinances() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_finances", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_finances")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserFinances | null;
    },
    enabled: !!user,
  });
}

export function useUpsertUserFinances() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (finances: Partial<Omit<UserFinances, "id" | "user_id" | "created_at" | "updated_at">>) => {
      const { error } = await (supabase as any)
        .from("user_finances")
        .upsert({ ...finances, user_id: user!.id }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_finances"] }),
  });
}
