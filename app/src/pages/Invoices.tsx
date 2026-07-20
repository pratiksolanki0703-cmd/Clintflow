import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, Badge, Modal, Skeleton, Textarea, Dropdown, EmptyState, SearchInput } from '../components/ui'
import { Plus, Edit, Trash2, CreditCard, Eye, MoreVertical, Download, Share2, DollarSign, AlertCircle, Check } from 'lucide-react'
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
        .select(`*, project:projects(name, client:clients(name, email))`)
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
  const gstAmount = watch('gst_amount') || 0
  const total = subtotal + gstAmount

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
    const q = search.toLowerCase()
    return inv.project?.name?.toLowerCase().includes(q) || inv.project?.client?.name?.toLowerCase().includes(q)
  }) || []

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    partially_paid: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300',
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    overdue: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
  }

  const generatePDF = (invoice: any) => {
    const doc = new jsPDF()
    const items = invoice.line_items || []
    const invoiceSubtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)
    const invoiceGst = invoice.gst_amount || 0
    const invoiceTotal = invoiceSubtotal + invoiceGst

    doc.setFontSize(20)
    doc.text('INVOICE', 20, 20)
    doc.setFontSize(10)
    doc.text(`Invoice #: ${invoice.id.slice(0, 8).toUpperCase()}`, 20, 30)
    doc.text(`Date: ${formatDate(invoice.created_at)}`, 20, 37)
    doc.text(`Status: ${invoice.status.replace('_', ' ')}`, 20, 44)
    doc.text(`From: ${user?.business_name || user?.username}`, 20, 54)
    doc.text(`To: ${invoice.project?.client?.name}`, 20, 61)
    if (invoice.project?.client?.email) doc.text(invoice.project.client.email, 20, 68)

    let y = 80
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Description', 20, y)
    doc.text('Qty', 120, y)
    doc.text('Rate', 140, y)
    doc.text('Amount', 170, y)
    doc.line(20, y + 1, 190, y + 1)
    doc.setFont('helvetica', 'normal')
    y += 9

    items.forEach((item: any) => {
      const amount = item.quantity * item.unit_price
      doc.text(item.description, 20, y)
      doc.text(item.quantity.toString(), 120, y)
      doc.text(formatCurrency(item.unit_price, invoice.currency), 140, y)
      doc.text(formatCurrency(amount, invoice.currency), 170, y)
      y += 8
    })

    doc.line(20, y, 190, y)
    y += 8
    doc.text(`Subtotal: ${formatCurrency(invoiceSubtotal, invoice.currency)}`, 140, y)
    y += 7
    if (invoiceGst > 0) {
      doc.text(`GST: ${formatCurrency(invoiceGst, invoice.currency)}`, 140, y)
      y += 7
    }
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total: ${formatCurrency(invoiceTotal, invoice.currency)}`, 140, y)

    doc.save(`invoice-${invoice.id.slice(0, 8).toUpperCase()}.pdf`)
  }

  const copyPortalLink = (token: string) => {
    const url = `${window.location.origin}/${user?.username}/${token}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400">Keep every invoice and payment status organized.</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="lg"><Plus className="w-5 h-5 mr-2" />Create Invoice</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoices..." className="flex-1 max-w-md" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="input w-full sm:w-auto">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></Card>)}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={search ? 'No invoices match your search' : 'No invoices yet'}
          description={search ? 'Try a different search term.' : 'Create your first invoice to start tracking payments.'}
          action={search ? undefined : { label: 'Create Invoice', onClick: () => handleOpenModal() }}
        />
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map(invoice => {
            const items = invoice.line_items || []
            const invSubtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)
            const invGst = invoice.gst_amount || 0
            const invTotal = invSubtotal + invGst

            return (
              <Card key={invoice.id} className="p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{invoice.project?.name || 'Invoice'}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[invoice.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {invoice.status.replace('_', ' ')}
                      </span>
                      {invoice.milestone_label && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                          {invoice.milestone_label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{invoice.project?.client?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(invTotal, invoice.currency)}
                    </span>
                    <Dropdown
                      trigger={<button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><MoreVertical className="w-5 h-5" /></button>}
                      items={[
                        { label: 'View Preview', onClick: () => setViewInvoice(invoice), icon: <Eye className="w-4 h-4" /> },
                        { label: 'Download PDF', onClick: () => generatePDF(invoice), icon: <Download className="w-4 h-4" /> },
                        { label: 'Copy Link', onClick: () => copyPortalLink(invoice.share_token), icon: <Share2 className="w-4 h-4" /> },
                        invoice.status !== 'paid' && { label: 'Mark Paid', onClick: () => updateStatusMutation.mutate({ id: invoice.id, status: 'paid' }), icon: <Check className="w-4 h-4 text-emerald-600" /> },
                        invoice.status !== 'paid' && { label: 'Mark Partial', onClick: () => updateStatusMutation.mutate({ id: invoice.id, status: 'partially_paid' }), icon: <AlertCircle className="w-4 h-4 text-orange-600" /> },
                        { label: 'Edit', onClick: () => handleOpenModal(invoice), icon: <Edit className="w-4 h-4" /> },
                        { label: 'Delete', onClick: () => deleteMutation.mutate(invoice.id), icon: <Trash2 className="w-4 h-4" />, danger: true },
                      ].filter(Boolean) as any[]}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div><span className="text-gray-400 dark:text-gray-500">Created:</span> <span className="text-gray-700 dark:text-gray-300">{formatDate(invoice.created_at)}</span></div>
                  <div><span className="text-gray-400 dark:text-gray-500">Subtotal:</span> <span className="text-gray-700 dark:text-gray-300">{formatCurrency(invSubtotal, invoice.currency)}</span></div>
                  {invGst > 0 && <div><span className="text-gray-400 dark:text-gray-500">GST:</span> <span className="text-gray-700 dark:text-gray-300">{formatCurrency(invGst, invoice.currency)}</span></div>}
                  <div className="font-semibold"><span className="text-gray-400 dark:text-gray-500">Total:</span> <span className="text-gray-900 dark:text-white">{formatCurrency(invTotal, invoice.currency)}</span></div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingInvoice(null) }} title={editingInvoice ? 'Edit Invoice' : 'Create Invoice'} className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Project" {...register('project_id')} error={errors.project_id?.message} as="select">
            <option value="">Select project</option>
            {projects?.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client?.name}</option>)}
          </Input>

          <div>
            <label className="label">Line Items</label>
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input placeholder="Description" value={item.description} onChange={e => updateLineItem(index, 'description', e.target.value)} className="flex-1" />
                  <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)} className="w-16 sm:w-20" />
                  <Input type="number" min="0" step="100" placeholder="Price" value={item.unit_price} onChange={e => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)} className="w-24 sm:w-28" />
                  <div className="flex h-11 items-center px-2 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(item.quantity * item.unit_price, watch('currency'))}
                  </div>
                  <button type="button" onClick={() => removeLineItem(index)} className="mt-1.5 p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="w-4 h-4" />
                  </button>
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

          <div className="rounded-xl bg-gray-50 p-4 text-right dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Subtotal: {formatCurrency(subtotal, watch('currency'))}</p>
            {gstAmount > 0 && <p className="text-sm text-gray-500 dark:text-gray-400">GST: {formatCurrency(gstAmount, watch('currency'))}</p>}
            <p className="text-lg font-bold text-gray-900 dark:text-white">Total: {formatCurrency(total, watch('currency'))}</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingInvoice(null) }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingInvoice ? 'Save Changes' : 'Create Invoice'}</Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Preview Modal */}
      {viewInvoice && (
        <Modal isOpen={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Client Portal Preview" className="max-w-2xl">
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-5 dark:bg-gray-800">
              <h4 className="font-semibold text-gray-900 dark:text-white">{viewInvoice.project?.name || 'Invoice'}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{viewInvoice.project?.client?.name}</p>
              <div className="mt-4 space-y-2">
                {(viewInvoice.line_items || []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.description} × {item.quantity}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.quantity * item.unit_price, viewInvoice.currency)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2 dark:border-gray-700">
                  {viewInvoice.gst_amount > 0 && (
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>GST</span>
                      <span>{formatCurrency(viewInvoice.gst_amount, viewInvoice.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>{formatCurrency(
                      (viewInvoice.line_items || []).reduce((s: number, it: any) => s + it.quantity * it.unit_price, 0) + (viewInvoice.gst_amount || 0),
                      viewInvoice.currency
                    )}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-950/30">
              <p className="text-sm font-medium text-brand-800 dark:text-brand-200">Share this link with your client:</p>
              <div className="flex gap-2 mt-2">
                <Input value={`${window.location.origin}/${user?.username}/${viewInvoice.share_token}`} readOnly className="flex-1 font-mono text-sm" />
                <Button variant="secondary" onClick={() => copyPortalLink(viewInvoice.share_token)} size="sm">Copy</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
