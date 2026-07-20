import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button, Card, Skeleton } from '../components/ui'
import { 
  Users, FolderKanban, FileText, CreditCard, TrendingUp, 
  Plus, Sparkles, ChevronRight,
  ArrowUpRight, ArrowDownRight, CircleDollarSign,
  CalendarDays
} from 'lucide-react'
import { formatCurrency, formatDate, formatRelativeTime } from '../lib/utils'

// ─── Types ───────────────────────────────────────────

interface DashboardStats {
  totalClients: number
  activeProjects: number
  pendingInvoices: number
  totalRevenue: number
  aiCreditsRemaining: number
  monthlyRevenue: number
  overdueInvoices: number
}

interface RecentProject {
  id: string
  name: string
  deadline: string | null
  status: string
  client: { name: string } | null
}

interface RecentInvoice {
  id: string
  total_amount: number
  currency: string
  status: string
  created_at: string
  paid_at: string | null
  project: { name: string; client: { name: string } | null } | null
}

// ─── Stat Card ───────────────────────────────────────

const GRADIENT_MAP: Record<string, string> = {
  clients: 'from-blue-600 to-blue-400',
  projects: 'from-emerald-600 to-emerald-400',
  invoices: 'from-amber-500 to-orange-400',
  revenue: 'from-violet-600 to-purple-400',
}

