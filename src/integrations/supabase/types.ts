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
      city_data: {
        Row: {
          average_purchasing_power: number
          base_distribution_cost: number
          base_labor_cost: number
          base_land_cost: number
          city_name: string
          flagship_demand_percentage: number
          id: string
          lowertier_demand_percentage: number
          luxury_demand_percentage: number
          midtier_demand_percentage: number
          population: number
        }
        Insert: {
          average_purchasing_power: number
          base_distribution_cost: number
          base_labor_cost: number
          base_land_cost: number
          city_name: string
          flagship_demand_percentage: number
          id?: string
          lowertier_demand_percentage: number
          luxury_demand_percentage: number
          midtier_demand_percentage: number
          population: number
        }
        Update: {
          average_purchasing_power?: number
          base_distribution_cost?: number
          base_labor_cost?: number
          base_land_cost?: number
          city_name?: string
          flagship_demand_percentage?: number
          id?: string
          lowertier_demand_percentage?: number
          luxury_demand_percentage?: number
          midtier_demand_percentage?: number
          population?: number
        }
        Relationships: []
      }
      factory_locations: {
        Row: {
          city: string
          created_at: string | null
          id: string
          labor_cost_per_unit: number
          land_cost: number
          setup_cost: number
          team_id: string
        }
        Insert: {
          city: string
          created_at?: string | null
          id?: string
          labor_cost_per_unit: number
          land_cost: number
          setup_cost: number
          team_id: string
        }
        Update: {
          city?: string
          created_at?: string | null
          id?: string
          labor_cost_per_unit?: number
          land_cost?: number
          setup_cost?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "factory_locations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          current_quarter: number
          game_code: string
          host_name: string
          id: string
          max_quarters: number
          quarter_duration_seconds: number
          quarter_start_time: string | null
          starting_capital: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_quarter?: number
          game_code: string
          host_name: string
          id?: string
          max_quarters?: number
          quarter_duration_seconds?: number
          quarter_start_time?: string | null
          starting_capital?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_quarter?: number
          game_code?: string
          host_name?: string
          id?: string
          max_quarters?: number
          quarter_duration_seconds?: number
          quarter_start_time?: string | null
          starting_capital?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      market_allocations: {
        Row: {
          allocation_percentage: number
          city: string
          created_at: string | null
          decision_id: string
          id: string
        }
        Insert: {
          allocation_percentage?: number
          city: string
          created_at?: string | null
          decision_id: string
          id?: string
        }
        Update: {
          allocation_percentage?: number
          city?: string
          created_at?: string | null
          decision_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_allocations_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "team_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_trades: {
        Row: {
          buyer_team_id: string
          created_at: string | null
          id: string
          price_per_share: number
          quarter: number
          shares_bought: number
          target_team_id: string
          total_cost: number
        }
        Insert: {
          buyer_team_id: string
          created_at?: string | null
          id?: string
          price_per_share: number
          quarter: number
          shares_bought: number
          target_team_id: string
          total_cost: number
        }
        Update: {
          buyer_team_id?: string
          created_at?: string | null
          id?: string
          price_per_share?: number
          quarter?: number
          shares_bought?: number
          target_team_id?: string
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_trades_buyer_team_id_fkey"
            columns: ["buyer_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_trades_target_team_id_fkey"
            columns: ["target_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_decisions: {
        Row: {
          cost_per_unit: number
          created_at: string | null
          debt_repayment: number
          employee_budget: number
          flagship_percentage: number
          flagship_price: number
          id: string
          lowertier_percentage: number
          lowertier_price: number
          luxury_percentage: number
          luxury_price: number
          marketing_budget: number
          midtier_percentage: number
          midtier_price: number
          new_debt: number
          quarter: number
          rnd_budget: number
          team_id: string
          units_produced: number
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string | null
          debt_repayment?: number
          employee_budget?: number
          flagship_percentage?: number
          flagship_price?: number
          id?: string
          lowertier_percentage?: number
          lowertier_price?: number
          luxury_percentage?: number
          luxury_price?: number
          marketing_budget?: number
          midtier_percentage?: number
          midtier_price?: number
          new_debt?: number
          quarter: number
          rnd_budget?: number
          team_id: string
          units_produced?: number
        }
        Update: {
          cost_per_unit?: number
          created_at?: string | null
          debt_repayment?: number
          employee_budget?: number
          flagship_percentage?: number
          flagship_price?: number
          id?: string
          lowertier_percentage?: number
          lowertier_price?: number
          luxury_percentage?: number
          luxury_price?: number
          marketing_budget?: number
          midtier_percentage?: number
          midtier_price?: number
          new_debt?: number
          quarter?: number
          rnd_budget?: number
          team_id?: string
          units_produced?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_decisions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_metrics: {
        Row: {
          cash_flow: number
          created_at: string | null
          customer_satisfaction: number
          demand_satisfaction_rate: number
          distribution_cost: number
          employee_productivity: number
          id: string
          inventory_holding_cost: number
          inventory_remaining: number
          market_share: number
          profit: number
          quarter: number
          revenue: number
          roi: number
          team_id: string
          units_sold: number
        }
        Insert: {
          cash_flow?: number
          created_at?: string | null
          customer_satisfaction?: number
          demand_satisfaction_rate?: number
          distribution_cost?: number
          employee_productivity?: number
          id?: string
          inventory_holding_cost?: number
          inventory_remaining?: number
          market_share?: number
          profit?: number
          quarter: number
          revenue?: number
          roi?: number
          team_id: string
          units_sold?: number
        }
        Update: {
          cash_flow?: number
          created_at?: string | null
          customer_satisfaction?: number
          demand_satisfaction_rate?: number
          distribution_cost?: number
          employee_productivity?: number
          id?: string
          inventory_holding_cost?: number
          inventory_remaining?: number
          market_share?: number
          profit?: number
          quarter?: number
          revenue?: number
          roi?: number
          team_id?: string
          units_sold?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_metrics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          current_capital: number
          debt_ceiling: number
          game_id: string
          id: string
          market_share: number
          stock_price: number
          team_name: string
          total_debt: number
          total_profit: number
        }
        Insert: {
          created_at?: string | null
          current_capital?: number
          debt_ceiling?: number
          game_id: string
          id?: string
          market_share?: number
          stock_price?: number
          team_name: string
          total_debt?: number
          total_profit?: number
        }
        Update: {
          created_at?: string | null
          current_capital?: number
          debt_ceiling?: number
          game_id?: string
          id?: string
          market_share?: number
          stock_price?: number
          team_name?: string
          total_debt?: number
          total_profit?: number
        }
        Relationships: [
          {
            foreignKeyName: "teams_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
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
