export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          business_name: string | null
          logo_url: string | null
          brand_color: string | null
          gst_number: string | null
          profession: string | null
          referral_source: string | null
          client_count_range: string | null
          team_status: string | null
          ai_credits_remaining: number
          ai_credits_topup: number
          plan_key: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          business_name?: string | null
          logo_url?: string | null
          brand_color?: string | null
          gst_number?: string | null
          profession?: string | null
          referral_source?: string | null
          client_count_range?: string | null
          team_status?: string | null
          ai_credits_remaining?: number
          ai_credits_topup?: number
          plan_key: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          business_name?: string | null
          logo_url?: string | null
          brand_color?: string | null
          gst_number?: string | null
          profession?: string | null
          referral_source?: string | null
          client_count_range?: string | null
          team_status?: string | null
          ai_credits_remaining?: number
          ai_credits_topup?: number
          plan_key?: string
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          company: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone?: string | null
          company?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          company?: string | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          client_id: string
          name: string
          description: string | null
          budget: number | null
          currency: string
          deadline: string | null
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          name: string
          description?: string | null
          budget?: number | null
          currency?: string
          deadline?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          name?: string
          description?: string | null
          budget?: number | null
          currency?: string
          deadline?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string
          type: 'upi' | 'paypal' | 'bank_transfer' | 'stripe' | 'wise' | 'payoneer' | 'other'
          label: string
          qr_image_url: string | null
          link_or_handle: string | null
          display_order: number
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          type: 'upi' | 'paypal' | 'bank_transfer' | 'stripe' | 'wise' | 'payoneer' | 'other'
          label: string
          qr_image_url?: string | null
          link_or_handle?: string | null
          display_order?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'upi' | 'paypal' | 'bank_transfer' | 'stripe' | 'wise' | 'payoneer' | 'other'
          label?: string
          qr_image_url?: string | null
          link_or_handle?: string | null
          display_order?: number
          is_active?: boolean
        }
      }
      project_payment_methods: {
        Row: {
          id: string
          project_id: string
          payment_method_id: string
        }
        Insert: {
          id?: string
          project_id: string
          payment_method_id: string
        }
        Update: {
          id?: string
          project_id?: string
          payment_method_id?: string
        }
      }
      proposals: {
        Row: {
          id: string
          user_id: string
          project_id: string
          service_description: string
          price: number
          timeline: string | null
          status: 'sent' | 'accepted' | 'declined'
          share_token: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          service_description: string
          price: number
          timeline?: string | null
          status?: 'sent' | 'accepted' | 'declined'
          share_token: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          service_description?: string
          price?: number
          timeline?: string | null
          status?: 'sent' | 'accepted' | 'declined'
          share_token?: string
          created_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          proposal_id: string
          terms_text: string
          client_signature_name: string | null
          signed_at: string | null
          signed_ip: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          proposal_id: string
          terms_text: string
          client_signature_name?: string | null
          signed_at?: string | null
          signed_ip?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          proposal_id?: string
          terms_text?: string
          client_signature_name?: string | null
          signed_at?: string | null
          signed_ip?: string | null
          user_agent?: string | null
        }
      }
      milestones: {
        Row: {
          id: string
          project_id: string
          title: string
          status: 'not_started' | 'in_progress' | 'completed'
          order_index: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          status?: 'not_started' | 'in_progress' | 'completed'
          order_index: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          order_index?: number
          created_at?: string
          completed_at?: string | null
        }
      }
      milestone_templates: {
        Row: {
          id: string
          user_id: string | null
          title: string
          is_built_in: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          is_built_in?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          is_built_in?: boolean
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          project_id: string
          proposal_id: string | null
          line_items: {
            description: string
            quantity: number
            unit_price: number
            amount: number
          }[]
          total_amount: number
          currency: string
          gst_amount: number | null
          milestone_label: string | null
          status: 'pending' | 'partially_paid' | 'paid' | 'overdue'
          transaction_id: string | null
          share_token: string
          created_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          proposal_id?: string | null
          line_items: {
            description: string
            quantity: number
            unit_price: number
            amount: number
          }[]
          total_amount: number
          currency: string
          gst_amount?: number | null
          milestone_label?: string | null
          status?: 'pending' | 'partially_paid' | 'paid' | 'overdue'
          transaction_id?: string | null
          share_token: string
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          proposal_id?: string | null
          line_items?: {
            description: string
            quantity: number
            unit_price: number
            amount: number
          }[]
          total_amount?: number
          currency?: string
          gst_amount?: number | null
          milestone_label?: string | null
          status?: 'pending' | 'partially_paid' | 'paid' | 'overdue'
          transaction_id?: string | null
          share_token?: string
          created_at?: string
          paid_at?: string | null
        }
      }
      reminders_log: {
        Row: {
          id: string
          invoice_id: string
          sent_at: string
          channel: 'email' | 'whatsapp'
        }
        Insert: {
          id?: string
          invoice_id: string
          sent_at?: string
          channel: 'email' | 'whatsapp'
        }
        Update: {
          id?: string
          invoice_id?: string
          sent_at?: string
          channel?: 'email' | 'whatsapp'
        }
      }
      proposal_templates: {
        Row: {
          id: string
          user_id: string | null
          title: string
          content: string
          is_built_in: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          content: string
          is_built_in?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          content?: string
          is_built_in?: boolean
          created_at?: string
        }
      }
      ai_agents: {
        Row: {
          name: 'proposal_ai' | 'milestone_ai' | 'invoice_ai' | 'email_ai'
          model: string
          system_prompt: string
          is_active: boolean
        }
        Insert: {
          name: 'proposal_ai' | 'milestone_ai' | 'invoice_ai' | 'email_ai'
          model: string
          system_prompt: string
          is_active: boolean
        }
        Update: {
          name?: 'proposal_ai' | 'milestone_ai' | 'invoice_ai' | 'email_ai'
          model?: string
          system_prompt?: string
          is_active?: boolean
        }
      }
      ai_credit_usage: {
        Row: {
          id: string
          user_id: string
          feature_name: 'proposal_ai' | 'milestone_ai' | 'invoice_ai' | 'email_ai'
          credits_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature_name: 'proposal_ai' | 'milestone_ai' | 'invoice_ai' | 'email_ai'
          credits_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feature_name?: 'proposal_ai' | 'milestone_ai' | 'invoice_ai' | 'email_ai'
          credits_used?: number
          created_at?: string
        }
      }
      subscription_plans: {
        Row: {
          plan_key: string
          display_name: string
          price_monthly: number
          price_yearly: number
          max_clients: number | null
          max_projects_per_month: number | null
          emails_per_month: number
          ai_credits_per_month: number
          proposal_templates_limit: number | null
          has_custom_branding: boolean
          shows_powered_by_footer: boolean
          analytics_tier: 'basic' | 'standard' | 'advanced'
          support_tier: 'none' | 'priority' | 'highest'
          is_active: boolean
        }
        Insert: {
          plan_key: string
          display_name: string
          price_monthly: number
          price_yearly: number
          max_clients?: number | null
          max_projects_per_month?: number | null
          emails_per_month?: number
          ai_credits_per_month?: number
          proposal_templates_limit?: number | null
          has_custom_branding?: boolean
          shows_powered_by_footer?: boolean
          analytics_tier?: 'basic' | 'standard' | 'advanced'
          support_tier?: 'none' | 'priority' | 'highest'
          is_active?: boolean
        }
        Update: {
          plan_key?: string
          display_name?: string
          price_monthly?: number
          price_yearly?: number
          max_clients?: number | null
          max_projects_per_month?: number | null
          emails_per_month?: number
          ai_credits_per_month?: number
          proposal_templates_limit?: number | null
          has_custom_branding?: boolean
          shows_powered_by_footer?: boolean
          analytics_tier?: 'basic' | 'standard' | 'advanced'
          support_tier?: 'none' | 'priority' | 'highest'
          is_active?: boolean
        }
      }
      razorpay_config: {
        Row: {
          id: number
          key_id: string | null
          key_secret: string | null
          webhook_secret: string | null
          is_live_mode: boolean
          is_active: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          key_id?: string | null
          key_secret?: string | null
          webhook_secret?: string | null
          is_live_mode?: boolean
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          key_id?: string | null
          key_secret?: string | null
          webhook_secret?: string | null
          is_live_mode?: boolean
          is_active?: boolean
          updated_at?: string
        }
      }
      subscription_transactions: {
        Row: {
          id: string
          user_id: string
          plan_key: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          amount: number
          currency: string
          status: 'created' | 'paid' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_key: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          amount: number
          currency: string
          status?: 'created' | 'paid' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_key?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          amount?: number
          currency?: string
          status?: 'created' | 'paid' | 'failed'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_method_type: 'upi' | 'paypal' | 'bank_transfer' | 'stripe' | 'wise' | 'payoneer' | 'other'
      project_status: 'active' | 'completed' | 'cancelled'
      proposal_status: 'sent' | 'accepted' | 'declined'
      milestone_status: 'not_started' | 'in_progress' | 'completed'
      invoice_status: 'pending' | 'partially_paid' | 'paid' | 'overdue'
      subscription_status: 'created' | 'paid' | 'failed'
      analytics_tier: 'basic' | 'standard' | 'advanced'
      support_tier: 'none' | 'priority' | 'highest'
      reminder_channel: 'email' | 'whatsapp'
      ai_feature_name: 'proposal_ai' | 'milestone_ai' | 'invoice_ai' | 'email_ai'
    }
  }
}