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
    mutationFn: async (dump: { type: string; content: string; tags?: string[] }) => {
      const { data, error } = await supabase
        .from("brain_dumps")
        .insert({ ...dump, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brain_dumps"] }),
  });
}
