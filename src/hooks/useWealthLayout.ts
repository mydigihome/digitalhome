import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface WealthLayout {
  id: string;
  user_id: string;
  hidden_cards: string[];
  card_order: string[];
  created_at: string;
  updated_at: string;
}

export function useWealthLayout() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wealth_layout", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("wealth_layout")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as WealthLayout | null;
    },
    enabled: !!user,
  });
}

export function useUpsertWealthLayout() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (layout: { hidden_cards: string[]; card_order: string[] }) => {
      const { error } = await (supabase as any)
        .from("wealth_layout")
        .upsert({ ...layout, user_id: user!.id }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wealth_layout"] }),
  });
}
