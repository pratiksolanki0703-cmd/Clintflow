import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, CardHeader, CardContent, Badge, Modal, Skeleton, Textarea, Dropdown } from '../components/ui'
import { Plus, Search, Edit, Trash2, CreditCard, Eye, MoreVertical, Download, Share2, DollarSign, Calendar, AlertCircle, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCurrency, formatDate, generateShareToken } from '../lib/utils'
import jsPDF from 'jspdf'

const invoiceSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  line_items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
  })).min(1, 'At least one line item required'),
  currency: z.string().default('INR'),
  gst_amount: z.number().min(0).optional(),
  milestone_label: z.string().optional(),
})

type InvoiceForm = z.infer<typeof invoiceSchema>

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Price must be positive'),
})

export function Invoices() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const [viewInvoice, setViewInvoice] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partially_paid' | 'paid' | 'overdue'>('all')

  const { data: projects } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase.from('projects').select('id, name, client:clients(name)').eq('user_id', user.id)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          project:projects(name, client:clients(name, email))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: async (invoice: InvoiceForm) => {
      const shareToken = generateShareToken()
      const total = invoice.line_items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
      const { data, error } = await supabase.from('invoices').insert({
        ...invoice,
        user_id: user!.id,
        status: 'pending',
        share_token: shareToken,
        total_amount: total,
      }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowModal(false) },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InvoiceForm> & { id: string; line_items?: any[] }) => {
      const total = updates.line_items?.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
      const updateData = { ...updates, total_amount: total }
      const { data, error } = await supabase.from('invoices').update(updateData).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowModal(false); setEditingInvoice(null) },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status }
      if (status === 'paid') updates.paid_at = new Date().toISOString()
      const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('invoices').delete().eq('id', id); if (error) throw error },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { currency: 'INR', line_items: [{ description: '', quantity: 1, unit_price: 0 }], gst_amount: 0 },
  })

  const lineItems = watch('line_items')
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const total = subtotal + (watch('gst_amount') || 0)

  const handleOpenModal = (invoice?: any) => {
    if (invoice) {
      setEditingInvoice(invoice)
      reset({
        project_id: invoice.project_id,
        line_items: invoice.line_items,
        currency: invoice.currency,
        gst_amount: invoice.gst_amount || 0,
        milestone_label: invoice.milestone_label || '',
      })
    } else {
      setEditingInvoice(null)
      reset({ project_id: '', line_items: [{ description: '', quantity: 1, unit_price: 0 }], currency: 'INR', gst_amount: 0, milestone_label: '' })
    }
    setShowModal(true)
  }

  const onSubmit = (data: InvoiceForm) => {
    if (editingInvoice) updateMutation.mutate({ id: editingInvoice.id, ...data })
    else createMutation.mutate(data)
  }

  const addLineItem = () => setValue('line_items', [...lineItems, { description: '', quantity: 1, unit_price: 0 }])
  const removeLineItem = (index: number) => setValue('line_items', lineItems.filter((_, i) => i !== index))
  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setValue('line_items', updated)
  }

  const filteredInvoices = invoices?.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false
    const searchLower = search.toLowerCase()
    return inv.project?.name?.toLowerCase().includes(searchLower) || inv.project?.client?.name?.toLowerCase().includes(searchLower)
  }) || []

  const statusColors = { pending: 'warning', partially_paid: 'warning', paid: 'success', overdue: 'danger' }

  const generatePDF = (invoice: any) => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('INVOICE', 20, 20)
    doc.setFontSize(10)
    doc.text(`Invoice #: ${invoice.id.slice(0, 8)}`, 20, 30)
    doc.text(`Date: ${formatDate(invoice.created_at)}`, 20, 37)
    doc.text(`Status: ${invoice.status}`, 20, 44)
    doc.text(`From: ${user?.business_name || user?.username}`, 20, 54)
    doc.text(`To: ${invoice.project?.client?.name}`, 20, 61)
    doc.text(`${invoice.project?.client?.email}`, 20, 68)

    let y = 80
    doc.setFontSize(12)
    doc.text('Description', 20, y)
    doc.text('Qty', 120, y)
    doc.text('Unit Price', 140, y)
    doc.text('Amount', 170, y)
    doc.line(20, y + 2, 190, y + 2)
    y += 10

    invoice.line_items.forEach((item: any) => {
      doc.text(item.description, 20, y)
      doc.text(item.quantity.toString(), 120, y)
      doc.text(formatCurrency(item.unit_price, invoice.currency), 140, y)
      doc.text(formatCurrency(item.quantity * item.unit_price, invoice.currency), 170, y)
      y += 8
    })

    doc.line(20, y, 190, y)
    y += 10
    doc.text(`Subtotal: ${formatCurrency(subtotal, invoice.currency)}`, 140, y)
    y += 7
    if (invoice.gst_amount) { doc.text(`GST: ${formatCurrency(invoice.gst_amount, invoice.currency)}`, 140, y); y += 7 }
    doc.setFontSize(14)
    doc.text(`Total: ${formatCurrency(total, invoice.currency)}`, 140, y)

    doc.save(`invoice-${invoice.id.slice(0, 8)}.pdf`)
  }

  const copyPortalLink = (token: string) => {
    const url = `${window.location.origin}/${user?.username}/${token}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Track payments and send invoices</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="lg"><Plus className="w-5 h-5 mr-2" />Create Invoice</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target as any).value} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></Card>)}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No invoices yet</h3>
          <p className="text-gray-500 mt-1">Create your first invoice to get paid</p>
          <Button onClick={() => handleOpenModal()} className="mt-4"><Plus className="w-5 h-5 mr-2" />Create Invoice</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map(invoice => (
            <Card key={invoice.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{invoice.project?.name}</h3>
                    <Badge variant={statusColors[invoice.status] || 'default'}>{invoice.status.replace('_', ' ')}</Badge>
                    {invoice.milestone_label && <Badge variant="info" className="text-xs">{invoice.milestone_label}</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{invoice.project?.client?.name}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                  <Dropdown
                    trigger={<button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><MoreVertical className="w-5 h-5" /></button>}
                    items={[
                      { label: 'View Portal', onClick: () => setViewInvoice(invoice), icon: <Eye className="w-4 h-4" /> },
                      { label: 'Download PDF', onClick: () => generatePDF(invoice), icon: <Download className="w-4 h-4" /> },
                      { label: 'Copy Link', onClick: () => copyPortalLink(invoice.share_token), icon: <Share2 className="w-4 h-4" /> },
                      invoice.status !== 'paid' && { label: 'Mark Paid', onClick: () => updateStatusMutation.mutate({ id: invoice.id, status: 'paid' }), icon: <Check className="w-4 h-4 text-green-600" /> },
                      invoice.status !== 'paid' && { label: 'Mark Partial', onClick: () => updateStatusMutation.mutate({ id: invoice.id, status: 'partially_paid' }), icon: <AlertCircle className="w-4 h-4 text-yellow-600" /> },
                      { label: 'Edit', onClick: () => handleOpenModal(invoice), icon: <Edit className="w-4 h-4" /> },
                      { label: 'Delete', onClick: () => deleteMutation.mutate(invoice.id), icon: <Trash2 className="w-4 h-4" />, danger: true },
                    ].filter(Boolean) as any[]}
                  />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div><span className="text-gray-500">Created:</span> {formatDate(invoice.created_at)}</div>
                <div><span className="text-gray-500">Subtotal:</span> {formatCurrency(subtotal, invoice.currency)}</div>
                {invoice.gst_amount && <div><span className="text-gray-500">GST:</span> {formatCurrency(invoice.gst_amount, invoice.currency)}</div>}
                <div className="font-semibold"><span className="text-gray-500">Total:</span> {formatCurrency(total, invoice.currency)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingInvoice(null) }} title={editingInvoice ? 'Edit Invoice' : 'Create Invoice'} className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Project" {...register('project_id')} error={errors.project_id?.message} as="select">
            <option value="">Select project</option>
            {projects?.map(p => <option key={p.id} value={p.id}>{p.name} - {p.client?.name}</option>)}
          </Input>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Line Items</label>
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input placeholder="Description" value={item.description} onChange={e => updateLineItem(index, 'description', e.target.value)} className="flex-1" />
                  <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)} className="w-20" />
                  <Input type="number" min="0" step="100" placeholder="Price" value={item.unit_price} onChange={e => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)} className="w-32" />
                  <span className="flex items-center px-3 text-gray-900">{formatCurrency(item.quantity * item.unit_price, watch('currency'))}</span>
                  <Button type="button" variant="danger" size="sm" onClick={() => removeLineItem(index)} className="mt-6"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addLineItem} size="sm"><Plus className="w-4 h-4 mr-1" />Add Item</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Currency" {...register('currency')} as="select">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </Input>
            <Input label="GST Amount (optional)" type="number" min="0" step="100" {...register('gst_amount', { valueAsNumber: true })} />
          </div>
          <Input label="Milestone Label (optional)" placeholder="e.g., 50% Advance" {...register('milestone_label')} />

          <div className="bg-gray-50 p-4 rounded-lg text-right">
            <p className="text-lg font-semibold">Total: {formatCurrency(total, watch('currency'))}</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingInvoice(null) }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingInvoice ? 'Save Changes' : 'Create Invoice'}</Button>
          </div>
        </form>
      </Modal>

      {viewInvoice && (
        <Modal isOpen={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Client Portal Preview" className="max-w-2xl">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{viewInvoice.project?.name}</h4>
              <p className="text-sm text-gray-500">{viewInvoice.project?.client?.name}</p>
              <div className="mt-3 space-y-2">
                {viewInvoice.line_items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.description} x {item.quantity}</span>
                    <span>{formatCurrency(item.quantity * item.unit_price, viewInvoice.currency)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total, viewInvoice.currency)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-brand-50 rounded-lg">
              <p className="text-sm text-brand-800">Share link:</p>
              <div className="flex gap-2 mt-2">
                <Input value={`${window.location.origin}/${user?.username}/${viewInvoice.share_token}`} readOnly className="flex-1" />
                <Button variant="secondary" onClick={() => copyPortalLink(viewInvoice.share_token)} size="sm">Copy</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}