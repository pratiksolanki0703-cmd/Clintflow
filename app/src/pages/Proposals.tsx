import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, Badge, Modal, Skeleton, Textarea, Dropdown, EmptyState, SearchInput } from '../components/ui'
import { Plus, Edit, Trash2, FileText, Eye, MoreVertical, Share2, Check, X, Calendar, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCurrency, formatDate, generateShareToken } from '../lib/utils'

const proposalSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  service_description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be positive'),
  timeline: z.string().optional(),
  currency: z.string().default('INR'),
})

type ProposalForm = z.infer<typeof proposalSchema>

export function Proposals() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProposal, setEditingProposal] = useState<any>(null)
  const [viewProposal, setViewProposal] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'accepted' | 'declined'>('all')
  // Auto-open modal when navigating to /proposals/new?project=xxx
  useEffect(() => {
    const projectId = searchParams.get('project')
    if (projectId) {
      setEditingProposal(null)
      reset({ project_id: projectId, service_description: '', price: 0, timeline: '', currency: 'INR' })
      setShowModal(true)
    }
  }, [searchParams])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { currency: 'INR', price: 0 },
  })

  const handleOpenModal = (proposal?: any) => {
    if (proposal) {
      setEditingProposal(proposal)
      reset({ project_id: proposal.project_id, service_description: proposal.service_description, price: proposal.price, timeline: proposal.timeline || '', currency: proposal.currency })
    } else {
      setEditingProposal(null)
      reset({ project_id: '', service_description: '', price: 0, timeline: '', currency: 'INR' })
    }
    setShowModal(true)
  }

  const { data: projects } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase.from('projects').select('id, name, client:clients(name)').eq('user_id', user.id).eq('status', 'active')
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['proposals', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('proposals')
        .select(`*, project:projects(name, client:clients(name), budget, currency)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: async (proposal: ProposalForm) => {
      const shareToken = generateShareToken()
      const { data, error } = await supabase.from('proposals').insert({ ...proposal, user_id: user!.id, status: 'sent', share_token: shareToken }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['proposals'] }); setShowModal(false) },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProposalForm> & { id: string }) => {
      const { data, error } = await supabase.from('proposals').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['proposals'] }); setShowModal(false); setEditingProposal(null) },
  })

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => { const { data, error } = await supabase.from('proposals').update({ status: 'accepted' }).eq('id', id).select().single(); if (error) throw error; return data },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  })

  const declineMutation = useMutation({
    mutationFn: async (id: string) => { const { data, error } = await supabase.from('proposals').update({ status: 'declined' }).eq('id', id).select().single(); if (error) throw error; return data },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('proposals').delete().eq('id', id); if (error) throw error },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  })

  const onSubmit = (data: ProposalForm) => {
    if (editingProposal) updateMutation.mutate({ id: editingProposal.id, ...data })
    else createMutation.mutate(data)
  }

  const filteredProposals = proposals?.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    const q = search.toLowerCase()
    return p.project?.name?.toLowerCase().includes(q) || p.project?.client?.name?.toLowerCase().includes(q)
  }) || []

  const statusStyles: Record<string, string> = {
    sent: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    declined: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
  }

  const copyPortalLink = (token: string) => {
    const url = `${window.location.origin}/${user?.username}/${token}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proposals</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and share professional proposals.</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="lg"><Plus className="w-5 h-5 mr-2" />Create Proposal</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search proposals..." className="flex-1 max-w-md" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="input w-full sm:w-auto">
          <option value="all">All Status</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></Card>)}
        </div>
      ) : filteredProposals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search ? 'No proposals match your search' : 'No proposals yet'}
          description={search ? 'Try a different search term.' : 'Create your first proposal to win projects.'}
          action={search ? undefined : { label: 'Create Proposal', onClick: () => handleOpenModal() }}
        />
      ) : (
        <div className="space-y-3">
          {filteredProposals.map(proposal => (
            <Card key={proposal.id} className="p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{proposal.project?.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[proposal.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {proposal.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{proposal.project?.client?.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{proposal.service_description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(proposal.price, proposal.currency)}
                  </span>
                  <Dropdown
                    trigger={<button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><MoreVertical className="w-5 h-5" /></button>}
                    items={[
                      { label: 'View Preview', onClick: () => setViewProposal(proposal), icon: <Eye className="w-4 h-4" /> },
                      { label: 'Copy Link', onClick: () => copyPortalLink(proposal.share_token), icon: <Share2 className="w-4 h-4" /> },
                      proposal.status === 'sent' && { label: 'Accept', onClick: () => acceptMutation.mutate(proposal.id), icon: <Check className="w-4 h-4 text-emerald-600" /> },
                      proposal.status === 'sent' && { label: 'Decline', onClick: () => declineMutation.mutate(proposal.id), icon: <X className="w-4 h-4 text-red-600" /> },
                      { label: 'Edit', onClick: () => handleOpenModal(proposal), icon: <Edit className="w-4 h-4" /> },
                      { label: 'Delete', onClick: () => deleteMutation.mutate(proposal.id), icon: <Trash2 className="w-4 h-4" />, danger: true },
                    ].filter(Boolean) as any[]}
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                {proposal.timeline && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {proposal.timeline}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(proposal.price, proposal.currency)}
                </span>
                <span className="text-xs">Created {formatDate(proposal.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProposal(null) }} title={editingProposal ? 'Edit Proposal' : 'Create Proposal'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Project" {...register('project_id')} error={errors.project_id?.message} as="select">
            <option value="">Select project</option>
            {projects?.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client?.name}</option>)}
          </Input>
          <Textarea label="Service Description" placeholder="Describe the services you'll provide..." {...register('service_description')} error={errors.service_description?.message} rows={4} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price" type="number" min="0" step="1000" {...register('price', { valueAsNumber: true })} error={errors.price?.message} />
            <Input label="Currency" {...register('currency')} as="select">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </Input>
          </div>
          <Input label="Timeline (optional)" placeholder="e.g., 4 weeks" {...register('timeline')} error={errors.timeline?.message} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingProposal(null) }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingProposal ? 'Save Changes' : 'Create Proposal'}</Button>
          </div>
        </form>
      </Modal>

      {/* Proposal Preview Modal */}
      {viewProposal && (
        <Modal isOpen={!!viewProposal} onClose={() => setViewProposal(null)} title="Client Portal Preview" className="max-w-2xl">
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-5 dark:bg-gray-800">
              <h4 className="font-semibold text-gray-900 dark:text-white">{viewProposal.project?.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{viewProposal.project?.client?.name}</p>
              <div className="mt-3 rounded-lg bg-white p-4 dark:bg-gray-900">
                <p className="text-sm text-gray-700 dark:text-gray-300">{viewProposal.service_description}</p>
              </div>
              <p className="mt-3 text-xl font-bold text-brand-600">{formatCurrency(viewProposal.price, viewProposal.currency)}</p>
              {viewProposal.timeline && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Timeline: {viewProposal.timeline}</p>
              )}
            </div>
            <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-950/30">
              <p className="text-sm font-medium text-brand-800 dark:text-brand-200">Share this link with your client:</p>
              <div className="flex gap-2 mt-2">
                <Input value={`${window.location.origin}/${user?.username}/${viewProposal.share_token}`} readOnly className="flex-1 font-mono text-sm" />
                <Button variant="secondary" onClick={() => copyPortalLink(viewProposal.share_token)} size="sm">Copy</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
