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
      app_settings: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          key: string
          owner_user_id: string
          server_updated_at: string
          updated_at: string
          value: string
          version: number
        }
        Insert: {
          created_at: string
          deleted_at?: string | null
          id: string
          key: string
          owner_user_id?: string
          server_updated_at?: string
          updated_at: string
          value: string
          version: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          key?: string
          owner_user_id?: string
          server_updated_at?: string
          updated_at?: string
          value?: string
          version?: number
        }
        Relationships: []
      }
      exercise_set_logs: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          exercise_name: string
          exercise_order: number
          id: string
          owner_user_id: string
          reps: number
          rir: number | null
          rpe: number | null
          server_updated_at: string
          session_id: string
          set_order: number
          split_type: string
          technique: string | null
          updated_at: string
          version: number
          weight_kg: number
          workout_type: string
        }
        Insert: {
          created_at: string
          date: string
          deleted_at?: string | null
          exercise_name: string
          exercise_order: number
          id: string
          owner_user_id?: string
          reps: number
          rir?: number | null
          rpe?: number | null
          server_updated_at?: string
          session_id: string
          set_order: number
          split_type: string
          technique?: string | null
          updated_at: string
          version: number
          weight_kg: number
          workout_type: string
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          exercise_name?: string
          exercise_order?: number
          id?: string
          owner_user_id?: string
          reps?: number
          rir?: number | null
          rpe?: number | null
          server_updated_at?: string
          session_id?: string
          set_order?: number
          split_type?: string
          technique?: string | null
          updated_at?: string
          version?: number
          weight_kg?: number
          workout_type?: string
        }
        Relationships: []
      }
      readiness_logs: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          id: string
          notes: string
          owner_user_id: string
          pain: number
          readiness_score: number
          server_updated_at: string
          sleep_hours: number
          sleep_quality: number
          stress: number
          updated_at: string
          version: number
        }
        Insert: {
          created_at: string
          date: string
          deleted_at?: string | null
          id: string
          notes: string
          owner_user_id?: string
          pain: number
          readiness_score: number
          server_updated_at?: string
          sleep_hours: number
          sleep_quality: number
          stress: number
          updated_at: string
          version: number
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          id?: string
          notes?: string
          owner_user_id?: string
          pain?: number
          readiness_score?: number
          server_updated_at?: string
          sleep_hours?: number
          sleep_quality?: number
          stress?: number
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          id: string
          kind: string
          message: string
          owner_user_id: string
          reason: string
          server_updated_at: string
          split_type: string | null
          status: string
          updated_at: string
          version: number
          workout_type: string | null
        }
        Insert: {
          created_at: string
          date: string
          deleted_at?: string | null
          id: string
          kind: string
          message: string
          owner_user_id?: string
          reason: string
          server_updated_at?: string
          split_type?: string | null
          status: string
          updated_at: string
          version: number
          workout_type?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          id?: string
          kind?: string
          message?: string
          owner_user_id?: string
          reason?: string
          server_updated_at?: string
          split_type?: string | null
          status?: string
          updated_at?: string
          version?: number
          workout_type?: string | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          duration_min: number
          id: string
          notes: string
          owner_user_id: string
          server_updated_at: string
          split_type: string
          updated_at: string
          version: number
          workout_label: string
          workout_type: string
        }
        Insert: {
          created_at: string
          date: string
          deleted_at?: string | null
          duration_min: number
          id: string
          notes: string
          owner_user_id?: string
          server_updated_at?: string
          split_type: string
          updated_at: string
          version: number
          workout_label: string
          workout_type: string
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          duration_min?: number
          id?: string
          notes?: string
          owner_user_id?: string
          server_updated_at?: string
          split_type?: string
          updated_at?: string
          version?: number
          workout_label?: string
          workout_type?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          id: string
          notes: string
          owner_user_id: string
          server_updated_at: string
          updated_at: string
          version: number
          weight_kg: number
        }
        Insert: {
          created_at: string
          date: string
          deleted_at?: string | null
          id: string
          notes: string
          owner_user_id?: string
          server_updated_at?: string
          updated_at: string
          version: number
          weight_kg: number
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          id?: string
          notes?: string
          owner_user_id?: string
          server_updated_at?: string
          updated_at?: string
          version?: number
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sync_pull: { Args: { since_server_time: string }; Returns: Json }
      sync_push: { Args: { payload: Json }; Returns: Json }
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
