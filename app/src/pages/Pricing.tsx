import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui'
import { Check, Sparkles, ArrowLeft, Shield, Zap, Users, FolderKanban, Mail, Palette, CreditCard } from 'lucide-react'
import { formatCurrency } from '../lib/utils'

const PLANS = [
  {
    plan_key: 'free',
    display_name: 'Free',
    price_monthly: 0,
    price_yearly: 0,
    max_clients: 5,
    max_projects_per_month: 3,
    ai_credits_per_month: 5,
    emails_per_month: 50,
    has_custom_branding: false,
    shows_powered_by_footer: true,
    popular: false,
    features: [
      'Up to 5 clients',
      '3 active projects',
      '5 AI credits/month',
      '50 emails/month',
      'Basic invoicing',
      'Client portal',
    ],
  },
  {
    plan_key: 'professional',
    display_name: 'Professional',
    price_monthly: 999,
    price_yearly: 9990,
    max_clients: 50,
    max_projects_per_month: null,
    ai_credits_per_month: 100,
    emails_per_month: 1000,
    has_custom_branding: true,
    shows_powered_by_footer: false,
    popular: true,
    features: [
      'Up to 50 clients',
      'Unlimited projects',
      '100 AI credits/month',
      '1,000 emails/month',
      'Custom branding',
      'No "Powered by" footer',
      'Priority support',
      'Analytics dashboard',
    ],
  },
  {
    plan_key: 'agency',
    display_name: 'Agency',
    price_monthly: 2499,
    price_yearly: 24990,
    max_clients: null,
    max_projects_per_month: null,
    ai_credits_per_month: 500,
    emails_per_month: 5000,
    has_custom_branding: true,
    shows_powered_by_footer: false,
    popular: false,
    features: [
      'Unlimited clients',
      'Unlimited projects',
      '500 AI credits/month',
      '5,000 emails/month',
      'Custom branding',
      'No "Powered by" footer',
      'Priority support',
      'Advanced analytics',
      'Team collaboration',
      'API access',
    ],
  },
]

function PricingPage() {
  const { user } = useAuth()
  const isLoggedIn = !!user

  const { data: subscriptionPlans } = useQuery({
    queryKey: ['pricingPlans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('price_monthly')
      if (error) throw error
      return data
    },
  })

  const planToShow = subscriptionPlans && subscriptionPlans.length > 0
    ? subscriptionPlans
    : PLANS

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Simple header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">C</span>
            <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">Client<span className="text-brand-600">Flow</span></span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link to="/settings?tab=billing">
                <Button variant="secondary" size="sm">My Plan</Button>
              </Link>
            ) : (
              <>
                <Link to="/login"><Button variant="secondary" size="sm">Sign In</Button></Link>
                <Link to="/create-account"><Button size="sm">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-500 shadow-lg">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-lg text-gray-500 dark:text-gray-400">
            Everything you need to manage your freelance business. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {planToShow.map((plan, index) => (
            <div
              key={plan.plan_key}
              className={`relative flex flex-col rounded-2xl border bg-[var(--color-surface)] p-6 shadow-sm transition-all hover:shadow-md sm:p-8 ${
                plan.popular
                  ? 'border-brand-500 ring-2 ring-brand-500/20 scale-[1.02] lg:scale-105'
                  : 'border-[var(--color-border)]'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.display_name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-950 dark:text-white">
                    {plan.price_monthly === 0 ? 'Free' : `₹${plan.price_monthly}`}
                  </span>
                  {plan.price_monthly > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
                  )}
                </div>
                {plan.price_yearly > 0 && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    ₹{plan.price_yearly}/year <span className="text-emerald-600 font-medium">(save ~16%)</span>
                  </p>
                )}
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to={isLoggedIn ? `/settings?tab=billing` : '/create-account'}
                className={`block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all ${
                  plan.popular
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                    : 'border border-[var(--color-border)] text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {isLoggedIn
                  ? user?.plan_key === plan.plan_key
                    ? 'Current Plan'
                    : plan.price_monthly === 0
                      ? 'Downgrade'
                      : 'Upgrade'
                  : plan.price_monthly === 0
                    ? 'Get Started Free'
                    : 'Start Free Trial'}
              </Link>
            </div>
          ))}
        </div>

        {/* Feature comparison */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-center text-gray-950 dark:text-white mb-10">
            Compare plans in detail
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Feature</th>
                  {planToShow.map(plan => (
                    <th key={plan.plan_key} className={`px-6 py-4 text-center font-semibold ${plan.popular ? 'text-brand-600' : 'text-gray-900 dark:text-white'}`}>
                      {plan.display_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {[
                  { label: 'Clients', key: 'max_clients', format: (v: number | null) => v ? `Up to ${v}` : 'Unlimited' },
                  { label: 'Projects', key: 'max_projects_per_month', format: (v: number | null) => v ? `${v}/month` : 'Unlimited' },
                  { label: 'AI Credits', key: 'ai_credits_per_month', format: (v: number) => `${v}/month` },
                  { label: 'Emails', key: 'emails_per_month', format: (v: number) => `${v}/month` },
                  { label: 'Custom Branding', key: 'has_custom_branding', format: (v: boolean) => v ? '✅' : '—' },
                  { label: 'No Footer Branding', key: 'shows_powered_by_footer', format: (v: boolean) => v ? '—' : '✅' },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{row.label}</td>
                    {planToShow.map(plan => (
                      <td key={plan.plan_key} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                        {row.format((plan as any)[row.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-center text-gray-950 dark:text-white mb-10">
            Frequently asked questions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
            {[
              { q: 'Can I switch plans anytime?', a: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately.' },
              { q: 'What happens when I hit my limit?', a: "You'll get a notification. You can upgrade your plan or purchase add-on packs." },
              { q: 'Is there a free trial?', a: 'The Free plan is always available. Paid plans come with a 7-day free trial.' },
              { q: 'Can I cancel my subscription?', a: 'Yes, cancel anytime. Your data remains accessible on the Free plan.' },
            ].map(faq => (
              <div key={faq.q} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">{faq.q}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <div className="mx-auto max-w-xl rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 px-8 py-12 shadow-xl">
            <h2 className="text-2xl font-bold text-white">Ready to grow your freelance business?</h2>
            <p className="mt-3 text-brand-100 text-sm">Join thousands of freelancers using ClientFlow.</p>
            <Link to={isLoggedIn ? '/dashboard' : '/create-account'}>
              <Button className="mt-6 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-50 transition-all">
                {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2026 ClientFlow. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}

export function Pricing() {
  return <PricingPage />
}
