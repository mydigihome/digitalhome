import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Application {
  id: string;
  user_id: string;
  company_name: string;
  position_title: string;
  category: string;
  status: string;
  application_date: string;
  application_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Application[];
    },
    enabled: !!user,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (app: Pick<Application, "company_name" | "position_title" | "category" | "status" | "application_date" | "application_url" | "notes">) => {
      const { error } = await (supabase as any)
        .from("applications")
        .insert({ ...app, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Application> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("applications")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("applications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}
