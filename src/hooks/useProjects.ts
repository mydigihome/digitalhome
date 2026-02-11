import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  goal: string | null;
  type: string;
  view_preference: string;
  color: string | null;
  start_date: string | null;
  end_date: string | null;
  icon: string | null;
  icon_type: string | null;
  cover_image: string | null;
  cover_type: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("archived", false)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (project: { name: string; goal?: string; type: string; view_preference: string; start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...project, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; goal?: string; type?: string; view_preference?: string; icon?: string; icon_type?: string; cover_image?: string; cover_type?: string; archived?: boolean }) => {
      const { error } = await supabase.from("projects").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
