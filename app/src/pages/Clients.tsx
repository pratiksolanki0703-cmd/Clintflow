import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, CardHeader, CardContent, Badge, Skeleton, Modal, Avatar, Dropdown } from '../components/ui'
import { Plus, Search, MoreVertical, Edit, Trash2, Users, Mail, Phone, Building2, ChevronDown } from 'lucide-react'
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
    if (client) setEditingClient(client)
    else setEditingClient(null)
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
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your client relationships</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="lg"><Plus className="w-5 h-5 mr-2" />Add Client</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></Card>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No clients found</h3>
          <p className="text-gray-500 mt-1">{search ? 'Try adjusting your search' : 'Get started by adding your first client'}</p>
          <Button onClick={() => handleOpenModal()} className="mt-4"><Plus className="w-5 h-5 mr-2" />{search ? 'Clear Search' : 'Add Client'}</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map(client => (
            <Card key={client.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={client.name} size="lg" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{client.email}</p>
                  </div>
                </div>
                <Dropdown
                  trigger={<Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>}
                  items={[
                    { label: 'Edit', onClick: () => handleOpenModal(client), icon: <Edit className="w-4 h-4" /> },
                    { label: 'Delete', onClick: () => { if (confirm('Delete this client?')) deleteMutation.mutate(client.id) }, icon: <Trash2 className="w-4 h-4" />, danger: true },
                  ]}
                />
              </div>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {client.company && <div className="flex items-center gap-2"><Building2 className="w-4 h-4" />{client.company}</div>}
                {client.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{client.phone}</div>}
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{client.email}</div>
                <div className="flex items-center gap-2 text-gray-400"><span>{client.projects?.[0]?.count || 0} projects</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Added {formatRelativeTime(client.created_at)}</span>
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
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingClient(null) }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingClient ? 'Save Changes' : 'Add Client'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}