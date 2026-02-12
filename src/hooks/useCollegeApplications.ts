import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CollegeApplication {
  id: string;
  user_id: string;
  status: string;
  college_name: string;
  contact_name: string | null;
  contact_email: string | null;
  open_house_date: string | null;
  early_action_date: string | null;
  final_deadline: string;
  school_link: string | null;
  rec_letters: string | null;
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export function useCollegeApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["college_applications", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("college_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("final_deadline", { ascending: true });
      if (error) throw error;
      return data as CollegeApplication[];
    },
    enabled: !!user,
  });
}

export function useCreateCollegeApp() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (app: Partial<Omit<CollegeApplication, "id" | "user_id" | "created_at" | "updated_at">>) => {
      const { error } = await (supabase as any)
        .from("college_applications")
        .insert({ ...app, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["college_applications"] }),
  });
}

export function useUpdateCollegeApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CollegeApplication>) => {
      const { error } = await (supabase as any)
        .from("college_applications")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["college_applications"] }),
  });
}

export function useDeleteCollegeApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("college_applications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["college_applications"] }),
  });
}
