export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brain_dumps: {
        Row: {
          content: string
          created_at: string
          id: string
          processed: boolean | null
          tags: string[] | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          processed?: boolean | null
          tags?: string[] | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          processed?: boolean | null
          tags?: string[] | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          created_at: string
          id: string
          invited_email: string
          invited_user_id: string | null
          project_ids: string[] | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_email: string
          invited_user_id?: string | null
          project_ids?: string[] | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_email?: string
          invited_user_id?: string | null
          project_ids?: string[] | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_templates: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          tasks: Json
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tasks?: Json
          type?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tasks?: Json
          type?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          archived: boolean
          color: string | null
          cover_image: string | null
          cover_type: string | null
          created_at: string
          end_date: string | null
          goal: string | null
          icon: string | null
          icon_type: string | null
          id: string
          name: string
          start_date: string | null
          type: string
          updated_at: string
          user_id: string
          view_preference: string
        }
        Insert: {
          archived?: boolean
          color?: string | null
          cover_image?: string | null
          cover_type?: string | null
          created_at?: string
          end_date?: string | null
          goal?: string | null
          icon?: string | null
          icon_type?: string | null
          id?: string
          name: string
          start_date?: string | null
          type?: string
          updated_at?: string
          user_id: string
          view_preference?: string
        }
        Update: {
          archived?: boolean
          color?: string | null
          cover_image?: string | null
          cover_type?: string | null
          created_at?: string
          end_date?: string | null
          goal?: string | null
          icon?: string | null
          icon_type?: string | null
          id?: string
          name?: string
          start_date?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          view_preference?: string
        }
        Relationships: []
      }
      resource_engagements: {
        Row: {
          created_at: string
          engagement_type: string
          id: string
          resource_id: number
          resource_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          engagement_type: string
          id?: string
          resource_id: number
          resource_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          engagement_type?: string
          id?: string
          resource_id?: number
          resource_name?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee: string | null
          auto_scheduled: boolean | null
          blocked_by: string[] | null
          created_at: string
          description: string | null
          due_date: string | null
          duration: number | null
          id: string
          labels: string[] | null
          min_chunk: number | null
          position: number
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee?: string | null
          auto_scheduled?: boolean | null
          blocked_by?: string[] | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          duration?: number | null
          id?: string
          labels?: string[] | null
          min_chunk?: number | null
          position?: number
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee?: string | null
          auto_scheduled?: boolean | null
          blocked_by?: string[] | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          duration?: number | null
          id?: string
          labels?: string[] | null
          min_chunk?: number | null
          position?: number
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          accent_colors: Json | null
          bio: string | null
          created_at: string
          custom_folder_colors: boolean | null
          dashboard_cover: string | null
          dashboard_cover_type: string | null
          dashboard_icon: string | null
          dashboard_icon_type: string | null
          density: string | null
          font_size: string | null
          id: string
          location: string | null
          profile_photo: string | null
          sidebar_theme: string | null
          theme_color: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          accent_colors?: Json | null
          bio?: string | null
          created_at?: string
          custom_folder_colors?: boolean | null
          dashboard_cover?: string | null
          dashboard_cover_type?: string | null
          dashboard_icon?: string | null
          dashboard_icon_type?: string | null
          density?: string | null
          font_size?: string | null
          id?: string
          location?: string | null
          profile_photo?: string | null
          sidebar_theme?: string | null
          theme_color?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          accent_colors?: Json | null
          bio?: string | null
          created_at?: string
          custom_folder_colors?: boolean | null
          dashboard_cover?: string | null
          dashboard_cover_type?: string | null
          dashboard_icon?: string | null
          dashboard_icon_type?: string | null
          density?: string | null
          font_size?: string | null
          id?: string
          location?: string | null
          profile_photo?: string | null
          sidebar_theme?: string | null
          theme_color?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
