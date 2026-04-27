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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      exam_images: {
        Row: {
          created_at: string
          description_de: string
          description_pt: string
          difficulty: string
          id: string
          url: string
        }
        Insert: {
          created_at?: string
          description_de: string
          description_pt: string
          difficulty?: string
          id?: string
          url: string
        }
        Update: {
          created_at?: string
          description_de?: string
          description_pt?: string
          difficulty?: string
          id?: string
          url?: string
        }
        Relationships: []
      }
      exam_recordings: {
        Row: {
          created_at: string
          duration_sec: number | null
          id: string
          part: number
          part_feedback: Json | null
          session_id: string
          storage_path: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          id?: string
          part: number
          part_feedback?: Json | null
          session_id: string
          storage_path: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          id?: string
          part?: number
          part_feedback?: Json | null
          session_id?: string
          storage_path?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          completed_at: string | null
          feedback: Json | null
          id: string
          image_id: string | null
          mode: string
          notes: string | null
          scores: Json | null
          started_at: string
          status: string
          theme_id: string | null
          total_score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          feedback?: Json | null
          id?: string
          image_id?: string | null
          mode?: string
          notes?: string | null
          scores?: Json | null
          started_at?: string
          status?: string
          theme_id?: string | null
          total_score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          feedback?: Json | null
          id?: string
          image_id?: string | null
          mode?: string
          notes?: string | null
          scores?: Json | null
          started_at?: string
          status?: string
          theme_id?: string | null
          total_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "exam_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_sessions_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "exam_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_themes: {
        Row: {
          created_at: string
          description_de: string
          description_pt: string
          difficulty: string
          discussion_questions_de: string[]
          discussion_questions_pt: string[]
          id: string
          redemittel: string[]
          tips_de: string[]
          tips_pt: string[]
          title_de: string
          title_pt: string
        }
        Insert: {
          created_at?: string
          description_de: string
          description_pt: string
          difficulty?: string
          discussion_questions_de?: string[]
          discussion_questions_pt?: string[]
          id?: string
          redemittel?: string[]
          tips_de?: string[]
          tips_pt?: string[]
          title_de: string
          title_pt: string
        }
        Update: {
          created_at?: string
          description_de?: string
          description_pt?: string
          difficulty?: string
          discussion_questions_de?: string[]
          discussion_questions_pt?: string[]
          id?: string
          redemittel?: string[]
          tips_de?: string[]
          tips_pt?: string[]
          title_de?: string
          title_pt?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          consent_at: string | null
          consent_marketing: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          consent_at?: string | null
          consent_marketing?: boolean
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          consent_at?: string | null
          consent_marketing?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          whatsapp?: string
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
