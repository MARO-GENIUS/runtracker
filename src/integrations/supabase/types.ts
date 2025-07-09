export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          completed_at: string | null
          created_at: string
          generated_at: string
          id: string
          is_manual_match: boolean | null
          matching_activity_id: number | null
          recommendation_data: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          is_manual_match?: boolean | null
          matching_activity_id?: number | null
          recommendation_data: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          is_manual_match?: boolean | null
          matching_activity_id?: number | null
          recommendation_data?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_goals: {
        Row: {
          created_at: string
          goal_km: number
          id: string
          month: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          goal_km?: number
          id?: string
          month: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          goal_km?: number
          id?: string
          month?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          activity_id: number | null
          created_at: string
          date: string
          distance_meters: number
          distance_type: string
          id: string
          location: string | null
          time_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id?: number | null
          created_at?: string
          date: string
          distance_meters: number
          distance_type: string
          id?: string
          location?: string | null
          time_seconds: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: number | null
          created_at?: string
          date?: string
          distance_meters?: number
          distance_type?: string
          id?: string
          location?: string | null
          time_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "strava_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          profile_picture: string | null
          strava_access_token: string | null
          strava_expires_at: number | null
          strava_refresh_token: string | null
          strava_user_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          profile_picture?: string | null
          strava_access_token?: string | null
          strava_expires_at?: number | null
          strava_refresh_token?: string | null
          strava_user_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          profile_picture?: string | null
          strava_access_token?: string | null
          strava_expires_at?: number | null
          strava_refresh_token?: string | null
          strava_user_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      strava_activities: {
        Row: {
          average_heartrate: number | null
          average_speed: number | null
          calories: number | null
          created_at: string
          distance: number
          effort_notes: string | null
          effort_rating: number | null
          elapsed_time: number
          id: number
          location_city: string | null
          location_country: string | null
          location_state: string | null
          max_heartrate: number | null
          max_speed: number | null
          moving_time: number
          name: string
          session_type: string | null
          start_date: string
          start_date_local: string
          suffer_score: number | null
          total_elevation_gain: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          average_heartrate?: number | null
          average_speed?: number | null
          calories?: number | null
          created_at?: string
          distance: number
          effort_notes?: string | null
          effort_rating?: number | null
          elapsed_time: number
          id: number
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          max_heartrate?: number | null
          max_speed?: number | null
          moving_time: number
          name: string
          session_type?: string | null
          start_date: string
          start_date_local: string
          suffer_score?: number | null
          total_elevation_gain?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          average_heartrate?: number | null
          average_speed?: number | null
          calories?: number | null
          created_at?: string
          distance?: number
          effort_notes?: string | null
          effort_rating?: number | null
          elapsed_time?: number
          id?: number
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          max_heartrate?: number | null
          max_speed?: number | null
          moving_time?: number
          name?: string
          session_type?: string | null
          start_date?: string
          start_date_local?: string
          suffer_score?: number | null
          total_elevation_gain?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strava_best_efforts: {
        Row: {
          activity_id: number
          created_at: string
          distance: number
          elapsed_time: number | null
          id: string
          moving_time: number
          name: string
          start_date_local: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: number
          created_at?: string
          distance: number
          elapsed_time?: number | null
          id?: string
          moving_time: number
          name: string
          start_date_local: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: number
          created_at?: string
          distance?: number
          elapsed_time?: number | null
          id?: string
          moving_time?: number
          name?: string
          start_date_local?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strava_best_efforts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "strava_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      training_settings: {
        Row: {
          available_time_slots: string[]
          created_at: string
          id: string
          last_session_type: string | null
          max_intensity: string
          preferred_days: string[]
          target_date: string | null
          target_race: string
          target_time_minutes: number | null
          updated_at: string
          user_id: string
          weekly_frequency: number
        }
        Insert: {
          available_time_slots?: string[]
          created_at?: string
          id?: string
          last_session_type?: string | null
          max_intensity?: string
          preferred_days?: string[]
          target_date?: string | null
          target_race?: string
          target_time_minutes?: number | null
          updated_at?: string
          user_id: string
          weekly_frequency?: number
        }
        Update: {
          available_time_slots?: string[]
          created_at?: string
          id?: string
          last_session_type?: string | null
          max_intensity?: string
          preferred_days?: string[]
          target_date?: string | null
          target_race?: string
          target_time_minutes?: number | null
          updated_at?: string
          user_id?: string
          weekly_frequency?: number
        }
        Relationships: []
      }
      user_stats_cache: {
        Row: {
          id: string
          stats_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          stats_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          stats_data?: Json
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
