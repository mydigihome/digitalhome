import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TemplateTask {
  title: string;
  priority: string;
  status: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  color: string;
  tasks: TemplateTask[];
  created_at: string;
}

export function useTemplates() {
  return useQuery({
    queryKey: ["project_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data as any[]).map((t) => ({
        ...t,
        tasks: typeof t.tasks === "string" ? JSON.parse(t.tasks) : t.tasks,
      })) as ProjectTemplate[];
    },
  });
}
