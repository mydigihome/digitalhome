import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: any;
  content_preview: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export function useNotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
    enabled: !!user,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (note: { title?: string; content?: any; content_preview?: string }) => {
      const { data, error } = await supabase
        .from("notes")
        .insert({ ...note, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: any; content_preview?: string; position?: number }) => {
      const { data, error } = await supabase
        .from("notes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useReorderNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notes: { id: string; position: number }[]) => {
      const promises = notes.map(({ id, position }) =>
        supabase.from("notes").update({ position }).eq("id", id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}
