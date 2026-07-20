import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, Skeleton, Modal, Avatar, Dropdown, EmptyState, SearchInput } from '../components/ui'
import { Plus, MoreVertical, Edit, Trash2, Users, Mail, Phone, Building2 } from 'lucide-react'
import { formatRelativeTime } from '../lib/utils'

export function Clients() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('clients')
        .select('*, projects:projects(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: async (client: any) => {
      const { data, error } = await supabase.from('clients').insert({ ...client, user_id: user!.id }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setShowModal(false) },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setShowModal(false); setEditingClient(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('clients').delete().eq('id', id); if (error) throw error },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })

  const handleOpenModal = (client?: any) => {
    setEditingClient(client || null)
    setShowModal(true)
  }

  const filteredClients = clients?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your client relationships in one place.</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="lg"><Plus className="w-5 h-5 mr-2" />Add Client</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." className="flex-1 max-w-md" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></Card>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No clients match your search' : 'No clients yet'}
          description={search ? 'Try a different search term.' : 'Add your first client to start managing relationships.'}
          action={search ? undefined : { label: 'Add Client', onClick: () => handleOpenModal() }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map(client => (
            <Card key={client.id} className="group p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={client.name} size="lg" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{client.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{client.email}</p>
                  </div>
                </div>
                <Dropdown
                  trigger={<button className="p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><MoreVertical className="w-4 h-4" /></button>}
                  items={[
                    { label: 'Edit', onClick: () => handleOpenModal(client), icon: <Edit className="w-4 h-4" /> },
                    { label: 'Delete', onClick: () => { if (confirm('Delete this client?')) deleteMutation.mutate(client.id) }, icon: <Trash2 className="w-4 h-4" />, danger: true },
                  ]}
                />
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {client.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 shrink-0 text-gray-400" />
                    <span>{client.company}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0 text-gray-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0 text-gray-400" />
                  <span className="truncate">{client.email}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-500">
                  {client.projects?.[0]?.count || 0} project{(client.projects?.[0]?.count || 0) !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-xs">Added {formatRelativeTime(client.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingClient(null) }} title={editingClient ? 'Edit Client' : 'Add Client'}>
        <form onSubmit={e => { e.preventDefault(); const formData = new FormData(e.currentTarget); const data = Object.fromEntries(formData); if (editingClient) updateMutation.mutate({ id: editingClient.id, ...data }); else createMutation.mutate(data) }} className="space-y-4">
          <Input label="Name" name="name" placeholder="John Doe" defaultValue={editingClient?.name || ''} required />
          <Input label="Email" type="email" name="email" placeholder="john@example.com" defaultValue={editingClient?.email || ''} required />
          <Input label="Phone (optional)" name="phone" placeholder="+91 98765 43210" defaultValue={editingClient?.phone || ''} />
          <Input label="Company (optional)" name="company" placeholder="Acme Inc." defaultValue={editingClient?.company || ''} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingClient(null) }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingClient ? 'Save Changes' : 'Add Client'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
