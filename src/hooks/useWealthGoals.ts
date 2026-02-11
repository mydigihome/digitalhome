import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface WealthGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  progress: number;
  due_date: string;
  linked_project_id: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export function useWealthGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wealth_goals", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("wealth_goals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WealthGoal[];
    },
    enabled: !!user,
  });
}

export function useCreateWealthGoal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (goal: Pick<WealthGoal, "title" | "description" | "due_date" | "linked_project_id">) => {
      const { error } = await (supabase as any)
        .from("wealth_goals")
        .insert({ ...goal, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wealth_goals"] }),
  });
}

export function useUpdateWealthGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WealthGoal> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("wealth_goals")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wealth_goals"] }),
  });
}

export function useDeleteWealthGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("wealth_goals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wealth_goals"] }),
  });
}
