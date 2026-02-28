import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: any;
  content_preview: string | null;
  mood_emoji: string | null;
  mood_text: string | null;
  entry_date: string;
  is_locked: boolean;
  pin_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalMedia {
  id: string;
  entry_id: string;
  media_type: string;
  file_url: string;
  created_at: string;
}

export function useJournalEntries(filter?: { period?: string; locked?: boolean; search?: string; sort?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["journal-entries", user?.id, filter],
    queryFn: async () => {
      let query = supabase
        .from("journal_entries")
        .select("*");

      if (filter?.locked) {
        query = query.eq("is_locked", true);
      }

      if (filter?.search) {
        query = query.or(`title.ilike.%${filter.search}%,content_preview.ilike.%${filter.search}%`);
      }

      if (filter?.period === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("entry_date", weekAgo.toISOString().split("T")[0]);
      } else if (filter?.period === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte("entry_date", monthAgo.toISOString().split("T")[0]);
      }

      if (filter?.sort === "oldest") {
        query = query.order("created_at", { ascending: true });
      } else if (filter?.sort === "mood") {
        query = query.order("mood_emoji", { ascending: true }).order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as JournalEntry[];
    },
    enabled: !!user,
  });
}

export function useJournalEntry(id: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["journal-entry", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as JournalEntry;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (entry: Partial<JournalEntry>) => {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({ ...entry, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal-entries"] }),
  });
}

export function useUpdateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<JournalEntry>) => {
      const { error } = await supabase
        .from("journal_entries")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["journal-entry"] });
    },
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal-entries"] }),
  });
}

export function useJournalMedia(entryId: string | null) {
  return useQuery({
    queryKey: ["journal-media", entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_media")
        .select("*")
        .eq("entry_id", entryId!)
        .order("created_at");
      if (error) throw error;
      return data as JournalMedia[];
    },
    enabled: !!entryId,
  });
}

export function useCreateJournalMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (media: { entry_id: string; media_type: string; file_url: string }) => {
      const { data, error } = await supabase
        .from("journal_media")
        .insert(media)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["journal-media", vars.entry_id] }),
  });
}
