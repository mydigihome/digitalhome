import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Expense {
  id: string;
  user_id: string;
  description: string;
  category: string;
  amount: number;
  frequency: string;
  priority: string;
  expense_date: string;
  created_at: string;
}

export function useExpenses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["expenses", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("expenses")
        .select("*")
        .eq("user_id", user!.id)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (expense: Omit<Expense, "id" | "user_id" | "created_at">) => {
      const { error } = await (supabase as any)
        .from("expenses")
        .insert({ ...expense, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("expenses")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}
