import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface BrainDump {
  id: string;
  user_id: string;
  type: string;
  content: string;
  tags: string[] | null;
  processed: boolean;
  created_at: string;
  card_color: string | null;
  ai_title: string | null;
  summary: string | null;
  structured_data: Record<string, any> | null;
}

export function useBrainDumps() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["brain_dumps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brain_dumps")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as BrainDump[];
    },
    enabled: !!user,
  });
}

export function useCreateBrainDump() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (dump: {
      type: string;
      content: string;
      tags?: string[];
      card_color?: string;
      ai_title?: string;
      summary?: string;
      structured_data?: Record<string, any>;
      processed?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("brain_dumps")
        .insert({ ...dump, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brain_dumps"] }),
  });
}
