import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  position: number;
  duration: number | null;
  min_chunk: number | null;
  assignee: string | null;
  labels: string[];
  blocked_by: string[];
  auto_scheduled: boolean;
  created_at: string;
  updated_at: string;
}

export function useTasks(projectId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      let q = supabase.from("tasks").select("*").order("position", { ascending: true });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });
}

export function useAllTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tasks", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (task: { title: string; project_id: string; description?: string; status?: string; priority?: string; due_date?: string | null; position?: number; duration?: number | null; min_chunk?: number | null; assignee?: string | null; labels?: string[]; auto_scheduled?: boolean }) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; description?: string | null; status?: string; priority?: string; due_date?: string | null; position?: number; duration?: number | null; min_chunk?: number | null; assignee?: string | null; labels?: string[]; auto_scheduled?: boolean }) => {
      const { error } = await supabase.from("tasks").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
