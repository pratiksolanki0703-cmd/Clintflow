import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, CardHeader, CardContent, Badge, Modal, Skeleton, Textarea, Dropdown } from '../components/ui'
import { Plus, Search, Edit, Trash2, FileText, Eye, Send, Check, X, MoreVertical, Download, Share2, DollarSign, Calendar } from 'lucide-react'
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
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProposal, setEditingProposal] = useState<any>(null)
  const [viewProposal, setViewProposal] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'accepted' | 'declined'>('all')

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
        .select(`
          *,
          project:projects(name, client:clients(name), budget, currency)
        `)
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

  const onSubmit = (data: ProposalForm) => {
    if (editingProposal) updateMutation.mutate({ id: editingProposal.id, ...data })
    else createMutation.mutate(data)
  }

  const filteredProposals = proposals?.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    const searchLower = search.toLowerCase()
    return p.project?.name?.toLowerCase().includes(searchLower) || p.project?.client?.name?.toLowerCase().includes(searchLower)
  }) || []

  const statusColors = { sent: 'warning', accepted: 'success', declined: 'danger' }

  const copyPortalLink = (token: string) => {
    const url = `${window.location.origin}/${user?.username}/${token}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600">Send and track project proposals</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="lg"><Plus className="w-5 h-5 mr-2" />Create Proposal</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input placeholder="Search proposals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target as any).value} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto">
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
        <Card className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No proposals yet</h3>
          <p className="text-gray-500 mt-1">Create your first proposal to win projects</p>
          <Button onClick={() => handleOpenModal()} className="mt-4"><Plus className="w-5 h-5 mr-2" />Create Proposal</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map(proposal => (
            <Card key={proposal.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{proposal.project?.name}</h3>
                    <Badge variant={statusColors[proposal.status] || 'default'}>{proposal.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{proposal.project?.client?.name}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{proposal.service_description}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="font-bold text-gray-900">{formatCurrency(proposal.price, proposal.currency)}</span>
                  <Dropdown
                    trigger={<button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><MoreVertical className="w-5 h-5" /></button>}
                    items={[
                      { label: 'View Portal', onClick: () => setViewProposal(proposal), icon: <Eye className="w-4 h-4" /> },
                      { label: 'Copy Link', onClick: () => copyPortalLink(proposal.share_token), icon: <Share2 className="w-4 h-4" /> },
                      proposal.status === 'sent' && { label: 'Accept', onClick: () => acceptMutation.mutate(proposal.id), icon: <Check className="w-4 h-4 text-green-600" /> },
                      proposal.status === 'sent' && { label: 'Decline', onClick: () => declineMutation.mutate(proposal.id), icon: <X className="w-4 h-4 text-red-600" /> },
                      { label: 'Edit', onClick: () => handleOpenModal(proposal), icon: <Edit className="w-4 h-4" /> },
                      { label: 'Delete', onClick: () => deleteMutation.mutate(proposal.id), icon: <Trash2 className="w-4 h-4" />, danger: true },
                    ].filter(Boolean) as any[]}
                  />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {proposal.timeline && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{proposal.timeline}</span>}
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{formatCurrency(proposal.price, proposal.currency)}</span>
                <span className="text-gray-500">Created {formatDate(proposal.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProposal(null) }} title={editingProposal ? 'Edit Proposal' : 'Create Proposal'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Project" {...register('project_id')} error={errors.project_id?.message} as="select">
            <option value="">Select project</option>
            {projects?.map(p => <option key={p.id} value={p.id}>{p.name} - {p.client?.name}</option>)}
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
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingProposal(null) }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingProposal ? 'Save Changes' : 'Create Proposal'}</Button>
          </div>
        </form>
      </Modal>

      {viewProposal && (
        <Modal isOpen={!!viewProposal} onClose={() => setViewProposal(null)} title="Client Portal Preview" className="max-w-2xl">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{viewProposal.project?.name}</h4>
              <p className="text-sm text-gray-500">{viewProposal.project?.client?.name}</p>
              <p className="text-sm text-gray-600 mt-2">{viewProposal.service_description}</p>
              <p className="font-bold text-lg text-brand-600 mt-2">{formatCurrency(viewProposal.price, viewProposal.currency)}</p>
            </div>
            <div className="p-4 bg-brand-50 rounded-lg">
              <p className="text-sm text-brand-800">Share this link with your client:</p>
              <div className="flex gap-2 mt-2">
                <Input value={`${window.location.origin}/${user?.username}/${viewProposal.share_token}`} readOnly className="flex-1" />
                <Button variant="secondary" onClick={() => copyPortalLink(viewProposal.share_token)} size="sm">Copy</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}