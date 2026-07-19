import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, CardHeader, CardContent, Badge, Modal, Skeleton, Avatar, Textarea, Dropdown } from '../components/ui'
import { Plus, Search, Edit, Trash2, CreditCard, QrCode, DollarSign, Shield, Upload, Download, Settings as SettingsIcon, User, Bell, Palette, Key, Globe, LogOut } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCurrency, generateShareToken } from '../lib/utils'
import { QRCodeCanvas as QRCode } from 'qrcode.react'

const paymentMethodSchema = z.object({
  type: z.enum(['upi', 'paypal', 'bank_transfer', 'stripe', 'wise', 'payoneer', 'other']),
  label: z.string().min(1, 'Label is required'),
  qr_image_url: z.string().url().optional().or(z.literal('')),
  link_or_handle: z.string().optional(),
  is_active: z.boolean().default(true),
})

type PaymentMethodForm = z.infer<typeof paymentMethodSchema>

export function Settings() {
  const { user, signOut, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'profile' | 'payment-methods' | 'branding' | 'billing'>('profile')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [uploadingQR, setUploadingQR] = useState<string | null>(null)

  const { data: paymentMethods, isLoading: pmLoading } = useQuery({
    queryKey: ['paymentMethods', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase.from('payment_methods').select('*').eq('user_id', user.id).order('display_order')
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const { data: subscriptionPlans } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('price_monthly')
      if (error) throw error
      return data
    },
  })

  const createPaymentMutation = useMutation({
    mutationFn: async (method: PaymentMethodForm) => {
      const { data, error } = await supabase.from('payment_methods').insert({ ...method, user_id: user!.id, display_order: (paymentMethods?.length || 0) + 1 }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paymentMethods'] }); setShowPaymentModal(false) },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentMethodForm> & { id: string }) => {
      const { data, error } = await supabase.from('payment_methods').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paymentMethods'] }); setShowPaymentModal(false); setEditingPayment(null) },
  })

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('payment_methods').delete().eq('id', id); if (error) throw error },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentMethods'] }),
  })

  const uploadQR = async (id: string, file: File) => {
    setUploadingQR(id)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('payment-qrs').upload(fileName, file)
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('payment-qrs').getPublicUrl(fileName)
    await updatePaymentMutation.mutateAsync({ id, qr_image_url: publicUrl })
    setUploadingQR(null)
  }

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<PaymentMethodForm>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { type: 'upi', label: '', is_active: true },
  })

  const handleOpenPaymentModal = (method?: any) => {
    if (method) {
      setEditingPayment(method)
      reset({ type: method.type, label: method.label, qr_image_url: method.qr_image_url || '', link_or_handle: method.link_or_handle || '', is_active: method.is_active })
    } else {
      setEditingPayment(null)
      reset({ type: 'upi', label: '', qr_image_url: '', link_or_handle: '', is_active: true })
    }
    setShowPaymentModal(true)
  }

  const onSubmitPayment = (data: PaymentMethodForm) => {
    if (editingPayment) updatePaymentMutation.mutate({ id: editingPayment.id, ...data })
    else createPaymentMutation.mutate(data)
  }

  const handleProfileUpdate = async (data: { business_name: string; gst_number: string; profession: string }) => {
    const { error } = await supabase.from('users').update(data).eq('id', user!.id)
    if (error) throw error
    await refreshUser()
  }

  const handleBrandingUpdate = async (data: { brand_color: string; logo_url: string }) => {
    const { error } = await supabase.from('users').update(data).eq('id', user!.id)
    if (error) throw error
    await refreshUser()
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'billing', label: 'Billing', icon: Shield },
  ]

  const currentPlan = subscriptionPlans?.find(p => p.plan_key === user?.plan_key)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4 inline mr-1" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Profile Information</h2></CardHeader>
            <CardContent>
              <form onSubmit={e => { e.preventDefault(); handleProfileUpdate({ business_name: (e.target as any).business_name.value, gst_number: (e.target as any).gst_number.value, profession: (e.target as any).profession.value }) }} className="space-y-4">
                <Input label="Business Name" defaultValue={user?.business_name || ''} name="business_name" />
                <Input label="Username" value={user?.username || ''} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Username cannot be changed. It's your portal URL: app.clientflow.com/{user?.username}</p>
                <Input label="Email" type="email" value={user?.email || ''} disabled className="bg-gray-50" />
                <Input label="GST Number (optional)" defaultValue={user?.gst_number || ''} name="gst_number" placeholder="27AAAAA0000A1Z5" />
                <Input label="Profession" defaultValue={user?.profession || ''} name="profession" placeholder="Web Developer, Designer, etc." />
                <Button type="submit" className="w-full">Save Profile</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Portal URL</h2></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Your client portal link:</p>
                <div className="flex gap-2 mt-2">
                  <Input value={`https://app.clientflow.com/${user?.username}`} readOnly className="flex-1 font-mono text-sm" />
                  <Button variant="secondary" onClick={() => navigator.clipboard.writeText(`https://app.clientflow.com/${user?.username}`)}>Copy</Button>
                </div>
              </div>
              <div className="p-4 bg-brand-50 rounded-lg text-center">
                <QRCode value={`https://app.clientflow.com/${user?.username}`} size={128} className="mx-auto" />
                <p className="text-xs text-brand-700 mt-2">Scan to open your portal</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment-methods' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Payment Methods</h2>
            <Button onClick={() => handleOpenPaymentModal()}><Plus className="w-5 h-5 mr-2" />Add Method</Button>
          </div>

          {pmLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-8 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></Card>)}
            </div>
          ) : paymentMethods?.length === 0 ? (
            <Card className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No payment methods yet</h3>
              <p className="text-gray-500 mt-1">Add UPI, Bank Transfer, PayPal, etc. for clients to pay you</p>
              <Button onClick={() => handleOpenPaymentModal()} className="mt-4"><Plus className="w-5 h-5 mr-2" />Add Method</Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paymentMethods.map(method => (
                <Card key={method.id} className="p-4 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-brand-100 rounded-lg">{method.type === 'upi' && '📱' || method.type === 'paypal' && '💙' || method.type === 'bank_transfer' && '🏦' || '💳'}</span>
                        <h3 className="font-medium text-gray-900">{method.label}</h3>
                        <Badge variant={method.is_active ? 'success' : 'default'}>{method.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 capitalize">{method.type.replace('_', ' ')}</p>
                      {method.link_or_handle && <p className="text-sm text-gray-600 mt-1 font-mono truncate">{method.link_or_handle}</p>}
                    </div>
                    <Dropdown
                      trigger={<button className="p-1 text-gray-400 hover:text-gray-600"><MoreVertical className="w-5 h-5" /></button>}
                      items={[
                        { label: 'Edit', onClick: () => handleOpenPaymentModal(method), icon: <Edit className="w-4 h-4" /> },
                        method.qr_image_url && { label: 'View QR', onClick: () => setViewQR(method), icon: <QrCode className="w-4 h-4" /> },
                        { label: 'Delete', onClick: () => deletePaymentMutation.mutate(method.id), icon: <Trash2 className="w-4 h-4" />, danger: true },
                      ].filter(Boolean) as any[]}
                    />
                  </div>
                  {method.qr_image_url && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                      <QRCode value={method.link_or_handle || method.qr_image_url} size={100} />
                      <p className="text-xs text-gray-500 mt-1">Scan to pay</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          <Modal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setEditingPayment(null) }} title={editingPayment ? 'Edit Payment Method' : 'Add Payment Method'}>
            <form onSubmit={handleSubmit(onSubmitPayment)} className="space-y-4">
              <Input label="Label" placeholder="e.g., Main UPI, Business Account" {...register('label')} error={errors.label?.message} />
              <Input label="Type" {...register('type')} as="select">
                <option value="upi">UPI</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="stripe">Stripe</option>
                <option value="wise">Wise</option>
                <option value="payoneer">Payoneer</option>
                <option value="other">Other</option>
              </Input>
              <Input label="Link / Handle (UPI ID, PayPal.me, IBAN, etc.)" placeholder="name@upi / paypal.me/name" {...register('link_or_handle')} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">QR Code Image</label>
                {editingPayment?.qr_image_url && (
                  <div className="mb-2">
                    <QRCode value={editingPayment.qr_image_url} size={100} />
                    <p className="text-xs text-gray-500 mt-1">Current QR</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && uploadQR(editingPayment!.id, e.target.files[0])}
                  disabled={!editingPayment || uploadingQR === editingPayment?.id}
                  className="hidden"
                  id={`qr-upload-${editingPayment?.id}`}
                />
                <Button type="button" variant="secondary" onClick={() => document.getElementById(`qr-upload-${editingPayment?.id}`)?.click()} disabled={!editingPayment || uploadingQR === editingPayment?.id}>
                  {uploadingQR === editingPayment?.id ? 'Uploading...' : 'Upload QR Image'}
                </Button>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('is_active')} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => { setShowPaymentModal(false); setEditingPayment(null) }}>Cancel</Button>
                <Button type="submit" loading={createPaymentMutation.isPending || updatePaymentMutation.isPending}>{editingPayment ? 'Save Changes' : 'Add Method'}</Button>
              </div>
            </form>
          </Modal>

          {viewQR && (
            <Modal isOpen={!!viewQR} onClose={() => setViewQR(null)} title="QR Code" className="max-w-sm">
              <div className="text-center">
                <QRCode value={viewQR.link_or_handle || viewQR.qr_image_url} size={200} />
                <p className="text-sm text-gray-500 mt-2">{viewQR.label}</p>
                <Button variant="secondary" className="mt-4" onClick={() => { const canvas = document.querySelector('canvas'); if (canvas) { const link = document.createElement('a'); link.href = canvas.toDataURL(); link.download = 'qr.png'; link.click() } }}>Download</Button>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Branding</h2></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); handleBrandingUpdate({ brand_color: (e.target as any).brand_color.value, logo_url: (e.target as any).logo_url.value }) }} className="space-y-4 max-w-md">
              <Input label="Brand Color" type="color" defaultValue={user?.brand_color || '#0ea5e9'} name="brand_color" />
              <Input label="Logo URL (optional)" defaultValue={user?.logo_url || ''} name="logo_url" placeholder="https://example.com/logo.png" />
              <p className="text-sm text-gray-500">Custom branding is available on Professional and Agency plans.</p>
              <Button type="submit">Save Branding</Button>
            </form>
            {user?.plan_key === 'free' && <p className="text-sm text-gray-500 mt-4">Upgrade to Professional or Agency plan to use custom branding.</p>}
          </CardContent>
        </Card>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Current Plan</h2>
                <p className="text-gray-600">Manage your subscription</p>
              </div>
              <Badge variant={currentPlan?.plan_key === 'free' ? 'default' : 'success'} className="text-lg px-3 py-1">
                {currentPlan?.display_name || 'Free'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {subscriptionPlans?.map(plan => (
                  <Card key={plan.plan_key} className={`relative ${plan.plan_key === user?.plan_key ? 'ring-2 ring-brand-600' : ''}`}>
                    {plan.plan_key === user?.plan_key && <div className="absolute -top-2 -right-2 bg-brand-600 text-white text-xs px-2 py-0.5 rounded-full">Current</div>}
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg">{plan.display_name}</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-2">₹{plan.price_monthly}/mo</p>
                      <p className="text-sm text-gray-500">₹{plan.price_yearly}/year (save ~16%)</p>
                      <ul className="mt-4 space-y-2 text-sm text-gray-600">
                        <li>✓ {plan.max_clients ? `${plan.max_clients} clients` : 'Unlimited clients'}</li>
                        <li>✓ {plan.max_projects_per_month ? `${plan.max_projects_per_month} projects/mo` : 'Unlimited projects'}</li>
                        <li>✓ {plan.ai_credits_per_month} AI credits/mo</li>
                        <li>✓ {plan.emails_per_month} emails/mo</li>
                        {plan.has_custom_branding && <li>✓ Custom branding</li>}
                        {!plan.shows_powered_by_footer && <li>✓ No "Powered by" footer</li>}
                      </ul>
                      <Button className="mt-4 w-full" variant={plan.plan_key === user?.plan_key ? 'secondary' : 'primary'} disabled={plan.plan_key === user?.plan_key}>
                        {plan.plan_key === user?.plan_key ? 'Current Plan' : 'Upgrade'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold">AI Credits</h2></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{user?.ai_credits_remaining || 0}</p>
                  <p className="text-gray-500">Credits remaining this month</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Plan includes</p>
                  <p className="text-2xl font-bold text-brand-600">{currentPlan?.ai_credits_per_month || 5}/month</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Top-up packs: 25 credits ₹49 | 100 credits ₹149 | 500 credits ₹499</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}