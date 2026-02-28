import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface BrandCollaboration {
  id: string;
  user_id: string;
  brand_name: string;
  contact_name: string;
  contact_email: string;
  status: string;
  deal_value: number;
  campaign_start: string | null;
  campaign_end: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useBrandCollaborations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["brand-collabs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_collaborations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BrandCollaboration[];
    },
  });
}

export function useCreateBrandCollab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (collab: Omit<BrandCollaboration, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("brand_collaborations")
        .insert({ ...collab, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-collabs"] }),
  });
}

export function useUpdateBrandCollab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<BrandCollaboration> & { id: string }) => {
      const { error } = await supabase
        .from("brand_collaborations")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-collabs"] }),
  });
}

export function useDeleteBrandCollab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brand_collaborations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-collabs"] }),
  });
}
