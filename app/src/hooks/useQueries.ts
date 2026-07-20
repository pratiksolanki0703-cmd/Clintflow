import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { generateShareToken } from '../lib/utils'
import type { Client, Project, Proposal, Invoice, PaymentMethod, Milestone, User, SubscriptionPlan } from '../types'

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Client[]
    },
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Client
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(*),
          proposal:proposals(*),
          milestones(*),
          invoices(*)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(*),
          proposal:proposals(*),
          milestones(*),
          invoices(*)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'status'> & { payment_method_ids?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { payment_method_ids, ...projectData } = project
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...projectData, user_id: user.id, status: 'active' })
        .select()
        .single()
      if (error) throw error

      if (payment_method_ids?.length) {
        const methods = payment_method_ids.map((pm_id, index) => ({
          project_id: data.id,
          payment_method_id: pm_id,
        }))
        await supabase.from('project_payment_methods').insert(methods)
      }

      return data as Project
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payment_method_ids, ...updates }: Partial<Project> & { id: string; payment_method_ids?: string[] }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      if (payment_method_ids) {
        await supabase.from('project_payment_methods').delete().eq('project_id', id)
        if (payment_method_ids.length) {
          const methods = payment_method_ids.map((pm_id, index) => ({
            project_id: id,
            payment_method_id: pm_id,
          }))
          await supabase.from('project_payment_methods').insert(methods)
        }
      }

      return data as Project
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useProposals() {
  return useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, project:projects(*, client:clients(*))')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useProposalByToken(shareToken: string) {
  return useQuery({
    queryKey: ['proposal', 'token', shareToken],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          project:projects(
            *,
            client:clients(*),
            user:users(*)
          )
        `)
        .eq('share_token', shareToken)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!shareToken,
  })
}

export function useCreateProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (proposal: Omit<Proposal, 'id' | 'user_id' | 'created_at' | 'status' | 'share_token'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('proposals')
        .insert({ ...proposal, user_id: user.id, status: 'sent', share_token: generateShareToken() })
        .select()
        .single()
      if (error) throw error
      return data as Proposal
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  })
}

export function useUpdateProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Proposal> & { id: string }) => {
      const { data, error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Proposal
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  })
}

export function useAcceptProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('proposals')
        .update({ status: 'accepted' })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Proposal
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  })
}

export function useDeclineProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('proposals')
        .update({ status: 'declined' })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Proposal
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  })
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, project:projects(*, client:clients(*))')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'status' | 'share_token' | 'paid_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('invoices')
        .insert({ ...invoice, user_id: user.id, status: 'pending', share_token: generateShareToken() })
        .select()
        .single()
      if (error) throw error
      return data as Invoice
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const updateData = { ...updates }
      if (updates.status === 'paid' && !updates.paid_at) {
        updateData.paid_at = new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Invoice
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data as PaymentMethod[]
    },
  })
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (method: Omit<PaymentMethod, 'id' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({ ...method, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as PaymentMethod
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentMethods'] }),
  })
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentMethod> & { id: string }) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PaymentMethod
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentMethods'] }),
  })
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentMethods'] }),
  })
}

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
      if (error) throw error
      return data as Milestone[]
    },
    enabled: !!projectId,
  })
}

export function useCreateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (milestone: Omit<Milestone, 'id' | 'created_at' | 'completed_at'>) => {
      const { data, error } = await supabase
        .from('milestones')
        .insert(milestone)
        .select()
        .single()
      if (error) throw error
      return data as Milestone
    },
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['milestones', variables.project_id] }),
  })
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Milestone> & { id: string }) => {
      const updateData = { ...updates }
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('milestones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Milestone
    },
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['milestones', variables.project_id] }),
  })
}

export function useMilestoneTemplates() {
  return useQuery({
    queryKey: ['milestoneTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestone_templates')
        .select('*')
        .or('user_id.is.null,is_built_in.eq.true')
        .order('is_built_in', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const [clients, projects, invoices] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
        supabase.from('invoices').select('id, total_amount, status').eq('user_id', user.id),
      ])

      const pendingInvoices = invoices.data?.filter(i => i.status === 'pending' || i.status === 'partially_paid').length || 0
      const totalRevenue = invoices.data?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0) || 0

      const { data: userData } = await supabase.from('users').select('ai_credits_remaining').eq('id', user.id).single()

      return {
        totalClients: clients.count || 0,
        activeProjects: projects.count || 0,
        pendingInvoices,
        totalRevenue,
        aiCreditsRemaining: userData?.ai_credits_remaining || 0,
      }
    },
  })
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (error) throw error
      return data as User
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      return data as User
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] }),
  })
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })
      if (error) throw error
      return data as SubscriptionPlan[]
    },
  })
}

export function useUsernameCheck(username: string) {
  return useQuery({
    queryKey: ['usernameCheck', username],
    queryFn: async () => {
      if (!username || username.length < 3) return { available: false, message: 'Username must be at least 3 characters' }
      
      // Use RPC function which has SECURITY DEFINER (bypasses RLS for anonymous users)
      const { data, error } = await supabase
        .rpc('check_username_available', { p_username: username })
      
      if (error) {
        // Fallback: try direct query if RPC fails (e.g. function not yet created)
        const { data: direct, error: directError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle()
        if (directError) throw directError
        return { available: !direct, message: direct ? 'This username is already taken' : 'Username available' }
      }
      
      return data as { available: boolean; message: string }
    },
    enabled: username.length >= 3,
  })
}