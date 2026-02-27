import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface GmailEmail {
  id: string;
  threadId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  labelIds: string[];
}

export interface TrackedThread {
  id: string;
  user_id: string;
  thread_id: string;
  subject: string | null;
  sender_name: string | null;
  sender_email: string | null;
  preview: string | null;
  category: string;
  status: string;
  last_activity_at: string | null;
  tracked_at: string;
}

export function useGmailConnection() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gmail-connection", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gmail_tokens")
        .select("id, email, created_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useConnectGmail() {
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    setConnecting(true);
    try {
      // Map lovableproject.com preview to the id-preview URL configured in Google Console
      let origin = window.location.origin;
      if (origin.includes("lovableproject.com")) {
        const projectId = origin.match(/^https:\/\/([^.]+)\./)?.[1];
        if (projectId) {
          origin = `https://id-preview--${projectId}.lovable.app`;
        }
      }
      const redirectUri = `${origin}/inbox`;
      console.log("[Gmail] Requesting auth URL with redirect:", redirectUri);
      const { data, error } = await supabase.functions.invoke("gmail-auth", {
        body: { action: "get_auth_url", redirect_uri: redirectUri },
      });
      if (error) {
        console.error("[Gmail] get_auth_url error:", error);
        throw error;
      }
      console.log("[Gmail] Got auth URL, redirecting...");
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      console.error("[Gmail] Connect failed:", err);
      toast.error(err?.message || "Failed to connect Gmail");
      setConnecting(false);
    }
  };

  return { connect, connecting };
}

export function useHandleGmailCallback() {
  const queryClient = useQueryClient();

  const handleCallback = async (code: string) => {
    let origin = window.location.origin;
    if (origin.includes("lovableproject.com")) {
      const projectId = origin.match(/^https:\/\/([^.]+)\./)?.[1];
      if (projectId) {
        origin = `https://id-preview--${projectId}.lovable.app`;
      }
    }
    const redirectUri = `${origin}/inbox`;
    console.log("[Gmail] Exchanging code with redirect:", redirectUri);
    const { data, error } = await supabase.functions.invoke("gmail-auth", {
      body: { action: "exchange_code", code, redirect_uri: redirectUri },
    });
    if (error) {
      console.error("[Gmail] exchange_code error:", error);
      throw error;
    }
    console.log("[Gmail] Connected successfully:", data?.email);
    queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
    queryClient.invalidateQueries({ queryKey: ["gmail-emails"] });
    toast.success(`Gmail connected: ${data?.email}`);
    return data;
  };

  return { handleCallback };
}

export function useDisconnectGmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("gmail-auth", {
        body: { action: "disconnect" },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
      queryClient.invalidateQueries({ queryKey: ["gmail-emails"] });
      toast.success("Gmail disconnected");
    },
    onError: () => toast.error("Failed to disconnect Gmail"),
  });
}

export function useGmailEmails() {
  const { user } = useAuth();
  const { data: connection } = useGmailConnection();

  return useQuery({
    queryKey: ["gmail-emails", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("gmail-fetch", {
        body: { action: "fetch_messages" },
      });
      if (error) throw error;
      return data as { emails: GmailEmail[]; userEmail: string };
    },
    enabled: !!user && !!connection,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrackedThreads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tracked-threads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_threads")
        .select("*")
        .eq("user_id", user!.id)
        .order("last_activity_at", { ascending: false });
      if (error) throw error;
      return data as TrackedThread[];
    },
    enabled: !!user,
  });
}

export function useTrackThread() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (email: GmailEmail) => {
      const { error } = await supabase.from("tracked_threads").upsert({
        user_id: user!.id,
        thread_id: email.threadId,
        subject: email.subject,
        sender_name: email.senderName,
        sender_email: email.senderEmail,
        preview: email.preview,
        category: "General",
        last_activity_at: email.timestamp ? new Date(email.timestamp).toISOString() : new Date().toISOString(),
      }, { onConflict: "user_id,thread_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-threads"] });
      toast.success("Thread tracked!");
    },
    onError: () => toast.error("Failed to track thread"),
  });
}

export function useUntrackThread() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from("tracked_threads")
        .delete()
        .eq("user_id", user!.id)
        .eq("thread_id", threadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-threads"] });
      toast.success("Thread untracked");
    },
    onError: () => toast.error("Failed to untrack"),
  });
}

export function useUpdateThreadCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ threadId, category }: { threadId: string; category: string }) => {
      const { error } = await supabase
        .from("tracked_threads")
        .update({ category })
        .eq("user_id", user!.id)
        .eq("thread_id", threadId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tracked-threads"] }),
  });
}

export function useWaitingCount() {
  const { data: threads } = useTrackedThreads();
  return threads?.filter(t => t.status === "Waiting for Reply").length || 0;
}
