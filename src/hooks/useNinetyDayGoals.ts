import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DisplayFormat {
  showWeeks: boolean;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
}

export interface NinetyDayGoal {
  id: string;
  user_id: string;
  goal_text: string;
  start_date: string;
  end_date: string;
  status: string;
  achieved: string | null;
  reflection_notes: string | null;
  display_style: string;
  motivational_style: string;
  weekly_checkins: boolean;
  display_format: DisplayFormat;
  font_style: string;
  text_color: string;
  transparency_level: number;
  created_at: string;
}

export interface GoalCheckIn {
  id: string;
  goal_id: string;
  user_id: string;
  check_in_date: string;
  progress_percentage: number;
  notes: string;
  created_at: string;
}

export function useActiveGoal() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ninety_day_goal_active", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ninety_day_goals")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as NinetyDayGoal | null;
    },
  });
}

export function useGoalHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ninety_day_goal_history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ninety_day_goals")
        .select("*")
        .eq("user_id", user!.id)
        .neq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as NinetyDayGoal[];
    },
  });
}

export function useGoalCheckIns(goalId?: string) {
  return useQuery({
    queryKey: ["goal_check_ins", goalId],
    enabled: !!goalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goal_check_ins")
        .select("*")
        .eq("goal_id", goalId!)
        .order("check_in_date", { ascending: false });
      if (error) throw error;
      return data as GoalCheckIn[];
    },
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (goal: {
      goal_text: string; start_date: string; end_date: string;
      display_style: string; motivational_style: string; weekly_checkins: boolean;
      display_format?: DisplayFormat; font_style?: string; text_color?: string; transparency_level?: number;
    }) => {
      const { display_format, ...rest } = goal;
      const payload: Record<string, unknown> = {
        user_id: user!.id,
        ...rest,
      };
      if (display_format) payload.display_format = display_format as unknown as Record<string, unknown>;
      const { error } = await supabase.from("ninety_day_goals").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ninety_day_goal_active"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NinetyDayGoal> & { id: string }) => {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.display_format) {
        payload.display_format = updates.display_format as unknown as Record<string, unknown>;
      }
      const { error } = await supabase.from("ninety_day_goals").update(payload as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ninety_day_goal_active"] });
      qc.invalidateQueries({ queryKey: ["ninety_day_goal_history"] });
    },
  });
}

export function useAddCheckIn() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (checkIn: { goal_id: string; progress_percentage: number; notes: string }) => {
      const { error } = await supabase.from("goal_check_ins").insert({
        user_id: user!.id,
        ...checkIn,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goal_check_ins"] }),
  });
}
