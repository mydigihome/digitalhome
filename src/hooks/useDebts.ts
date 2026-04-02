import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Debt {
  id: string;
  user_id: string;
  creditor: string;
  type: string;
  balance: number;
  interest_rate: number;
  monthly_payment: number;
  due_date: string | null;
  status: string;
  notes: string | null;
  payment_url: string | null;
  created_at: string;
}

export function useDebts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["debts", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("debts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Debt[];
    },
    enabled: !!user,
  });
}

export function useAddDebt() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Omit<Debt, "id" | "user_id" | "created_at">) => {
      const { data, error } = await (supabase as any)
        .from("debts")
        .insert({ ...d, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Debt> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("debts")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("debts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export function useAddLoanApplication() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (app: { amount: number; fee: number; interest_rate: number }) => {
      const { data, error } = await (supabase as any)
        .from("loan_applications")
        .insert({ ...app, user_id: user!.id, status: "pending" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loan_applications"] }),
  });
}
