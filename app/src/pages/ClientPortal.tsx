import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, CardContent, Badge, Button, Input, Modal, Avatar, Skeleton } from '../components/ui'
import { Calendar, DollarSign, CreditCard, FileText, Check, X, ExternalLink, QrCode, Download, AlertCircle, Send } from 'lucide-react'
import { formatCurrency, formatDate } from '../lib/utils'
import { QRCodeCanvas as QRCode } from 'qrcode.react'

export function ClientPortal() {
  const { username, share_token } = useParams()
  const [viewContract, setViewContract] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  const { data: portalData, isLoading } = useQuery({
    queryKey: ['clientPortal', username, share_token],
    queryFn: async () => {
      if (!username || !share_token) return null
      const { data: proposal, error } = await supabase
        .from('proposals')
        .select(`
          *,
          project:projects(
            *,
            client:clients(*),
            user:users(*)
          )
        `)
        .eq('share_token', share_token)
        .single()
      if (error) throw error
      return proposal
    },
    enabled: !!username && !!share_token,
  })

  const { data: projectMilestones } = useQuery({
    queryKey: ['milestones', portalData?.project?.id],
    queryFn: async () => {
      if (!portalData?.project?.id) return []
      const { data, error } = await supabase.from('milestones').select('*').eq('project_id', portalData.project.id).order('order_index')
      if (error) throw error
      return data
    },
    enabled: !!portalData?.project?.id,
  })

  const { data: projectInvoices } = useQuery({
    queryKey: ['invoices', portalData?.project?.id],
    queryFn: async () => {
      if (!portalData?.project?.id) return []
      const { data, error } = await supabase.from('invoices').select('*').eq('project_id', portalData.project.id).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!portalData?.project?.id,
  })

  const { data: projectPaymentMethods } = useQuery({
    queryKey: ['projectPaymentMethods', portalData?.project?.id],
    queryFn: async () => {
      if (!portalData?.project?.id) return []
      const { data, error } = await supabase
        .from('project_payment_methods')
        .select('payment_method:payment_methods(*)')
        .eq('project_id', portalData.project.id)
      if (error) throw error
      return data?.map((p: any) => p.payment_method).filter(Boolean) || []
    },
    enabled: !!portalData?.project?.id,
  })

  useEffect(() => {
    if (projectPaymentMethods) setPaymentMethods(projectPaymentMethods)
  }, [projectPaymentMethods])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6"><Skeleton className="h-8 w-1/2 mb-4" /><Skeleton className="h-4 w-1/3 mb-2" /><Skeleton className="h-4 w-1/4" /></Card>
          <Card className="p-6"><Skeleton className="h-8 w-1/2 mb-4" /><Skeleton className="h-4 w-1/3" /></Card>
          <Card className="p-6"><Skeleton className="h-8 w-1/2 mb-4" /><div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div></Card>
        </div>
      </div>
    )
  }

  if (!portalData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Proposal Not Found</h1>
          <p className="text-gray-500 mt-2">This link may be invalid or has expired.</p>
          <Button variant="secondary" className="mt-6" onClick={() => window.location.href = 'https://clientflow.com'}>Go to ClientFlow</Button>
        </Card>
      </div>
    )
  }

  const proposal = portalData
  const project = proposal.project
  const freelancer = project.user
  const client = project.client

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={freelancer?.business_name || freelancer?.username || 'Freelancer'} size="lg" />
              <div>
                <h1 className="font-semibold text-gray-900">{freelancer?.business_name || freelancer?.username}</h1>
                <p className="text-sm text-gray-500">{project.name}</p>
              </div>
            </div>
            <Badge variant={proposal.status === 'accepted' ? 'success' : proposal.status === 'declined' ? 'danger' : 'warning'}>
              {proposal.status}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Proposal Section */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Proposal</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none text-gray-700">{proposal.service_description}</div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(proposal.price, proposal.currency || 'INR')}</span>
            </div>
            {proposal.timeline && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Timeline: {proposal.timeline}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract */}
        {proposal.status === 'accepted' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-lg font-semibold">Contract</h2>
              <Button variant="secondary" size="sm" onClick={() => { setContract({ terms_text: 'Standard contract terms...', client_signature_name: client.name, signed_at: new Date().toISOString() }); setViewContract(true) }}>
                View Contract
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Contract auto-generated from template. Signed by {client.name} on {formatDate(proposal.created_at)}</p>
            </CardContent>
          </Card>
        )}

        {/* Milestones */}
        {projectMilestones && projectMilestones.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Project Timeline</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectMilestones.map((milestone: any, index: number) => (
                  <div key={milestone.id} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${milestone.status === 'completed' ? 'bg-green-500 text-white' : milestone.status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {milestone.status === 'completed' ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{milestone.title}</p>
                      <p className="text-sm text-gray-500 capitalize">{milestone.status.replace('_', ' ')}</p>
                    </div>
                    {milestone.status === 'completed' && <Badge variant="success" className="text-xs">Done</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices */}
        {projectInvoices && projectInvoices.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Invoices</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projectInvoices.map((invoice: any) => (
                  <div key={invoice.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.milestone_label || 'Invoice'}</p>
                        <p className="text-sm text-gray-500">Created {formatDate(invoice.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total_amount, invoice.currency)}</p>
                        <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : invoice.status === 'partially_paid' ? 'warning' : 'warning'} className="mt-1">
                          {invoice.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" className="mt-3" onClick={() => setViewInvoice(invoice)}>
                      {invoice.status === 'paid' ? 'View Receipt' : 'Pay Now'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods */}
        {paymentMethods.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Payment Methods</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Pay directly to the freelancer using one of these methods:</p>
              <div className="grid gap-4 md:grid-cols-2">
                {paymentMethods.map((method: any) => (
                  <div key={method.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{method.type === 'upi' && '📱' || method.type === 'paypal' && '💙' || method.type === 'bank_transfer' && '🏦' || '💳'}</span>
                      <div>
                        <h4 className="font-medium">{method.label}</h4>
                        <p className="text-sm text-gray-500 capitalize">{method.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {method.link_or_handle && <p className="text-sm font-mono text-gray-600 mb-2">{method.link_or_handle}</p>}
                    {method.qr_image_url && (
                      <div className="text-center">
                        <QRCode value={method.link_or_handle || method.qr_image_url} size={120} />
                        <p className="text-xs text-gray-500 mt-1">Scan to pay</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-8 border-t border-gray-200">
          <p>Portal powered by <a href="https://clientflow.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">ClientFlow</a></p>
          <p className="mt-1">Manage your clients professionally from one secure portal.</p>
        </div>
      </main>

      {/* Contract Modal */}
      {viewContract && contract && (
        <Modal isOpen onClose={() => setViewContract(false)} title="Contract" className="max-w-2xl">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{contract.terms_text}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <p className="font-medium">Signed by: {contract.client_signature_name}</p>
                <p className="text-sm text-gray-500">Date: {formatDate(contract.signed_at || '')}</p>
              </div>
              <Button variant="secondary" onClick={() => setViewContract(false)}><Download className="w-4 h-4 mr-1" />Download PDF</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invoice Payment Modal */}
      {viewInvoice && (
        <Modal isOpen onClose={() => setViewInvoice(null)} title="Payment Options" className="max-w-md">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Pay <strong>{formatCurrency(viewInvoice.total_amount, viewInvoice.currency)}</strong> directly to the freelancer:</p>
            {paymentMethods.map((method: any) => (
              <div key={method.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{method.type === 'upi' && '📱' || method.type === 'paypal' && '💙' || method.type === 'bank_transfer' && '🏦' || '💳'}</span>
                  <div>
                    <h4 className="font-medium">{method.label}</h4>
                    <p className="text-sm text-gray-500 capitalize">{method.type.replace('_', ' ')}</p>
                  </div>
                </div>
                {method.link_or_handle && <p className="text-sm font-mono text-gray-600 mb-2">{method.link_or_handle}</p>}
                {method.qr_image_url && (
                  <div className="text-center">
                    <QRCode value={method.link_or_handle || method.qr_image_url} size={150} />
                    <p className="text-xs text-gray-500 mt-1">Scan to pay</p>
                  </div>
                )}
              </div>
            ))}
            <p className="text-xs text-gray-500 text-center">After payment, enter Transaction/UTR ID on the invoice to notify the freelancer.</p>
          </div>
        </Modal>
      )}
    </div>
  )
}