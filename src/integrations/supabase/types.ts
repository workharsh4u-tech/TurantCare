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
      access_logs: {
        Row: {
          accessed_by_id: string
          accessed_by_name: string | null
          accessed_by_role: string
          action: string
          created_at: string
          date_group: string | null
          id: string
          patient_id: string
          report_file_id: string | null
        }
        Insert: {
          accessed_by_id: string
          accessed_by_name?: string | null
          accessed_by_role: string
          action?: string
          created_at?: string
          date_group?: string | null
          id?: string
          patient_id: string
          report_file_id?: string | null
        }
        Update: {
          accessed_by_id?: string
          accessed_by_name?: string | null
          accessed_by_role?: string
          action?: string
          created_at?: string
          date_group?: string | null
          id?: string
          patient_id?: string
          report_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_report_file_id_fkey"
            columns: ["report_file_id"]
            isOneToOne: false
            referencedRelation: "report_files"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_summaries: {
        Row: {
          date_group: string
          id: string
          patient_id: string
          summary_text: string
          updated_at: string
        }
        Insert: {
          date_group: string
          id?: string
          patient_id: string
          summary_text: string
          updated_at?: string
        }
        Update: {
          date_group?: string
          id?: string
          patient_id?: string
          summary_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_centers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          created_at: string
          doctor_code: string | null
          email: string | null
          hospital_id: string | null
          id: string
          name: string
          phone: string | null
          role_type: Database["public"]["Enums"]["doctor_role_type"]
          specialization: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_code?: string | null
          email?: string | null
          hospital_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          role_type?: Database["public"]["Enums"]["doctor_role_type"]
          specialization?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_code?: string | null
          email?: string | null
          hospital_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          role_type?: Database["public"]["Enums"]["doctor_role_type"]
          specialization?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          admin_user_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          admin_user_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          admin_user_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number | null
          allergies: string | null
          blood_group: string | null
          card_number: string
          chip_id: string | null
          chronic_conditions: string | null
          created_at: string
          diabetes: boolean | null
          emergency_contact: string | null
          gender: string | null
          id: string
          name: string
          photo_url: string | null
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          allergies?: string | null
          blood_group?: string | null
          card_number?: string
          chip_id?: string | null
          chronic_conditions?: string | null
          created_at?: string
          diabetes?: boolean | null
          emergency_contact?: string | null
          gender?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          pin_hash?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          allergies?: string | null
          blood_group?: string | null
          card_number?: string
          chip_id?: string | null
          chronic_conditions?: string | null
          created_at?: string
          diabetes?: boolean | null
          emergency_contact?: string | null
          gender?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      report_files: {
        Row: {
          created_at: string
          date_group: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          is_private: boolean
          patient_id: string
          report_type: string | null
          uploaded_by_id: string
          uploaded_by_role: string
        }
        Insert: {
          created_at?: string
          date_group?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          is_private?: boolean
          patient_id: string
          report_type?: string | null
          uploaded_by_id: string
          uploaded_by_role: string
        }
        Update: {
          created_at?: string
          date_group?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          is_private?: boolean
          patient_id?: string
          report_type?: string | null
          uploaded_by_id?: string
          uploaded_by_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
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
      set_patient_pin: { Args: { p_pin: string }; Returns: undefined }
      set_pin_admin: {
        Args: { p_pin: string; p_user_id: string }
        Returns: undefined
      }
      verify_patient_pin: {
        Args: { p_patient_id: string; p_pin: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "diagnostic_center" | "hospital_admin"
      doctor_role_type:
        | "doctor_self_clinic"
        | "hospital_admin"
        | "hospital_doctor"
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
      app_role: ["patient", "doctor", "diagnostic_center", "hospital_admin"],
      doctor_role_type: [
        "doctor_self_clinic",
        "hospital_admin",
        "hospital_doctor",
      ],
    },
  },
} as const
