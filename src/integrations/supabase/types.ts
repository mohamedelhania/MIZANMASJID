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
      app_settings: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          amount: number
          category: string
          id: string
          month: number
          year: number
        }
        Insert: {
          amount?: number
          category: string
          id?: string
          month: number
          year: number
        }
        Update: {
          amount?: number
          category?: string
          id?: string
          month?: number
          year?: number
        }
        Relationships: []
      }
      fixed_incomes: {
        Row: {
          amount: number
          category: string
          id: string
          month: number
          year: number
        }
        Insert: {
          amount?: number
          category: string
          id?: string
          month: number
          year: number
        }
        Update: {
          amount?: number
          category?: string
          id?: string
          month?: number
          year?: number
        }
        Relationships: []
      }
      jumuah_collections: {
        Row: {
          amount: number
          friday_number: number
          id: string
          month: number
          year: number
        }
        Insert: {
          amount?: number
          friday_number: number
          id?: string
          month: number
          year: number
        }
        Update: {
          amount?: number
          friday_number?: number
          id?: string
          month?: number
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          language: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          language?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
        }
        Relationships: []
      }
      ramadan_entries: {
        Row: {
          amount: number
          concept: string
          created_at: string
          entry_date: string
          id: string
          kind: string
          year: number
        }
        Insert: {
          amount: number
          concept: string
          created_at?: string
          entry_date?: string
          id?: string
          kind: string
          year: number
        }
        Update: {
          amount?: number
          concept?: string
          created_at?: string
          entry_date?: string
          id?: string
          kind?: string
          year?: number
        }
        Relationships: []
      }
      shart_contributors: {
        Row: {
          created_at: string
          id: string
          monthly_amount: number
          name: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_amount?: number
          name: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          monthly_amount?: number
          name?: string
          year?: number
        }
        Relationships: []
      }
      shart_payments: {
        Row: {
          contributor_id: string
          id: string
          month: number
          paid: boolean
        }
        Insert: {
          contributor_id: string
          id?: string
          month: number
          paid?: boolean
        }
        Update: {
          contributor_id?: string
          id?: string
          month?: number
          paid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "shart_payments_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "shart_contributors"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          grade: number | null
          id: string
          student_id: string
          trimester: number
          year: number
        }
        Insert: {
          grade?: number | null
          id?: string
          student_id: string
          trimester: number
          year: number
        }
        Update: {
          grade?: number | null
          id?: string
          student_id?: string
          trimester?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          note_date: string
          student_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_date?: string
          student_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_date?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_payments: {
        Row: {
          amount: number
          id: string
          month: number
          paid: boolean
          student_id: string
          year: number
        }
        Insert: {
          amount?: number
          id?: string
          month: number
          paid?: boolean
          student_id: string
          year: number
        }
        Update: {
          amount?: number
          id?: string
          month?: number
          paid?: boolean
          student_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          enrollment_date: string
          first_name: string
            photo_url?: string | null
          id: string
          last_name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          enrollment_date?: string
          first_name: string
            photo_url?: string | null
          id?: string
          last_name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          enrollment_date?: string
          first_name?: string
            photo_url?: string | null
          id?: string
          last_name?: string
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variable_expenses: {
        Row: {
          amount: number
          concept: string
          created_at: string
          entry_date: string
          id: string
          month: number
          year: number
        }
        Insert: {
          amount: number
          concept: string
          created_at?: string
          entry_date?: string
          id?: string
          month: number
          year: number
        }
        Update: {
          amount?: number
          concept?: string
          created_at?: string
          entry_date?: string
          id?: string
          month?: number
          year?: number
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
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "teacher"
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
      app_role: ["admin", "teacher"],
    },
  },
} as const
