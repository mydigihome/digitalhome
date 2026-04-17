import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useOnboardingVideo() {
  return useQuery({
    queryKey: ["onboarding_video"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("onboarding_video")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
}

export function useVideoProgress(videoId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["video_progress", videoId, user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("onboarding_video_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("video_id", videoId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!videoId,
  });
}

export function useDismissVideo() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (videoId: string) => {
      await (supabase as any).from("onboarding_video_progress").upsert({
        user_id: user!.id, video_id: videoId,
        dismissed: true, watched: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,video_id" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video_progress"] }),
  });
}

export function useUploadOnboardingVideo() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ file, title }: { file: File; title: string }) => {
      const ext = file.name.split(".").pop();
      const path = `onboarding/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);
      await (supabase as any).from("onboarding_video").update({ is_active: false }).eq("is_active", true);
      const { error } = await (supabase as any).from("onboarding_video").insert({
        video_url: urlData.publicUrl, title, uploaded_by: user!.id, is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding_video"] }),
  });
}
