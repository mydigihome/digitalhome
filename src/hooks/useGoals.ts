import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoalStage {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  position: number;
  created_at: string;
}

export interface GoalTask {
  id: string;
  stage_id: string;
  project_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
}

export function useGoalStages(projectId: string | undefined) {
  return useQuery({
    queryKey: ["goal_stages", projectId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("goal_stages")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as GoalStage[];
    },
    enabled: !!projectId,
  });
}

export function useGoalTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: ["goal_tasks", projectId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("goal_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as GoalTask[];
    },
    enabled: !!projectId,
  });
}

export function useCreateGoalStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stage: { project_id: string; name: string; description?: string; position: number }) => {
      const { data, error } = await (supabase as any)
        .from("goal_stages")
        .insert(stage)
        .select()
        .single();
      if (error) throw error;
      return data as GoalStage;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["goal_stages", data.project_id] }),
  });
}

export function useCreateGoalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: { stage_id: string; project_id: string; title: string; position: number }) => {
      const { error } = await (supabase as any)
        .from("goal_tasks")
        .insert(task);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goal_tasks"] }),
  });
}

export function useUpdateGoalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GoalTask> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("goal_tasks")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goal_tasks"] }),
  });
}

export function useDeleteGoalStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("goal_stages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goal_stages"] }),
  });
}

export function useDeleteGoalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("goal_tasks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goal_tasks"] }),
  });
}
