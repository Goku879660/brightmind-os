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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ideas: {
        Row: {
          ai_expansion: string | null
          archived: boolean
          cleaned_text: string | null
          created_at: string
          id: string
          raw_text: string
          session_id: string
        }
        Insert: {
          ai_expansion?: string | null
          archived?: boolean
          cleaned_text?: string | null
          created_at?: string
          id?: string
          raw_text: string
          session_id: string
        }
        Update: {
          ai_expansion?: string | null
          archived?: boolean
          cleaned_text?: string | null
          created_at?: string
          id?: string
          raw_text?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          coach_summary: string | null
          commitments: Json
          created_at: string
          date: string
          deep_work_hours: number
          end_time: string
          energy_level: number
          id: string
          learning_hours: number
          motivation_level: number
          priorities: Json
          schedule_blocks: Json
          start_time: string
          task_completion: Json
          tasks: Json
        }
        Insert: {
          coach_summary?: string | null
          commitments?: Json
          created_at?: string
          date: string
          deep_work_hours?: number
          end_time?: string
          energy_level?: number
          id?: string
          learning_hours?: number
          motivation_level?: number
          priorities?: Json
          schedule_blocks?: Json
          start_time?: string
          task_completion?: Json
          tasks?: Json
        }
        Update: {
          coach_summary?: string | null
          commitments?: Json
          created_at?: string
          date?: string
          deep_work_hours?: number
          end_time?: string
          energy_level?: number
          id?: string
          learning_hours?: number
          motivation_level?: number
          priorities?: Json
          schedule_blocks?: Json
          start_time?: string
          task_completion?: Json
          tasks?: Json
        }
        Relationships: []
      }
      reviews: {
        Row: {
          ai_summary: string | null
          context_switched: boolean
          created_at: string
          energy: number
          flow: number
          focus: number
          id: string
          mission_completed: boolean
          motivation: number
          note: string | null
          productivity: number
          session_id: string
          times_distracted: number
        }
        Insert: {
          ai_summary?: string | null
          context_switched?: boolean
          created_at?: string
          energy?: number
          flow?: number
          focus?: number
          id?: string
          mission_completed?: boolean
          motivation?: number
          note?: string | null
          productivity?: number
          session_id: string
          times_distracted?: number
        }
        Update: {
          ai_summary?: string | null
          context_switched?: boolean
          created_at?: string
          energy?: number
          flow?: number
          focus?: number
          id?: string
          mission_completed?: boolean
          motivation?: number
          note?: string | null
          productivity?: number
          session_id?: string
          times_distracted?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          break_minutes: number
          date: string
          ended_at: string | null
          focus_minutes: number
          id: string
          idea_captures: Json
          method: string
          mission: string
          plan_id: string | null
          started_at: string
          switch_attempts: Json
        }
        Insert: {
          break_minutes?: number
          date?: string
          ended_at?: string | null
          focus_minutes?: number
          id?: string
          idea_captures?: Json
          method?: string
          mission: string
          plan_id?: string | null
          started_at?: string
          switch_attempts?: Json
        }
        Update: {
          break_minutes?: number
          date?: string
          ended_at?: string | null
          focus_minutes?: number
          id?: string
          idea_captures?: Json
          method?: string
          mission?: string
          plan_id?: string | null
          started_at?: string
          switch_attempts?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_insights: {
        Row: {
          created_at: string
          id: string
          insight_text: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          insight_text: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          insight_text?: string
          week_start?: string
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
