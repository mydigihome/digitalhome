import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShopTemplate {
  id: string;
  title: string;
  description: string | null;
  template_type: string;
  preview_image_url: string | null;
  file_url: string | null;
  pdf_url: string | null;
  price_cents: number;
  is_active: boolean;
  is_in_bundle: boolean;
  tags: string[];
  download_count: number;
  created_at: string;
}

export function useShopTemplates() {
  return useQuery({
    queryKey: ["shop_templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shop_templates")
        .select("*")
        .eq("is_active", true)
        .order("price_cents", { ascending: true });
      if (error) throw error;
      return data as ShopTemplate[];
    },
  });
}
