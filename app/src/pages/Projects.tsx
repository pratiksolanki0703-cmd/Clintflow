import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, Badge, Modal, Skeleton, Textarea, Dropdown, EmptyState, SearchInput } from '../components/ui'
import { Plus, Edit, Trash2, FolderKanban, Calendar, DollarSign, MoreVertical, ExternalLink, Eye, Check, ChevronLeft, ChevronRight, Sparkles, ListChecks, WalletCards } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCurrency, formatDate } from '../lib/utils'

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  budget: z.number().min(0, 'Budget must be positive'),
  currency: z.string().default('INR'),
  deadline: z.string().optional(),
  client_id: z.string().min(1, 'Client is required'),
})

type ProjectForm = z.infer<typeof projectSchema>

export function Projects() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { id } = useParams()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')
  const [wizardStep, setWizardStep] = useState(1)

  // Auto-open modal when navigating to /projects/new
  useEffect(() => {
    if (id === 'new') {
      handleOpenModal()
    }
  }, [id])

  const { data: clients } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase.from('clients').select('id, name').eq('user_id', user.id)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(name),
          proposal:proposals(status),
          milestones(count),
          invoices(status, total_amount)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: async (project: ProjectForm) => {
      const { data, error } = await supabase.from('projects').insert({ ...project, user_id: user!.id, status: 'active' }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setShowModal(false) },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectForm> & { id: string }) => {
      const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setShowModal(false); setEditingProject(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('projects').delete().eq('id', id); if (error) throw error },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { currency: 'INR', budget: 0 },
  })

  const handleOpenModal = (project?: any) => {
    setWizardStep(1)
    if (project) {
      setEditingProject(project)
      reset({ name: project.name, description: project.description || '', budget: project.budget || 0, currency: project.currency || 'INR', deadline: project.deadline?.split('T')[0] || '', client_id: project.client_id })
    } else {
      setEditingProject(null)
      reset({ name: '', description: '', budget: 0, currency: 'INR', deadline: '', client_id: '' })
    }
    setShowModal(true)
  }

  const onSubmit = (data: ProjectForm) => {
    if (editingProject) updateMutation.mutate({ id: editingProject.id, ...data })
    else createMutation.mutate(data)
  }

  const filteredProjects = projects?.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    const searchLower = search.toLowerCase()
    return p.name.toLowerCase().includes(searchLower) || p.client?.name?.toLowerCase().includes(searchLower)
  }) || []

  const statusColors: Record<string, 'success' | 'info' | 'default' | 'danger'> = {
    active: 'success',
    completed: 'info',
    cancelled: 'default',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400">Track project progress and deadlines</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="lg"><Plus className="w-5 h-5 mr-2" />New Project</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects or clients..." className="flex-1 max-w-md" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target as any).value} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></Card>)}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project and keep delivery, milestones, and payments organized." action={{ label: 'New project', onClick: () => handleOpenModal() }} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map(project => (
            <Card key={project.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 truncate pr-2">{project.name}</h3>
                <Dropdown
                  trigger={<button className="p-1 text-gray-400 hover:text-gray-600"><MoreVertical className="w-5 h-5" /></button>}
                  items={[
                    { label: 'View', onClick: () => navigate(`/projects/${project.id}`), icon: <Eye className="w-4 h-4" /> },
                    { label: 'Edit', onClick: () => handleOpenModal(project), icon: <Edit className="w-4 h-4" /> },
                    { label: project.proposal?.[0]?.status === 'sent' ? 'View Proposal' : 'Create Proposal', onClick: () => navigate(`/proposals/new?project=${project.id}`), icon: <ExternalLink className="w-4 h-4" /> },
                    { label: 'Delete', onClick: () => deleteMutation.mutate(project.id), icon: <Trash2 className="w-4 h-4" />, danger: true },
                  ]}
                />
              </div>

              <p className="text-sm text-gray-500 mb-2 truncate">{project.client?.name}</p>
              {project.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>}

              <div className="space-y-2 text-sm text-gray-600">
                {project.budget && <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{formatCurrency(project.budget, project.currency)}</div>}
                {project.deadline && <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />Due {formatDate(project.deadline)}</div>}
                <div className="flex items-center gap-1">
                  <Badge variant={statusColors[project.status] || 'default'} className="text-xs">{project.status}</Badge>
                  {project.milestones?.[0]?.count > 0 && <Badge variant="default" className="text-xs">{project.milestones[0].count} milestones</Badge>}
                </div>
              </div>

              {project.proposal?.[0] && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Proposal: </span>
                  <Badge variant={project.proposal[0].status === 'accepted' ? 'success' : project.proposal[0].status === 'declined' ? 'danger' : 'warning'} className="text-xs">
                    {project.proposal[0].status}
                  </Badge>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProject(null) }} title={editingProject ? 'Edit Project' : 'Create a new project'}>
        {!editingProject && <div className="mb-6 grid grid-cols-4 gap-2">{['Client', 'Details', 'Plan', 'Review'].map((label, index) => { const step = index + 1; return <div key={label} className="flex items-center gap-2"><div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${wizardStep >= step ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>{wizardStep > step ? <Check className="h-4 w-4" /> : step}</div><span className={`hidden text-xs sm:block ${wizardStep >= step ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-400'}`}>{label}</span>{step < 4 && <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />}</div>})}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editingProject && wizardStep === 1 && <div className="space-y-4"><div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900 dark:bg-brand-950/30"><p className="text-sm font-medium text-brand-900 dark:text-brand-200">Who is this project for?</p><p className="mt-1 text-xs text-brand-700 dark:text-brand-300">Choose an existing client to keep everything connected.</p></div><label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Client <span className="text-red-500">*</span><select {...register('client_id')} className="input mt-1.5"><option value="">Select client</option>{clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{errors.client_id && <p className="text-sm text-red-600">{errors.client_id.message}</p>}</div>}
          {(editingProject || wizardStep === 2) && <><Input label="Project Name" placeholder="Website Redesign" {...register('name')} error={errors.name?.message} /><Textarea label="Description" placeholder="What are you delivering?" {...register('description')} rows={3} /></>}
          <div className="grid grid-cols-2 gap-4">
            {(editingProject || wizardStep === 2) && <Input label="Budget" type="number" min="0" step="1000" {...register('budget', { valueAsNumber: true })} error={errors.budget?.message} />}
          </div>
          {(editingProject || wizardStep === 2) && <div className="grid grid-cols-2 gap-4">
            <Input label="Currency" {...register('currency')} as="select">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </Input>
            <Input label="Deadline (optional)" type="date" {...register('deadline')} error={errors.deadline?.message} />
          </div>}
          {!editingProject && wizardStep === 3 && <div className="space-y-3"><p className="text-sm text-gray-500">Choose how you want to plan delivery. You can refine milestones after creating the project.</p>{[{ icon: ListChecks, title: 'Start with a template', description: 'Use a proven milestone structure.' }, { icon: Sparkles, title: 'Generate with AI', description: 'Get an editable suggested plan.' }, { icon: WalletCards, title: 'Add manually', description: 'Create your own timeline.' }].map(({ icon: Icon, title, description }, i) => <button type="button" key={title} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${i === 0 ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30' : 'border-gray-200 dark:border-gray-700'}`}><Icon className="h-5 w-5 text-brand-600" /><span><span className="block text-sm font-semibold text-gray-900 dark:text-white">{title}</span><span className="mt-1 block text-xs text-gray-500">{description}</span></span></button>)}</div>}
          {!editingProject && wizardStep === 4 && <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800"><h3 className="font-semibold text-gray-900 dark:text-white">Ready to create?</h3><p className="mt-2 text-sm text-gray-500">Review your project details, then create it. You can update milestones later.</p></div>}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => wizardStep > 1 && !editingProject ? setWizardStep(step => step - 1) : (setShowModal(false), setEditingProject(null))}>{wizardStep > 1 && !editingProject ? <><ChevronLeft className="mr-1 h-4 w-4" />Back</> : 'Cancel'}</Button>
            {!editingProject && wizardStep < 4 ? <Button type="button" onClick={() => setWizardStep(step => step + 1)}>Continue <ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingProject ? 'Save Changes' : 'Create Project'}</Button>}
          </div>
        </form>
      </Modal>
    </div>
  )
}
