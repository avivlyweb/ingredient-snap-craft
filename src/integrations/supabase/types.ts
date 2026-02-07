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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          duration_minutes: number | null
          id: string
          intensity: string | null
          logged_via: string
          notes: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          intensity?: string | null
          logged_via?: string
          notes?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          intensity?: string | null
          logged_via?: string
          notes?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          created_at: string
          estimated_calories: number | null
          estimated_protein: number | null
          id: string
          items: string[]
          logged_via: string
          meal_type: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_calories?: number | null
          estimated_protein?: number | null
          id?: string
          items?: string[]
          logged_via?: string
          meal_type?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_calories?: number | null
          estimated_protein?: number | null
          id?: string
          items?: string[]
          logged_via?: string
          meal_type?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nevo_foods: {
        Row: {
          alcohol_total: number | null
          calcium: number | null
          carbohydrate_available: number | null
          created_at: string | null
          energy_kcal: number | null
          energy_kj: number | null
          fat_total: number | null
          fatty_acids_monounsaturated: number | null
          fatty_acids_polyunsaturated: number | null
          fatty_acids_saturated: number | null
          fiber_dietary_total: number | null
          folate: number | null
          food_name_en: string
          food_name_nl: string
          id: string
          iron: number | null
          magnesium: number | null
          nevo_code: string
          phosphorus: number | null
          potassium: number | null
          protein_animal: number | null
          protein_plant: number | null
          protein_total: number | null
          sodium: number | null
          updated_at: string | null
          vitamin_a: number | null
          vitamin_b1: number | null
          vitamin_b12: number | null
          vitamin_b2: number | null
          vitamin_b6: number | null
          vitamin_c: number | null
          vitamin_d: number | null
          vitamin_e: number | null
          vitamin_k: number | null
          water_total: number | null
          zinc: number | null
        }
        Insert: {
          alcohol_total?: number | null
          calcium?: number | null
          carbohydrate_available?: number | null
          created_at?: string | null
          energy_kcal?: number | null
          energy_kj?: number | null
          fat_total?: number | null
          fatty_acids_monounsaturated?: number | null
          fatty_acids_polyunsaturated?: number | null
          fatty_acids_saturated?: number | null
          fiber_dietary_total?: number | null
          folate?: number | null
          food_name_en: string
          food_name_nl: string
          id?: string
          iron?: number | null
          magnesium?: number | null
          nevo_code: string
          phosphorus?: number | null
          potassium?: number | null
          protein_animal?: number | null
          protein_plant?: number | null
          protein_total?: number | null
          sodium?: number | null
          updated_at?: string | null
          vitamin_a?: number | null
          vitamin_b1?: number | null
          vitamin_b12?: number | null
          vitamin_b2?: number | null
          vitamin_b6?: number | null
          vitamin_c?: number | null
          vitamin_d?: number | null
          vitamin_e?: number | null
          vitamin_k?: number | null
          water_total?: number | null
          zinc?: number | null
        }
        Update: {
          alcohol_total?: number | null
          calcium?: number | null
          carbohydrate_available?: number | null
          created_at?: string | null
          energy_kcal?: number | null
          energy_kj?: number | null
          fat_total?: number | null
          fatty_acids_monounsaturated?: number | null
          fatty_acids_polyunsaturated?: number | null
          fatty_acids_saturated?: number | null
          fiber_dietary_total?: number | null
          folate?: number | null
          food_name_en?: string
          food_name_nl?: string
          id?: string
          iron?: number | null
          magnesium?: number | null
          nevo_code?: string
          phosphorus?: number | null
          potassium?: number | null
          protein_animal?: number | null
          protein_plant?: number | null
          protein_total?: number | null
          sodium?: number | null
          updated_at?: string | null
          vitamin_a?: number | null
          vitamin_b1?: number | null
          vitamin_b12?: number | null
          vitamin_b2?: number | null
          vitamin_b6?: number | null
          vitamin_c?: number | null
          vitamin_d?: number | null
          vitamin_e?: number | null
          vitamin_k?: number | null
          water_total?: number | null
          zinc?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      recipe_likes: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_likes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          ambiance_suggestions: string | null
          context_type: string | null
          created_at: string | null
          cuisine_style: string | null
          description: string
          id: string
          image_url: string | null
          ingredient_images: string[] | null
          ingredients: string[]
          is_public: boolean
          leftover_tips: string | null
          plating_guidance: string | null
          serving_suggestion: string | null
          steps: string
          time_management: string | null
          title: string
          updated_at: string | null
          user_avatar: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          ambiance_suggestions?: string | null
          context_type?: string | null
          created_at?: string | null
          cuisine_style?: string | null
          description: string
          id?: string
          image_url?: string | null
          ingredient_images?: string[] | null
          ingredients: string[]
          is_public?: boolean
          leftover_tips?: string | null
          plating_guidance?: string | null
          serving_suggestion?: string | null
          steps: string
          time_management?: string | null
          title: string
          updated_at?: string | null
          user_avatar?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          ambiance_suggestions?: string | null
          context_type?: string | null
          created_at?: string | null
          cuisine_style?: string | null
          description?: string
          id?: string
          image_url?: string | null
          ingredient_images?: string[] | null
          ingredients?: string[]
          is_public?: boolean
          leftover_tips?: string | null
          plating_guidance?: string | null
          serving_suggestion?: string | null
          steps?: string
          time_management?: string | null
          title?: string
          updated_at?: string | null
          user_avatar?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      symptom_logs: {
        Row: {
          ai_response: string | null
          created_at: string
          id: string
          logged_via: string
          safety_flags: string[] | null
          symptoms: Json
          transcript: string | null
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          created_at?: string
          id?: string
          logged_via?: string
          safety_flags?: string[] | null
          symptoms?: Json
          transcript?: string | null
          user_id: string
        }
        Update: {
          ai_response?: string | null
          created_at?: string
          id?: string
          logged_via?: string
          safety_flags?: string[] | null
          symptoms?: Json
          transcript?: string | null
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
