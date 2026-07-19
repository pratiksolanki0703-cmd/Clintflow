import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button, Card, CardHeader, CardContent, Badge, Skeleton, Avatar } from '../components/ui'
import { Users, FolderKanban, FileText, CreditCard, TrendingUp, Clock, AlertCircle, Plus, ArrowRight, ExternalLink } from 'lucide-react'
import { formatCurrency, formatDate, formatRelativeTime } from '../lib/utils'

export function Dashboard() {
  const { user } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: async () => {
      if (!user) return null
      
      const [clients, projects, invoices, userData] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
        supabase.from('invoices').select('id, total_amount, status').eq('user_id', user.id),
        supabase.from('users').select('ai_credits_remaining').eq('id', user.id).single(),
      ])

      const pendingInvoices = invoices.data?.filter(i => i.status === 'pending' || i.status === 'partially_paid').length || 0
      const totalRevenue = invoices.data?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0) || 0

      return {
        totalClients: clients.count || 0,
        activeProjects: projects.count || 0,
        pendingInvoices,
        totalRevenue,
        aiCreditsRemaining: userData.data?.ai_credits_remaining || 0,
      }
    },
    enabled: !!user,
  })

  const { data: recentProjects } = useQuery({
    queryKey: ['recentProjects', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, deadline, status, client:clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const { data: recentInvoices } = useQuery({
    queryKey: ['recentInvoices', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('invoices')
        .select('id, total_amount, currency, status, created_at, project:projects(name, client:clients(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  if (!user) return null

  const statsCards = [
    { title: 'Total Clients', value: stats?.totalClients || 0, icon: Users, color: 'bg-blue-500', href: '/clients' },
    { title: 'Active Projects', value: stats?.activeProjects || 0, icon: FolderKanban, color: 'bg-green-500', href: '/projects' },
    { title: 'Pending Invoices', value: stats?.pendingInvoices || 0, icon: CreditCard, color: 'bg-yellow-500', href: '/invoices' },
    { title: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: TrendingUp, color: 'bg-purple-500', href: '/invoices' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.business_name || user.username}! Here's what's happening.</p>
        </div>
        <Link to="/projects/new" className="w-full sm:w-auto">
          <Button size="lg"><Plus className="w-5 h-5 mr-2" />New Project</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Link key={stat.title} to={stat.href} className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <ArrowRight className="absolute bottom-4 right-4 w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-brand-600 hover:text-brand-500">View all</Link>
          </CardHeader>
          <CardContent>
            {recentProjects ? (
              recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No projects yet</p>
                  <Link to="/projects/new" className="mt-3 inline-block text-sm text-brand-600 hover:text-brand-500">Create your first project</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project: any) => (
                    <Link key={project.id} to={`/projects/${project.id}`} className="block p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-500">{project.client?.name}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={project.status === 'active' ? 'success' : project.status === 'completed' ? 'info' : 'default'}>
                            {project.status}
                          </Badge>
                          {project.deadline && (
                            <p className="text-xs text-gray-500 mt-1">Due {formatDate(project.deadline)}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
            <Link to="/invoices" className="text-sm text-brand-600 hover:text-brand-500">View all</Link>
          </CardHeader>
          <CardContent>
            {recentInvoices ? (
              recentInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No invoices yet</p>
                  <Link to="/invoices/new" className="mt-3 inline-block text-sm text-brand-600 hover:text-brand-500">Create your first invoice</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice: any) => (
                    <Link key={invoice.id} to={`/invoices/${invoice.id}`} className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{invoice.project?.name || 'Invoice'}</p>
                          <p className="text-sm text-gray-500">{invoice.project?.client?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(invoice.total_amount, invoice.currency)}</p>
                          <Badge 
                            variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : invoice.status === 'partially_paid' ? 'warning' : 'default'}
                            className="mt-1"
                          >
                            {invoice.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Credits */}
      {user && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">AI Credits Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.aiCreditsRemaining || 0}</p>
                </div>
              </div>
              <Link to="/settings?tab=billing" className="text-sm text-brand-600 hover:text-brand-500 font-medium">
                View Plans <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}