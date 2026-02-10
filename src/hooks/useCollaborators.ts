import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Collaborator {
  id: string;
  user_id: string;
  invited_email: string;
  invited_user_id: string | null;
  role: string;
  status: string;
  project_ids: string[];
  created_at: string;
  updated_at: string;
}

export function useCollaborators() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["collaborators", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collaborators")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Collaborator[];
    },
    enabled: !!user,
  });
}

export function useCreateCollaborator() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (invite: { invited_email: string; role: string; project_ids?: string[] }) => {
      const { data, error } = await supabase
        .from("collaborators")
        .insert({ ...invite, user_id: user!.id, project_ids: invite.project_ids || [] })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collaborators"] }),
  });
}

export function useUpdateCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; role?: string; status?: string }) => {
      const { error } = await supabase.from("collaborators").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collaborators"] }),
  });
}

export function useDeleteCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collaborators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collaborators"] }),
  });
}
