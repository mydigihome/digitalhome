import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CaptionIdea {
  id: string;
  user_id: string;
  caption_text: string;
  category: string;
  created_at: string;
}

export function useCaptionIdeas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["caption-ideas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_caption_ideas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CaptionIdea[];
    },
  });
}

export function useCreateCaptionIdea() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (idea: { caption_text: string; category: string }) => {
      const { error } = await supabase
        .from("content_caption_ideas")
        .insert({ ...idea, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["caption-ideas"] }),
  });
}

export function useDeleteCaptionIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_caption_ideas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["caption-ideas"] }),
  });
}