// Map gradient color names → icon text color class
function iconColorForGradient(gradient: string): string {
  if (gradient.includes('blue')) return 'text-blue-50/90'
  if (gradient.includes('emerald')) return 'text-emerald-50/90'
  if (gradient.includes('amber')) return 'text-amber-50/90'
  if (gradient.includes('violet')) return 'text-violet-50/90'
  return 'text-white/90'
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel, 
  gradient, 
  href,
  index 
}: { 
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down'
  trendLabel?: string
  gradient: string
  href: string
  index: number
}) {
  return (
    <Link
      to={href}
      className="group relative block overflow-hidden rounded-2xl border border-gray-200/50 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-6 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Gradient accent bar */}
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {value}
          </p>
          {trend && trendLabel && (
            <div className="flex items-center gap-1 text-xs">
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                {trendLabel}
              </span>
            </div>
          )}
        </div>

        <div          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12`}>
          <Icon className={`h-5 w-5 ${iconColorForGradient(gradient)} sm:h-6 sm:w-6`} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-brand-400">
        View details <ChevronRight className="h-3 w-3" />
      </div>
    </Link>
  )
}

// ─── Skeleton Variants ───────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200/50 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  )
}

function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-3 w-12 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Section Wrapper ─────────────────────────────────

function SectionCard({ 
  title, 
  href, 
  icon: Icon, 
  children,
  empty,
  loading 
}: { 
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  empty?: React.ReactNode
  loading?: boolean
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-800">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <Link
          to={href}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="p-5">
        {loading ? <ListSkeleton /> : empty ? empty : children}
      </div>
    </Card>
  )
}

// ─── Empty State ─────────────────────────────────────

function EmptyBlock({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: { label: string; to: string }
}) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
        <Icon className="h-7 w-7 text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      {action && (
        <Link
          to={action.to}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-brand-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {action.label}
        </Link>
      )}
    </div>
  )
}

// ─── Welcome Header ──────────────────────────────────

function WelcomeHeader({ userName }: { userName: string }) {
  const hour = new Date().getHours()
  let greeting = 'Good evening'
  if (hour < 12) greeting = 'Good morning'
  else if (hour < 17) greeting = 'Good afternoon'

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 px-6 py-8 sm:px-8 sm:py-10">
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-6 right-20 h-28 w-28 rounded-full bg-white/5" />
      <div className="absolute left-1/2 top-0 h-px w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-brand-100/80">{greeting} 👋</p>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {userName}
            </h1>
            <p className="max-w-lg text-sm text-brand-100/70">
              Here is what is happening across your client work today.
            </p>
          </div>
          <Link to="/projects/new">
            <Button className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/25 hover:shadow-xl">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Status Badge ────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    completed: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
    cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    sent: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    declined: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    partially_paid: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300',
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    overdue: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

// ─── AI Credits Section ──────────────────────────────

function AiCreditsCard({ credits }: { credits: number }) {
  const maxCredits = Math.max(credits, 5)
  const percent = Math.min(100, (credits / maxCredits) * 100)
  const isLow = credits <= 2

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm ring-1 ring-purple-100/50 dark:from-purple-950/30 dark:to-indigo-950/30 dark:ring-purple-900/50">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">AI Credits</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {credits} credit{credits !== 1 ? 's' : ''} remaining this month
              </p>
            </div>
          </div>
          <Link
            to="/settings?tab=billing"
            className="flex items-center gap-1 text-xs font-medium text-purple-600 transition-colors hover:text-purple-500 dark:text-purple-400"
          >
            Upgrade <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-white/50 dark:bg-gray-800/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isLow
                  ? 'bg-gradient-to-r from-red-400 to-orange-400'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{credits} used</span>
            <span>{maxCredits} limit</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── Main Dashboard Component ────────────────────────

export function Dashboard() {
  const { user } = useAuth()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: async (): Promise<DashboardStats | null> => {
      if (!user) return null

      const [clients, projects, invoices, userData] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
        supabase.from('invoices').select('id, total_amount, status').eq('user_id', user.id),
        supabase.from('users').select('ai_credits_remaining').eq('id', user.id).single(),
      ])

      const pendingInvoices = invoices.data?.filter(i => i.status === 'pending' || i.status === 'partially_paid').length || 0
      const paidInvoices = invoices.data?.filter(i => i.status === 'paid') || []
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total_amount, 0) || 0
      const overdueInvoices = invoices.data?.filter(i => i.status === 'overdue').length || 0

      return {
        totalClients: clients.count || 0,
        activeProjects: projects.count || 0,
        pendingInvoices,
        totalRevenue,
        aiCreditsRemaining: userData.data?.ai_credits_remaining || 0,
        monthlyRevenue: totalRevenue,
        overdueInvoices,
      }
    },
    enabled: !!user,
  })

  const { data: recentProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['recentProjects', user?.id],
    queryFn: async (): Promise<RecentProject[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, deadline, status, client:clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['recentInvoices', user?.id],
    queryFn: async (): Promise<RecentInvoice[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('invoices')
        .select('id, total_amount, currency, status, created_at, paid_at, project:projects(name, client:clients(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  if (!user) return null

  const displayName = user.business_name || user.username || 'there'

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Header */}
      <WelcomeHeader userName={displayName} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Clients"
              value={stats?.totalClients ?? 0}
              icon={Users}
              href="/clients"
              gradient={GRADIENT_MAP.clients}
              index={0}
            />
            <StatCard
              title="Active Projects"
              value={stats?.activeProjects ?? 0}
              icon={FolderKanban}
              href="/projects"
              gradient={GRADIENT_MAP.projects}
              index={1}
            />
            <StatCard
              title="Pending Invoices"
              value={stats?.pendingInvoices ?? 0}
              icon={CreditCard}
              trend={stats && stats.overdueInvoices > 0 ? 'down' : undefined}
              trendLabel={stats && stats.overdueInvoices > 0 ? `${stats.overdueInvoices} overdue` : undefined}
              href="/invoices"
              gradient={GRADIENT_MAP.invoices}
              index={2}
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue ?? 0)}
              icon={TrendingUp}
              href="/invoices"
              gradient={GRADIENT_MAP.revenue}
              index={3}
            />
          </>
        )}
      </div>

      {/* AI Credits */}
      {statsLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : (
        <AiCreditsCard credits={stats?.aiCreditsRemaining ?? 0} />
      )}

      {/* Two-Column Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <SectionCard
          title="Recent Projects"
          href="/projects"
          icon={FolderKanban}
          loading={projectsLoading}
          empty={
            <EmptyBlock
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project to track delivery and milestones."
              action={{ label: 'New project', to: '/projects/new' }}
            />
          }
        >
          <div className="space-y-2">
            {recentProjects?.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                    {project.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {project.client?.name ?? 'No client'}
                    {project.deadline && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(project.deadline)}
                      </span>
                    )}
                  </p>
                </div>
                <StatusPill status={project.status} />
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Recent Invoices */}
        <SectionCard
          title="Recent Invoices"
          href="/invoices"
          icon={CircleDollarSign}
          loading={invoicesLoading}
          empty={
            <EmptyBlock
              icon={CircleDollarSign}
              title="No invoices yet"
              description="Create your first invoice to start tracking payments."
              action={{ label: 'New invoice', to: '/invoices/new' }}
            />
          }
        >
          <div className="space-y-2">
            {recentInvoices?.slice(0, 4).map((invoice) => (
              <Link
                key={invoice.id}
                to={`/invoices/${invoice.id}`}
                className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                    {invoice.project?.name ?? 'Invoice'}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {invoice.project?.client?.name ?? 'Unknown client'}
                    <span className="ml-2">
                      {invoice.paid_at ? `Paid ${formatRelativeTime(invoice.paid_at)}` : `Created ${formatRelativeTime(invoice.created_at)}`}
                    </span>
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(invoice.total_amount, invoice.currency)}
                  </p>
                  <StatusPill status={invoice.status} />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions (Mobile bottom) */}
      <div className="rounded-2xl border border-gray-200/50 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:hidden">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Plus, label: 'New Project', to: '/projects/new' },
            { icon: Plus, label: 'Add Client', to: '/clients' },
            { icon: FileText, label: 'Create Proposal', to: '/proposals' },
            { icon: CreditCard, label: 'New Invoice', to: '/invoices' },
          ].map(({ icon: Icon, label, to }) => (
            <Link
              key={label}
              to={to}
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Icon className="h-4 w-4 text-brand-600" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
