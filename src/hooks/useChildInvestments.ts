import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChildInvestment {
  id: string;
  user_id: string;
  child_name: string;
  investment_type: string;
  amount: number;
  created_at: string;
}

export function useChildInvestments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["child_investments", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("child_investments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ChildInvestment[];
    },
    enabled: !!user,
  });
}

export function useCreateChildInvestment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (inv: Omit<ChildInvestment, "id" | "user_id" | "created_at">) => {
      const { error } = await (supabase as any)
        .from("child_investments")
        .insert({ ...inv, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["child_investments"] }),
  });
}

export function useDeleteChildInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("child_investments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["child_investments"] }),
  });
}
