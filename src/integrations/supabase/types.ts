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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      goal_rewards: {
        Row: {
          goal_id: string
          granted_at: string
          id: string
          milestone: number
          order_id: string | null
          user_id: string
        }
        Insert: {
          goal_id: string
          granted_at?: string
          id?: string
          milestone: number
          order_id?: string | null
          user_id: string
        }
        Update: {
          goal_id?: string
          granted_at?: string
          id?: string
          milestone?: number
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_rewards_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_rewards_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["paypal_order_id"]
          },
        ]
      }
      legacy_user_map: {
        Row: {
          auth_user_id: string | null
          email: string
          imported_at: string
          original_user_id: string
        }
        Insert: {
          auth_user_id?: string | null
          email: string
          imported_at?: string
          original_user_id: string
        }
        Update: {
          auth_user_id?: string | null
          email?: string
          imported_at?: string
          original_user_id?: string
        }
        Relationships: []
      }
      paypal_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          outcome: string | null
          processed_at: string | null
          received_at: string
          resource_id: string | null
        }
        Insert: {
          event_id: string
          event_type: string
          outcome?: string | null
          processed_at?: string | null
          received_at?: string
          resource_id?: string | null
        }
        Update: {
          event_id?: string
          event_type?: string
          outcome?: string | null
          processed_at?: string | null
          received_at?: string
          resource_id?: string | null
        }
        Relationships: []
      }
      player_saves: {
        Row: {
          state: Json
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          state: Json
          updated_at?: string
          user_id?: string
          version?: number
        }
        Update: {
          state?: Json
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      roast_requests: {
        Row: {
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          completed_at: string | null
          contributed_cents: number
          created_at: string
          deadline: string | null
          id: string
          is_demo: boolean
          name: string
          target_cents: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contributed_cents?: number
          created_at?: string
          deadline?: string | null
          id?: string
          is_demo?: boolean
          name: string
          target_cents: number
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          contributed_cents?: number
          created_at?: string
          deadline?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          target_cents?: number
          user_id?: string
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          amount_cents: number
          captured_at: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          goal_id: string | null
          id: string
          is_demo: boolean
          item_ids: string[]
          kind: string
          paypal_capture_id: string | null
          paypal_order_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          captured_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          goal_id?: string | null
          id?: string
          is_demo?: boolean
          item_ids: string[]
          kind?: string
          paypal_capture_id?: string | null
          paypal_order_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          captured_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          goal_id?: string | null
          id?: string
          is_demo?: boolean
          item_ids?: string[]
          kind?: string
          paypal_capture_id?: string | null
          paypal_order_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          acquired_at: string
          id: string
          item_id: string
          order_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_id: string
          order_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_id?: string
          order_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["paypal_order_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_paypal_order: {
        Args: { _capture_id: string; _order_id: string }
        Returns: Json
      }
      reset_demo_journey: { Args: { _user_id: string }; Returns: undefined }
      start_demo_journey: { Args: { _user_id: string }; Returns: Json }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
