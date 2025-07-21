export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          login_id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          login_id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          login_id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          profile_name: string
          display_name: string | null
          is_primary: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_name: string
          display_name?: string | null
          is_primary?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_name?: string
          display_name?: string | null
          is_primary?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      budget_periods: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          budget_year: number
          budget_month: number
          period_name: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          budget_year: number
          budget_month: number
          period_name?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          budget_year?: number
          budget_month?: number
          period_name?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_periods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_periods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      budget_modules: {
        Row: {
          id: string
          user_id: string
          module_name: string
          display_name: string
          is_system_module: boolean
          include_in_budget: boolean
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_name: string
          display_name: string
          is_system_module?: boolean
          include_in_budget?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_name?: string
          display_name?: string
          is_system_module?: boolean
          include_in_budget?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_modules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      budget_configs: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          budget_period_id: string
          monthly_salary: number
          budget_percentage: number
          total_budget_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          budget_period_id: string
          monthly_salary?: number
          budget_percentage?: number
          total_budget_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          budget_period_id?: string
          monthly_salary?: number
          budget_percentage?: number
          total_budget_amount?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_configs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_configs_budget_period_id_fkey"
            columns: ["budget_period_id"]
            isOneToOne: false
            referencedRelation: "budget_periods"
            referencedColumns: ["id"]
          }
        ]
      }
      budget_allocations: {
        Row: {
          id: string
          budget_config_id: string
          budget_module_id: string
          allocation_percentage: number
          allocated_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          budget_config_id: string
          budget_module_id: string
          allocation_percentage?: number
          allocated_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          budget_config_id?: string
          budget_module_id?: string
          allocation_percentage?: number
          allocated_amount?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_budget_config_id_fkey"
            columns: ["budget_config_id"]
            isOneToOne: false
            referencedRelation: "budget_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_allocations_budget_module_id_fkey"
            columns: ["budget_module_id"]
            isOneToOne: false
            referencedRelation: "budget_modules"
            referencedColumns: ["id"]
          }
        ]
      }
      investment_portfolios: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          budget_period_id: string
          portfolio_name: string
          allocation_type: "percentage" | "amount"
          allocation_value: number
          allocated_amount: number
          invested_amount: number
          allow_direct_investment: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          budget_period_id: string
          portfolio_name: string
          allocation_type: "percentage" | "amount"
          allocation_value?: number
          allocated_amount?: number
          invested_amount?: number
          allow_direct_investment?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          budget_period_id?: string
          portfolio_name?: string
          allocation_type?: "percentage" | "amount"
          allocation_value?: number
          allocated_amount?: number
          invested_amount?: number
          allow_direct_investment?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_portfolios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_portfolios_budget_period_id_fkey"
            columns: ["budget_period_id"]
            isOneToOne: false
            referencedRelation: "budget_periods"
            referencedColumns: ["id"]
          }
        ]
      }
      investment_categories: {
        Row: {
          id: string
          portfolio_id: string
          category_name: string
          allocation_type: "percentage" | "amount"
          allocation_value: number
          allocated_amount: number
          invested_amount: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          category_name: string
          allocation_type: "percentage" | "amount"
          allocation_value?: number
          allocated_amount?: number
          invested_amount?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          category_name?: string
          allocation_type?: "percentage" | "amount"
          allocation_value?: number
          allocated_amount?: number
          invested_amount?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_categories_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_portfolios"
            referencedColumns: ["id"]
          }
        ]
      }
      investment_funds: {
        Row: {
          id: string
          category_id: string
          fund_name: string
          allocated_amount: number
          invested_amount: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          fund_name: string
          allocated_amount?: number
          invested_amount?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          fund_name?: string
          allocated_amount?: number
          invested_amount?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_funds_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "investment_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          budget_period_id: string
          budget_module_id: string | null
          transaction_type: "expense" | "income" | "refund" | "investment" | "savings" | "transfer"
          category: string | null
          amount: number
          description: string | null
          notes: string | null
          transaction_date: string
          transaction_time: string | null
          payment_method: "cash" | "card" | "upi" | "netbanking" | "cheque" | "other" | null
          reference_number: string | null
          tags: string[] | null
          portfolio_id: string | null
          category_id: string | null
          fund_id: string | null
          original_transaction_id: string | null
          refund_reason: string | null
          status: "active" | "cancelled" | "refunded" | "partial_refund"
          is_deleted: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          budget_period_id: string
          budget_module_id?: string | null
          transaction_type: "expense" | "income" | "refund" | "investment" | "savings" | "transfer"
          category?: string | null
          amount: number
          description?: string | null
          notes?: string | null
          transaction_date: string
          transaction_time?: string | null
          payment_method?: "cash" | "card" | "upi" | "netbanking" | "cheque" | "other" | null
          reference_number?: string | null
          tags?: string[] | null
          portfolio_id?: string | null
          category_id?: string | null
          fund_id?: string | null
          original_transaction_id?: string | null
          refund_reason?: string | null
          status?: "active" | "cancelled" | "refunded" | "partial_refund"
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          budget_period_id?: string
          budget_module_id?: string | null
          transaction_type?: "expense" | "income" | "refund" | "investment" | "savings" | "transfer"
          category?: string | null
          amount?: number
          description?: string | null
          notes?: string | null
          transaction_date?: string
          transaction_time?: string | null
          payment_method?: "cash" | "card" | "upi" | "netbanking" | "cheque" | "other" | null
          reference_number?: string | null
          tags?: string[] | null
          portfolio_id?: string | null
          category_id?: string | null
          fund_id?: string | null
          original_transaction_id?: string | null
          refund_reason?: string | null
          status?: "active" | "cancelled" | "refunded" | "partial_refund"
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_budget_period_id_fkey"
            columns: ["budget_period_id"]
            isOneToOne: false
            referencedRelation: "budget_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_budget_module_id_fkey"
            columns: ["budget_module_id"]
            isOneToOne: false
            referencedRelation: "budget_modules"
            referencedColumns: ["id"]
          }
        ]
      }
      bank_accounts: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          account_name: string
          account_number: string | null
          bank_name: string | null
          account_type: "savings" | "current" | "credit" | "investment" | null
          is_primary: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          account_name: string
          account_number?: string | null
          bank_name?: string | null
          account_type?: "savings" | "current" | "credit" | "investment" | null
          is_primary?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          account_name?: string
          account_number?: string | null
          bank_name?: string | null
          account_type?: "savings" | "current" | "credit" | "investment" | null
          is_primary?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      bank_balances: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          budget_period_id: string
          bank_account_id: string
          opening_balance: number
          closing_balance: number
          total_income: number
          total_expenses: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          budget_period_id: string
          bank_account_id: string
          opening_balance?: number
          closing_balance?: number
          total_income?: number
          total_expenses?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          budget_period_id?: string
          bank_account_id?: string
          opening_balance?: number
          closing_balance?: number
          total_income?: number
          total_expenses?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_balances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_balances_budget_period_id_fkey"
            columns: ["budget_period_id"]
            isOneToOne: false
            referencedRelation: "budget_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_balances_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      transaction_history: {
        Row: {
          id: string
          transaction_id: string
          user_id: string
          action: "created" | "updated" | "deleted" | "refunded"
          old_values: Json | null
          new_values: Json | null
          changes_description: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          transaction_id: string
          user_id: string
          action: "created" | "updated" | "deleted" | "refunded"
          old_values?: Json | null
          new_values?: Json | null
          changes_description?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          transaction_id?: string
          user_id?: string
          action?: "created" | "updated" | "deleted" | "refunded"
          old_values?: Json | null
          new_values?: Json | null
          changes_description?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      configuration_inheritances: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          source_budget_period_id: string
          target_budget_period_id: string
          inherited_components: string[]
          inheritance_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          source_budget_period_id: string
          target_budget_period_id: string
          inherited_components: string[]
          inheritance_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          source_budget_period_id?: string
          target_budget_period_id?: string
          inherited_components?: string[]
          inheritance_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuration_inheritances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuration_inheritances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuration_inheritances_source_budget_period_id_fkey"
            columns: ["source_budget_period_id"]
            isOneToOne: false
            referencedRelation: "budget_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuration_inheritances_target_budget_period_id_fkey"
            columns: ["target_budget_period_id"]
            isOneToOne: false
            referencedRelation: "budget_periods"
            referencedColumns: ["id"]
          }
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
