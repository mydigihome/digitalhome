import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface QuickTodo {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  order: number;
  created_at: string;
}

export function useQuickTodos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["quick_todos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_todos")
        .select("*")
        .eq("user_id", user!.id)
        .order("order", { ascending: true });
      if (error) throw error;
      return data as QuickTodo[];
    },
  });
}

export function useAddQuickTodo() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ text, order }: { text: string; order: number }) => {
      const { error } = await supabase.from("quick_todos").insert({
        user_id: user!.id,
        text,
        order,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quick_todos"] }),
  });
}

export function useUpdateQuickTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuickTodo> & { id: string }) => {
      const { error } = await supabase.from("quick_todos").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quick_todos"] }),
  });
}

export function useDeleteQuickTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quick_todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quick_todos"] }),
  });
}
