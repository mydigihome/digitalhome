import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  color: string | null;
  location: string | null;
  source: string;
  google_event_id: string | null;
  google_calendar_id: string | null;
  attendees: any;
  hidden: boolean;
  edited_locally: boolean;
  deleted_locally: boolean;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCalendarEvents(dateRange?: { start: string; end: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["calendar_events", dateRange?.start, dateRange?.end],
    queryFn: async () => {
      let q = supabase
        .from("calendar_events")
        .select("*")
        .eq("deleted_locally", false)
        .eq("hidden", false)
        .order("start_time", { ascending: true });
      if (dateRange) {
        q = q.gte("start_time", dateRange.start).lte("start_time", dateRange.end);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });
}

export function useTodayEvents() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
  return useCalendarEvents({ start, end });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (event: {
      title: string;
      start_time: string;
      end_time?: string;
      description?: string;
      all_day?: boolean;
      color?: string;
      location?: string;
    }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({ ...event, user_id: user!.id, source: "manual" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar_events"] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, source, ...data }: { id: string; source?: string; title?: string; deleted_locally?: boolean; hidden?: boolean; edited_locally?: boolean }) => {
      const updateData: any = { ...data };
      if (source && source !== "manual" && data.title) {
        updateData.edited_locally = true;
      }
      const { error } = await supabase.from("calendar_events").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar_events"] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, source }: { id: string; source: string }) => {
      if (source === "manual") {
        const { error } = await supabase.from("calendar_events").delete().eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("calendar_events").update({ deleted_locally: true }).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar_events"] });
    },
  });
}
