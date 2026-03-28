import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserPreferences {
  id: string;
  user_id: string;
  dashboard_icon: string | null;
  dashboard_icon_type: string | null;
  dashboard_cover: string | null;
  dashboard_cover_type: string | null;
  theme_color: string | null;
  accent_colors: any;
  profile_photo: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  sidebar_theme: string | null;
  font_size: string | null;
  density: string | null;
  custom_folder_colors: boolean | null;
  user_type: string | null;
  home_name: string | null;
  home_style: string | null;
  onboarding_focus: string | null;
  onboarding_completed: boolean | null;
  welcome_video_url: string | null;
  welcome_video_watched: boolean | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  is_subscribed: boolean | null;
  subscription_type: string | null;
  student_verified: boolean | null;
  student_email: string | null;
  founding_member: boolean | null;
  user_number: number | null;
  onboarding_step: number | null;
  onboarding_skipped_steps: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useUserPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_preferences", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserPreferences | null;
    },
    enabled: !!user,
  });
}

export function useUpsertPreferences() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (prefs: Partial<Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at">>) => {
      const { data: existing } = await (supabase as any)
        .from("user_preferences")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("user_preferences")
          .update(prefs)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("user_preferences")
          .insert({ ...prefs, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_preferences"] }),
  });
}
