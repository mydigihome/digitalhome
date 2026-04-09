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
  archived: boolean;
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
      // Filter out any projects that were deleted in this session
      return (data as Project[]).filter(p => !deletedProjectIds.has(p.id));
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

// Track deleted IDs to prevent reappearance from refetches
const deletedProjectIds = new Set<string>();

export function useDeleteProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      // Track this ID so it never reappears from cache invalidation
      deletedProjectIds.add(id);

      // Optimistic: remove from cache immediately
      qc.setQueryData<Project[]>(["projects", user?.id], (old) =>
        old ? old.filter((p) => p.id !== id) : []
      );

      // Cascade delete all children before deleting the project
      await supabase.from("goal_tasks" as any).delete().eq("project_id", id);
      await supabase.from("goal_stages" as any).delete().eq("project_id", id);
      await supabase.from("tasks").delete().eq("project_id", id);

      const { data: eventDetails } = await supabase
        .from("event_details")
        .select("id")
        .eq("project_id", id);
      if (eventDetails && eventDetails.length > 0) {
        for (const ed of eventDetails) {
          await supabase.from("event_rsvp_questions" as any).delete().eq("event_id", ed.id);
          await supabase.from("event_guests" as any).delete().eq("event_id", ed.id);
        }
        await supabase.from("event_details").delete().eq("project_id", id);
      }

      await supabase.from("documents").delete().eq("project_id", id);
      await supabase.from("contact_project_links" as any).delete().eq("project_id", id);

      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Do NOT refetch from Supabase — rely on optimistic removal only
      // This prevents deleted items from reappearing due to RLS or timing
    },
    onError: (_err, id) => {
      // On failure, remove from deleted set and refetch to restore
      deletedProjectIds.delete(id);
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export { deletedProjectIds };
