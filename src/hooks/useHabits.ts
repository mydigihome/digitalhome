import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  is_custom: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  hours: number;
  week_start_date: string;
  created_at: string;
}

const DEFAULT_HABITS = ["Volunteer", "Gym", "Reading"];

export function getCurrentWeekStart() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const diff = today.getDate() - day;
  const weekStart = new Date(today);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().split("T")[0];
}

export function useHabits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });
}

export function useHabitLogs(weekStart?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["habit_logs", user?.id, weekStart],
    queryFn: async () => {
      let query = (supabase as any)
        .from("habit_logs")
        .select("*")
        .eq("user_id", user!.id);
      if (weekStart) {
        query = query.eq("week_start_date", weekStart);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as HabitLog[];
    },
    enabled: !!user,
  });
}

export function useAllHabitLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["habit_logs_all", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("habit_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("week_start_date", { ascending: false });
      if (error) throw error;
      return data as HabitLog[];
    },
    enabled: !!user,
  });
}

export function useEnsureDefaultHabits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: existing } = await (supabase as any)
        .from("habits")
        .select("id")
        .eq("user_id", user!.id);
      if (existing && existing.length > 0) return;
      const rows = DEFAULT_HABITS.map((name) => ({
        user_id: user!.id,
        name,
        is_custom: false,
      }));
      await (supabase as any).from("habits").insert(rows);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useCreateHabit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await (supabase as any)
        .from("habits")
        .insert({ user_id: user!.id, name, is_custom: true });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await (supabase as any)
        .from("habits")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("habits")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      qc.invalidateQueries({ queryKey: ["habit_logs"] });
    },
  });
}

export function useLogHabitHours() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habit_id, hours, week_start_date }: { habit_id: string; hours: number; week_start_date: string }) => {
      const { error } = await (supabase as any)
        .from("habit_logs")
        .insert({ user_id: user!.id, habit_id, hours, week_start_date });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habit_logs"] });
      qc.invalidateQueries({ queryKey: ["habit_logs_all"] });
    },
  });
}

export function useUpdateHabitLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hours }: { id: string; hours: number }) => {
      const { error } = await (supabase as any)
        .from("habit_logs")
        .update({ hours })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habit_logs"] });
      qc.invalidateQueries({ queryKey: ["habit_logs_all"] });
    },
  });
}

export function useDeleteHabitLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("habit_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habit_logs"] });
      qc.invalidateQueries({ queryKey: ["habit_logs_all"] });
    },
  });
}
