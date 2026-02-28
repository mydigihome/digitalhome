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
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          target_roles: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          target_roles?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          target_roles?: string[] | null
          title?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          application_date: string
          application_url: string | null
          category: string
          company_name: string
          created_at: string
          id: string
          notes: string | null
          position_title: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_date?: string
          application_url?: string | null
          category?: string
          company_name: string
          created_at?: string
          id?: string
          notes?: string | null
          position_title: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_date?: string
          application_url?: string | null
          category?: string
          company_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          position_title?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brain_dumps: {
        Row: {
          ai_title: string | null
          card_color: string | null
          card_opacity: number | null
          content: string
          created_at: string
          id: string
          processed: boolean | null
          structured_data: Json | null
          summary: string | null
          tags: string[] | null
          type: string
          user_id: string
        }
        Insert: {
          ai_title?: string | null
          card_color?: string | null
          card_opacity?: number | null
          content: string
          created_at?: string
          id?: string
          processed?: boolean | null
          structured_data?: Json | null
          summary?: string | null
          tags?: string[] | null
          type: string
          user_id: string
        }
        Update: {
          ai_title?: string | null
          card_color?: string | null
          card_opacity?: number | null
          content?: string
          created_at?: string
          id?: string
          processed?: boolean | null
          structured_data?: Json | null
          summary?: string | null
          tags?: string[] | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_collaborations: {
        Row: {
          brand_name: string
          campaign_end: string | null
          campaign_start: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          deal_value: number | null
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_name?: string
          campaign_end?: string | null
          campaign_start?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          deal_value?: number | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_name?: string
          campaign_end?: string | null
          campaign_start?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          deal_value?: number | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean
          attendees: Json | null
          color: string | null
          created_at: string
          deleted_locally: boolean
          description: string | null
          edited_locally: boolean
          end_time: string | null
          google_calendar_id: string | null
          google_event_id: string | null
          hidden: boolean
          id: string
          location: string | null
          source: string
          start_time: string
          synced_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          attendees?: Json | null
          color?: string | null
          created_at?: string
          deleted_locally?: boolean
          description?: string | null
          edited_locally?: boolean
          end_time?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          hidden?: boolean
          id?: string
          location?: string | null
          source?: string
          start_time: string
          synced_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          attendees?: Json | null
          color?: string | null
          created_at?: string
          deleted_locally?: boolean
          description?: string | null
          edited_locally?: boolean
          end_time?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          hidden?: boolean
          id?: string
          location?: string | null
          source?: string
          start_time?: string
          synced_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      child_investments: {
        Row: {
          amount: number
          child_name: string
          created_at: string
          id: string
          investment_type: string
          user_id: string
        }
        Insert: {
          amount?: number
          child_name: string
          created_at?: string
          id?: string
          investment_type: string
          user_id: string
        }
        Update: {
          amount?: number
          child_name?: string
          created_at?: string
          id?: string
          investment_type?: string
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
      college_applications: {
        Row: {
          college_name: string
          contact_email: string | null
          contact_name: string | null
          created_at: string
          early_action_date: string | null
          final_deadline: string
          id: string
          notes: string | null
          open_house_date: string | null
          position: number | null
          rec_letters: string | null
          school_link: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          college_name: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          early_action_date?: string | null
          final_deadline: string
          id?: string
          notes?: string | null
          open_house_date?: string | null
          position?: number | null
          rec_letters?: string | null
          school_link?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          college_name?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          early_action_date?: string | null
          final_deadline?: string
          id?: string
          notes?: string | null
          open_house_date?: string | null
          position?: number | null
          rec_letters?: string | null
          school_link?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_caption_ideas: {
        Row: {
          caption_text: string
          category: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          caption_text?: string
          category?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          caption_text?: string
          category?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      content_planner_data: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
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
      event_details: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          event_type: string
          id: string
          location: string | null
          location_type: string
          privacy: string
          project_id: string
          rsvp_deadline: string | null
          share_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          location?: string | null
          location_type?: string
          privacy?: string
          project_id: string
          rsvp_deadline?: string | null
          share_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          location?: string | null
          location_type?: string
          privacy?: string
          project_id?: string
          rsvp_deadline?: string | null
          share_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_details_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guests: {
        Row: {
          created_at: string
          email: string
          event_id: string
          id: string
          name: string | null
          rsvp_answers: Json | null
          rsvp_at: string | null
          status: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          id?: string
          name?: string | null
          rsvp_answers?: Json | null
          rsvp_at?: string | null
          status?: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          id?: string
          name?: string | null
          rsvp_answers?: Json | null
          rsvp_at?: string | null
          status?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_details"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvp_questions: {
        Row: {
          event_id: string
          id: string
          position: number
          question_text: string
          question_type: string
        }
        Insert: {
          event_id: string
          id?: string
          position?: number
          question_text: string
          question_type?: string
        }
        Update: {
          event_id?: string
          id?: string
          position?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvp_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_details"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          frequency: string
          id: string
          priority: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          frequency?: string
          id?: string
          priority?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          frequency?: string
          id?: string
          priority?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          rating: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          rating?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          rating?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gmail_tokens: {
        Row: {
          access_token: string
          created_at: string
          email: string | null
          expires_at: string | null
          id: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          project_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          project_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          position: number
          project_id: string
          stage_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          position?: number
          project_id: string
          stage_id: string
          title: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          position?: number
          project_id?: string
          stage_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "goal_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          calendar_email: string | null
          created_at: string
          id: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_email?: string | null
          created_at?: string
          id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_email?: string | null
          created_at?: string
          id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          hours: number
          id: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          hours: number
          id?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          hours?: number
          id?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          id: string
          is_custom: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_custom?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_custom?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          asset_name: string
          asset_type: string
          created_at: string
          current_price: number | null
          id: string
          purchase_date: string
          purchase_price: number
          quantity: number
          ticker_symbol: string | null
          user_id: string
        }
        Insert: {
          asset_name: string
          asset_type?: string
          created_at?: string
          current_price?: number | null
          id?: string
          purchase_date?: string
          purchase_price: number
          quantity: number
          ticker_symbol?: string | null
          user_id: string
        }
        Update: {
          asset_name?: string
          asset_type?: string
          created_at?: string
          current_price?: number | null
          id?: string
          purchase_date?: string
          purchase_price?: number
          quantity?: number
          ticker_symbol?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journal_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          completed_at: string | null
          entry_id: string
          id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          completed_at?: string | null
          entry_id: string
          id?: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          completed_at?: string | null
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_activities_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: Json | null
          content_preview: string | null
          created_at: string
          entry_date: string
          id: string
          is_locked: boolean
          mood_emoji: string | null
          mood_text: string | null
          pin_hash: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          content_preview?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          is_locked?: boolean
          mood_emoji?: string | null
          mood_text?: string | null
          pin_hash?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          content_preview?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          is_locked?: boolean
          mood_emoji?: string | null
          mood_text?: string | null
          pin_hash?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_media: {
        Row: {
          created_at: string
          entry_id: string
          file_url: string
          id: string
          media_type: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          file_url: string
          id?: string
          media_type?: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          file_url?: string
          id?: string
          media_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_media_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          created_at: string
          id: string
          interest_rate: number
          loan_type: string
          monthly_payment: number
          provider_name: string | null
          provider_phone: string | null
          provider_website: string | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          interest_rate?: number
          loan_type?: string
          monthly_payment?: number
          provider_name?: string | null
          provider_phone?: string | null
          provider_website?: string | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          interest_rate?: number
          loan_type?: string
          monthly_payment?: number
          provider_name?: string | null
          provider_phone?: string | null
          provider_website?: string | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          card_color: string | null
          card_opacity: number | null
          content: Json | null
          content_preview: string | null
          created_at: string
          id: string
          position: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_color?: string | null
          card_opacity?: number | null
          content?: Json | null
          content_preview?: string | null
          created_at?: string
          id?: string
          position?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_color?: string | null
          card_opacity?: number | null
          content?: Json | null
          content_preview?: string | null
          created_at?: string
          id?: string
          position?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          founding_member: boolean
          full_name: string | null
          id: string
          last_login: string | null
          updated_at: string
          user_number: number
        }
        Insert: {
          created_at?: string
          founding_member?: boolean
          full_name?: string | null
          id: string
          last_login?: string | null
          updated_at?: string
          user_number?: number
        }
        Update: {
          created_at?: string
          founding_member?: boolean
          full_name?: string | null
          id?: string
          last_login?: string | null
          updated_at?: string
          user_number?: number
        }
        Relationships: []
      }
      project_resources: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          project_id: string
          resource_type: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          project_id: string
          resource_type?: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          project_id?: string
          resource_type?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      resumes: {
        Row: {
          application_id: string | null
          created_at: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          is_starred: boolean
          last_sent_date: string | null
          notes: string | null
          tags: string[]
          title: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          is_starred?: boolean
          last_sent_date?: string | null
          notes?: string | null
          tags?: string[]
          title: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_starred?: boolean
          last_sent_date?: string | null
          notes?: string | null
          tags?: string[]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      student_verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          user_id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          user_id?: string
          verified?: boolean
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
      tracked_threads: {
        Row: {
          category: string
          id: string
          last_activity_at: string | null
          preview: string | null
          sender_email: string | null
          sender_name: string | null
          status: string
          subject: string | null
          thread_id: string
          tracked_at: string
          user_id: string
        }
        Insert: {
          category?: string
          id?: string
          last_activity_at?: string | null
          preview?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string
          subject?: string | null
          thread_id: string
          tracked_at?: string
          user_id: string
        }
        Update: {
          category?: string
          id?: string
          last_activity_at?: string | null
          preview?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string
          subject?: string | null
          thread_id?: string
          tracked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_finances: {
        Row: {
          created_at: string
          credit_score: number | null
          current_savings: number
          has_student_loans: boolean
          id: string
          investment_types: string[] | null
          invests: boolean
          monthly_income: number
          onboarding_completed: boolean
          savings_goal: number
          total_debt: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_score?: number | null
          current_savings?: number
          has_student_loans?: boolean
          id?: string
          investment_types?: string[] | null
          invests?: boolean
          monthly_income?: number
          onboarding_completed?: boolean
          savings_goal?: number
          total_debt?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_score?: number | null
          current_savings?: number
          has_student_loans?: boolean
          id?: string
          investment_types?: string[] | null
          invests?: boolean
          monthly_income?: number
          onboarding_completed?: boolean
          savings_goal?: number
          total_debt?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accent_colors: Json | null
          app_banner_text: string | null
          app_banner_url: string | null
          bio: string | null
          created_at: string
          custom_folder_colors: boolean | null
          dashboard_cover: string | null
          dashboard_cover_type: string | null
          dashboard_icon: string | null
          dashboard_icon_type: string | null
          density: string | null
          font_size: string | null
          home_name: string | null
          home_style: string | null
          id: string
          is_subscribed: boolean | null
          location: string | null
          onboarding_completed: boolean | null
          onboarding_focus: string | null
          profile_photo: string | null
          sidebar_theme: string | null
          student_email: string | null
          student_verified: boolean | null
          subscription_type: string | null
          theme_color: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
          user_type: string | null
          wealth_banner_text: string | null
          wealth_banner_text_color: string | null
          wealth_banner_url: string | null
          website: string | null
          welcome_video_url: string | null
          welcome_video_watched: boolean | null
        }
        Insert: {
          accent_colors?: Json | null
          app_banner_text?: string | null
          app_banner_url?: string | null
          bio?: string | null
          created_at?: string
          custom_folder_colors?: boolean | null
          dashboard_cover?: string | null
          dashboard_cover_type?: string | null
          dashboard_icon?: string | null
          dashboard_icon_type?: string | null
          density?: string | null
          font_size?: string | null
          home_name?: string | null
          home_style?: string | null
          id?: string
          is_subscribed?: boolean | null
          location?: string | null
          onboarding_completed?: boolean | null
          onboarding_focus?: string | null
          profile_photo?: string | null
          sidebar_theme?: string | null
          student_email?: string | null
          student_verified?: boolean | null
          subscription_type?: string | null
          theme_color?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
          wealth_banner_text?: string | null
          wealth_banner_text_color?: string | null
          wealth_banner_url?: string | null
          website?: string | null
          welcome_video_url?: string | null
          welcome_video_watched?: boolean | null
        }
        Update: {
          accent_colors?: Json | null
          app_banner_text?: string | null
          app_banner_url?: string | null
          bio?: string | null
          created_at?: string
          custom_folder_colors?: boolean | null
          dashboard_cover?: string | null
          dashboard_cover_type?: string | null
          dashboard_icon?: string | null
          dashboard_icon_type?: string | null
          density?: string | null
          font_size?: string | null
          home_name?: string | null
          home_style?: string | null
          id?: string
          is_subscribed?: boolean | null
          location?: string | null
          onboarding_completed?: boolean | null
          onboarding_focus?: string | null
          profile_photo?: string | null
          sidebar_theme?: string | null
          student_email?: string | null
          student_verified?: boolean | null
          subscription_type?: string | null
          theme_color?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
          wealth_banner_text?: string | null
          wealth_banner_text_color?: string | null
          wealth_banner_url?: string | null
          website?: string | null
          welcome_video_url?: string | null
          welcome_video_watched?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vision_boards: {
        Row: {
          created_at: string
          deleted_at: string | null
          elements: Json
          id: string
          name: string
          thumbnail: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          elements?: Json
          id?: string
          name: string
          thumbnail?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          elements?: Json
          id?: string
          name?: string
          thumbnail?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wealth_goals: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          is_completed: boolean | null
          linked_project_id: string | null
          progress: number | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          is_completed?: boolean | null
          linked_project_id?: string | null
          progress?: number | null
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          is_completed?: boolean | null
          linked_project_id?: string | null
          progress?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wealth_goals_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      wealth_layout: {
        Row: {
          card_order: Json
          created_at: string
          hidden_cards: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_order?: Json
          created_at?: string
          hidden_cards?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_order?: Json
          created_at?: string
          hidden_cards?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "main_account" | "moderator" | "super_admin"
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
    Enums: {
      app_role: ["student", "main_account", "moderator", "super_admin"],
    },
  },
} as const
