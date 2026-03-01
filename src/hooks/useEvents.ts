import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface EventDetails {
  id: string;
  project_id: string;
  event_date: string | null;
  location: string | null;
  location_type: string;
  description: string | null;
  rsvp_deadline: string | null;
  privacy: string;
  share_token: string;
  event_type: string;
  shared_album_enabled: boolean;
  external_link_url: string | null;
  external_link_label: string | null;
  playlist_url: string | null;
  background_style: string;
  created_at: string;
  updated_at: string;
}

export interface EventGuest {
  id: string;
  event_id: string;
  email: string;
  name: string | null;
  status: string;
  viewed_at: string | null;
  rsvp_at: string | null;
  rsvp_answers: Record<string, any>;
  created_at: string;
}

export interface RsvpQuestion {
  id: string;
  event_id: string;
  question_text: string;
  question_type: string;
  position: number;
}

export function useEventDetails(projectId: string | undefined) {
  return useQuery({
    queryKey: ["event_details", projectId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("event_details")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data as EventDetails | null;
    },
    enabled: !!projectId,
  });
}

export function useUpsertEventDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (details: Partial<EventDetails> & { project_id: string }) => {
      const { data, error } = await (supabase as any)
        .from("event_details")
        .upsert(details, { onConflict: "project_id" })
        .select()
        .single();
      if (error) throw error;
      return data as EventDetails;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["event_details", data.project_id] });
    },
  });
}

export function useEventGuests(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event_guests", eventId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
    enabled: !!eventId,
  });
}

export function useAddEventGuests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (guests: Array<{ event_id: string; email: string; name?: string }>) => {
      const { error } = await (supabase as any)
        .from("event_guests")
        .insert(guests);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_guests"] }),
  });
}

export function useUpdateEventGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EventGuest> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("event_guests")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_guests"] }),
  });
}

export function useDeleteEventGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("event_guests")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_guests"] }),
  });
}

export function useRsvpQuestions(eventId: string | undefined) {
  return useQuery({
    queryKey: ["rsvp_questions", eventId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("event_rsvp_questions")
        .select("*")
        .eq("event_id", eventId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as RsvpQuestion[];
    },
    enabled: !!eventId,
  });
}

export function useCreateRsvpQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: { event_id: string; question_text: string; question_type?: string; position?: number }) => {
      const { error } = await (supabase as any)
        .from("event_rsvp_questions")
        .insert(q);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvp_questions"] }),
  });
}

export function useDeleteRsvpQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("event_rsvp_questions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvp_questions"] }),
  });
}
