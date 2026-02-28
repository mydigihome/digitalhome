import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Resume {
  id: string;
  user_id: string;
  application_id: string | null;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  notes: string | null;
  tags: string[];
  is_starred: boolean;
  last_sent_date: string | null;
  created_at: string;
}

export function useResumes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["resumes", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resumes")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Resume[];
    },
    enabled: !!user,
  });
}

export function useCreateResume() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (resume: Pick<Resume, "title" | "file_url" | "file_type" | "file_size" | "notes" | "application_id">) => {
      const { error } = await (supabase as any)
        .from("resumes")
        .insert({ ...resume, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resumes"] }),
  });
}

export function useUpdateResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Resume> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("resumes")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resumes"] }),
  });
}

export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("resumes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resumes"] }),
  });
}
