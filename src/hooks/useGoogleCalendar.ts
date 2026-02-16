import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useGoogleCalendarConnection() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["google_calendar_connection"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_calendar_tokens")
        .select("*")
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });
}

export function useConnectGoogleCalendar() {
  const [connecting, setConnecting] = useState(false);

  const startConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const redirectUri = `${window.location.origin}/calendar`;

      const resp = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "get_auth_url", redirect_uri: redirectUri },
      });

      if (resp.error) throw new Error(resp.error.message);
      const { url } = resp.data;

      // Store redirect URI for callback
      localStorage.setItem("gcal_redirect_uri", redirectUri);

      // Redirect to Google OAuth
      window.location.href = url;
    } catch (err: any) {
      console.error("Connect error:", err);
      toast.error("Failed to connect Google Calendar");
      setConnecting(false);
    }
  }, []);

  return { startConnect, connecting };
}

export function useHandleGoogleCallback() {
  const queryClient = useQueryClient();

  const exchangeCode = useCallback(async (code: string) => {
    try {
      const redirectUri = localStorage.getItem("gcal_redirect_uri") || `${window.location.origin}/calendar`;
      localStorage.removeItem("gcal_redirect_uri");

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const resp = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "exchange_code", code, redirect_uri: redirectUri },
      });

      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) throw new Error(resp.data.error);

      toast.success(`Google Calendar connected — ${resp.data.email || "syncing events"}`);
      queryClient.invalidateQueries({ queryKey: ["google_calendar_connection"] });

      // Trigger sync
      await supabase.functions.invoke("google-calendar-sync", { body: {} });
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });

      // Clean URL
      window.history.replaceState({}, "", "/calendar");
    } catch (err: any) {
      console.error("Exchange error:", err);
      toast.error("Failed to connect — " + err.message);
    }
  }, [queryClient]);

  return { exchangeCode };
}

export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const resp = await supabase.functions.invoke("google-calendar-sync", { body: {} });
      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) throw new Error(resp.data.error);
      return resp.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
      toast.success(`Synced ${data.imported} events from Google Calendar`);
    },
    onError: (err: any) => {
      toast.error("Sync failed — " + err.message);
    },
  });
}

export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const resp = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "disconnect" },
      });
      if (resp.error) throw new Error(resp.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google_calendar_connection"] });
      toast.success("Google Calendar disconnected");
    },
    onError: (err: any) => {
      toast.error("Failed to disconnect — " + err.message);
    },
  });
}
