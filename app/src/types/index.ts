import type { Database } from '../lib/database.types'

export type User = Database['public']['Tables']['users']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']
export type Proposal = Database['public']['Tables']['proposals']['Row']
export type Contract = Database['public']['Tables']['contracts']['Row']
export type Milestone = Database['public']['Tables']['milestones']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type ReminderLog = Database['public']['Tables']['reminders_log']['Row']
export type ProposalTemplate = Database['public']['Tables']['proposal_templates']['Row']
export type MilestoneTemplate = Database['public']['Tables']['milestone_templates']['Row']
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']
export type RazorpayConfig = Database['public']['Tables']['razorpay_config']['Row']
export type SubscriptionTransaction = Database['public']['Tables']['subscription_transactions']['Row']
export type AIAgent = Database['public']['Tables']['ai_agents']['Row']
export type AICreditUsage = Database['public']['Tables']['ai_credit_usage']['Row']

export type InsertUser = Database['public']['Tables']['users']['Insert']
export type InsertClient = Database['public']['Tables']['clients']['Insert']
export type InsertProject = Database['public']['Tables']['projects']['Insert']
export type InsertPaymentMethod = Database['public']['Tables']['payment_methods']['Insert']
export type InsertProposal = Database['public']['Tables']['proposals']['Insert']
export type InsertContract = Database['public']['Tables']['contracts']['Insert']
export type InsertMilestone = Database['public']['Tables']['milestones']['Insert']
export type InsertInvoice = Database['public']['Tables']['invoices']['Insert']
export type InsertReminderLog = Database['public']['Tables']['reminders_log']['Insert']
export type InsertProposalTemplate = Database['public']['Tables']['proposal_templates']['Insert']
export type InsertMilestoneTemplate = Database['public']['Tables']['milestone_templates']['Insert']
export type InsertSubscriptionPlan = Database['public']['Tables']['subscription_plans']['Insert']
export type InsertSubscriptionTransaction = Database['public']['Tables']['subscription_transactions']['Insert']
export type InsertAIUsage = Database['public']['Tables']['ai_credit_usage']['Insert']

export type UpdateUser = Database['public']['Tables']['users']['Update']
export type UpdateClient = Database['public']['Tables']['clients']['Update']
export type UpdateProject = Database['public']['Tables']['projects']['Update']
export type UpdatePaymentMethod = Database['public']['Tables']['payment_methods']['Update']
export type UpdateProposal = Database['public']['Tables']['proposals']['Update']
export type UpdateContract = Database['public']['Tables']['contracts']['Update']
export type UpdateMilestone = Database['public']['Tables']['milestones']['Update']
export type UpdateInvoice = Database['public']['Tables']['invoices']['Update']
export type UpdateProposalTemplate = Database['public']['Tables']['proposal_templates']['Update']

export type ProjectStatus = Database['public']['Enums']['project_status']
export type ProposalStatus = Database['public']['Enums']['proposal_status']
export type MilestoneStatus = Database['public']['Enums']['milestone_status']
export type InvoiceStatus = Database['public']['Enums']['invoice_status']
export type PaymentMethodType = Database['public']['Enums']['payment_method_type']
export type SubscriptionStatus = Database['public']['Enums']['subscription_status']
export type AnalyticsTier = Database['public']['Enums']['analytics_tier']
export type SupportTier = Database['public']['Enums']['support_tier']
export type ReminderChannel = Database['public']['Enums']['reminder_channel']
export type AIFeatureName = Database['public']['Enums']['ai_feature_name']

export interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface ProposalFormData {
  service_description: string
  price: number
  timeline: string
}

export interface InvoiceFormData {
  line_items: LineItem[]
  total_amount: number
  currency: string
  gst_amount?: number
  milestone_label?: string
}

export interface ProjectWithRelations extends Project {
  client: Client
  proposal?: Proposal | null
  milestones: Milestone[]
  invoices: Invoice[]
}

export interface ClientWithProjects extends Client {
  projects: Project[]
}

export interface DashboardStats {
  total_clients: number
  active_projects: number
  pending_invoices: number
  overdue_invoices: number
  total_revenue: number
  ai_credits_remaining: number
}

export interface AIResponse {
  content: string
  credits_used: number
}