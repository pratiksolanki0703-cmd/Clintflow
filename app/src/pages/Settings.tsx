import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, Badge, Modal, Skeleton, Avatar, Dropdown } from '../components/ui'
import { Plus, Edit, Trash2, CreditCard, QrCode, MoreVertical, Upload, User, Palette, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCurrency } from '../lib/utils'
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
  const [viewQR, setViewQR] = useState<any>(null)
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentMethodForm>({
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

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = {
      business_name: (form as any).business_name.value,
      gst_number: (form as any).gst_number.value,
      profession: (form as any).profession.value,
    }
    const { error } = await supabase.from('users').update(data).eq('id', user!.id)
    if (error) throw error
    await refreshUser()
  }

  const handleBrandingUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = {
      brand_color: (form as any).brand_color.value,
      logo_url: (form as any).logo_url.value,
    }
    const { error } = await supabase.from('users').update(data).eq('id', user!.id)
    if (error) throw error
    await refreshUser()
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'payment-methods', label: 'Payments', icon: CreditCard },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'billing', label: 'Billing', icon: Shield },
  ] as const

  const currentPlan = subscriptionPlans?.find(p => p.plan_key === user?.plan_key)

  const typeEmojis: Record<string, string> = {
    upi: '📱',
    paypal: '💙',
    bank_transfer: '🏦',
    stripe: '💳',
    wise: '🌍',
    payoneer: '🔵',
    other: '💳',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your profile, business, and preferences.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-950/50 dark:text-brand-300'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <Input label="Business Name" defaultValue={user?.business_name || ''} name="business_name" />
              <Input label="Username" value={user?.username || ''} disabled className="bg-gray-50 dark:bg-gray-800" />
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">Your portal URL: app.clientflow.com/{user?.username}</p>
              <Input label="Email" type="email" value={user?.email || ''} disabled className="bg-gray-50 dark:bg-gray-800" />
              <Input label="GST Number (optional)" defaultValue={user?.gst_number || ''} name="gst_number" placeholder="27AAAAA0000A1Z5" />
              <Input label="Profession" defaultValue={user?.profession || ''} name="profession" placeholder="Web Developer, Designer, etc." />
              <Button type="submit" className="w-full">Save Profile</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Portal</h2>
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share your client portal:</p>
                <div className="flex gap-2">
                  <Input value={`https://app.clientflow.com/${user?.username}`} readOnly className="flex-1 font-mono text-sm" />
                  <Button variant="secondary" onClick={() => navigator.clipboard.writeText(`https://app.clientflow.com/${user?.username}`)} size="sm">Copy</Button>
                </div>
              </div>
              <div className="rounded-xl bg-brand-50 p-5 text-center dark:bg-brand-950/30">
                <QRCode value={`https://app.clientflow.com/${user?.username}`} size={120} className="mx-auto" />
                <p className="text-xs text-brand-700 mt-2 dark:text-brand-300">Scan to open your portal</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Payment Methods Tab ── */}
      {activeTab === 'payment-methods' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Let clients pay you the way they prefer.</p>
            </div>
            <Button onClick={() => handleOpenPaymentModal()}><Plus className="w-5 h-5 mr-2" />Add Method</Button>
          </div>

          {pmLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-8 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></Card>)}
            </div>
          ) : paymentMethods?.length === 0 ? (
            <Card className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
                <CreditCard className="h-7 w-7 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">No payment methods yet</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Add UPI, Bank Transfer, PayPal, etc. for clients to pay you.</p>
              <Button onClick={() => handleOpenPaymentModal()} className="mt-4"><Plus className="w-5 h-5 mr-2" />Add Method</Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paymentMethods.map(method => (
                <Card key={method.id} className="p-5 transition-all hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeEmojis[method.type] || '💳'}</span>
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{method.label}</h3>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          method.is_active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {method.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{method.type.replace('_', ' ')}</p>
                      {method.link_or_handle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono truncate">{method.link_or_handle}</p>
                      )}
                    </div>
                    <Dropdown
                      trigger={<button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><MoreVertical className="w-5 h-5" /></button>}
                      items={[
                        { label: 'Edit', onClick: () => handleOpenPaymentModal(method), icon: <Edit className="w-4 h-4" /> },
                        method.qr_image_url && { label: 'View QR', onClick: () => setViewQR(method), icon: <QrCode className="w-4 h-4" /> },
                        { label: 'Delete', onClick: () => deletePaymentMutation.mutate(method.id), icon: <Trash2 className="w-4 h-4" />, danger: true },
                      ].filter(Boolean) as any[]}
                    />
                  </div>
                  {method.qr_image_url && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-800">
                      <QRCode value={method.link_or_handle || method.qr_image_url} size={80} className="mx-auto" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Scan to pay</p>
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
              <Input label="Link / Handle" placeholder="name@upi / paypal.me/name" {...register('link_or_handle')} />
              <div>
                <label className="label">QR Code</label>
                {editingPayment?.qr_image_url && (
                  <div className="mb-3 rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-800">
                    <QRCode value={editingPayment.qr_image_url} size={100} className="mx-auto" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current QR</p>
                  </div>
                )}
                {editingPayment ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files?.[0] && uploadQR(editingPayment.id, e.target.files[0])}
                      disabled={uploadingQR === editingPayment?.id}
                      className="hidden"
                      id={`qr-upload-${editingPayment?.id}`}
                    />
                    <Button type="button" variant="secondary" onClick={() => document.getElementById(`qr-upload-${editingPayment?.id}`)?.click()} disabled={uploadingQR === editingPayment?.id}>
                      {uploadingQR === editingPayment?.id ? 'Uploading...' : <><Upload className="w-4 h-4 mr-1" />Upload QR</>}
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Save the method first, then upload QR.</p>
                )}
              </div>
              <label className="flex items-center gap-2 py-1">
                <input type="checkbox" {...register('is_active')} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="secondary" onClick={() => { setShowPaymentModal(false); setEditingPayment(null) }}>Cancel</Button>
                <Button type="submit" loading={createPaymentMutation.isPending || updatePaymentMutation.isPending}>{editingPayment ? 'Save Changes' : 'Add Method'}</Button>
              </div>
            </form>
          </Modal>

          {/* QR Code View Modal */}
          {viewQR && (
            <Modal isOpen={!!viewQR} onClose={() => setViewQR(null)} title={viewQR.label} className="max-w-sm">
              <div className="text-center py-4">
                <QRCode value={viewQR.link_or_handle || viewQR.qr_image_url} size={180} className="mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{viewQR.link_or_handle || 'QR Code'}</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => {
                    const canvas = document.querySelector('canvas')
                    if (canvas) {
                      const link = document.createElement('a')
                      link.href = canvas.toDataURL()
                      link.download = `qr-${viewQR.label}.png`
                      link.click()
                    }
                  }}
                >
                  Download QR
                </Button>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ── Branding Tab ── */}
      {activeTab === 'branding' && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Branding</h2>
          <form onSubmit={handleBrandingUpdate} className="space-y-4 max-w-md">
            <Input label="Brand Color" type="color" defaultValue={user?.brand_color || '#4f46e5'} name="brand_color" />
            <Input label="Logo URL (optional)" defaultValue={user?.logo_url || ''} name="logo_url" placeholder="https://example.com/logo.png" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Custom branding is available on paid plans.</p>
            <Button type="submit">Save Branding</Button>
          </form>
        </Card>
      )}

      {/* ── Billing Tab ── */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Plan</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your subscription</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                currentPlan?.plan_key === 'free'
                  ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
              }`}>
                {currentPlan?.display_name || 'Free'}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {subscriptionPlans?.map(plan => (
                <Card key={plan.plan_key} className={`p-6 relative ${plan.plan_key === user?.plan_key ? 'ring-2 ring-brand-600' : ''}`}>
                  {plan.plan_key === user?.plan_key && (
                    <span className="absolute -top-2.5 -right-2.5 rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-medium text-white">
                      Current
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-white">{plan.display_name}</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(plan.price_monthly)}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mo</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatCurrency(plan.price_yearly)}/year (save ~16%)</p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {plan.max_clients ? `${plan.max_clients} clients` : 'Unlimited clients'}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {plan.max_projects_per_month ? `${plan.max_projects_per_month} projects/mo` : 'Unlimited projects'}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {plan.ai_credits_per_month} AI credits/mo
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {plan.emails_per_month} emails/mo
                    </li>
                    {plan.has_custom_branding && (
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Custom branding
                      </li>
                    )}
                    {!plan.shows_powered_by_footer && (
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        No "Powered by" footer
                      </li>
                    )}
                  </ul>
                  <Button className="mt-5 w-full" variant={plan.plan_key === user?.plan_key ? 'secondary' : 'primary'} disabled={plan.plan_key === user?.plan_key}>
                    {plan.plan_key === user?.plan_key ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Credits</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Credits remaining this month</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{user?.ai_credits_remaining || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">of {currentPlan?.ai_credits_per_month || 5} / month</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all"
                style={{ width: `${Math.min(100, ((user?.ai_credits_remaining || 0) / Math.max(currentPlan?.ai_credits_per_month || 5, 1)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Top-up packs: 25 credits ₹49 | 100 credits ₹149 | 500 credits ₹499</p>
          </Card>
        </div>
      )}
    </div>
  )
}
