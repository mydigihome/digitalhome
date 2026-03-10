import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  photo_url: string | null;
  relationship_type: string | null;
  last_contacted_date: string | null;
  contact_frequency_days: number;
  notes: string | null;
  created_at: string;
}

export interface ContactInteraction {
  id: string;
  contact_id: string;
  user_id: string;
  interaction_type: string | null;
  interaction_date: string;
  title: string | null;
  description: string | null;
}

export function useContacts(filter?: { type?: string; search?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contacts", user?.id, filter],
    queryFn: async () => {
      let query = supabase.from("contacts").select("*").order("name");

      if (filter?.type && filter.type !== "all" && filter.type !== "overdue") {
        query = query.eq("relationship_type", filter.type);
      }

      if (filter?.search) {
        query = query.or(`name.ilike.%${filter.search}%,company.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let contacts = data as Contact[];

      if (filter?.type === "overdue") {
        const now = new Date();
        contacts = contacts.filter((c) => {
          if (!c.last_contacted_date) return true;
          const last = new Date(c.last_contacted_date);
          const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
          return diff > (c.contact_frequency_days || 30);
        });
      }

      return contacts;
    },
    enabled: !!user,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (contact: Partial<Contact>) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({ ...contact, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as Contact;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Contact>) => {
      const { error } = await supabase.from("contacts").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useContactInteractions(contactId: string | null) {
  return useQuery({
    queryKey: ["contact-interactions", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_interactions")
        .select("*")
        .eq("contact_id", contactId!)
        .order("interaction_date", { ascending: false });
      if (error) throw error;
      return data as ContactInteraction[];
    },
    enabled: !!contactId,
  });
}

export function useCreateInteraction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (interaction: Partial<ContactInteraction>) => {
      const { data, error } = await supabase
        .from("contact_interactions")
        .insert({ ...interaction, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      // Also update last_contacted_date
      if (interaction.contact_id) {
        await supabase
          .from("contacts")
          .update({ last_contacted_date: new Date().toISOString() } as any)
          .eq("id", interaction.contact_id);
      }
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact-interactions", vars.contact_id] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
