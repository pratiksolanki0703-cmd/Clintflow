import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Avatar, SearchInput } from './ui'
import {
  Activity, Bell, BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight,
  CircleDollarSign, FileCheck2, FileText, FolderKanban, LayoutDashboard,
  LogOut, Menu, PanelLeft, Settings, Sparkles, User,
  Users, X, Home, Plus, Search, ArrowLeft, ExternalLink, CreditCard,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../lib/utils'

// ─── Navigation Items ─────────────────────────────────

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Proposals', href: '/proposals', icon: FileText },
  { name: 'Contracts', href: '/contracts', icon: FileCheck2, disabled: true },
  { name: 'Invoices', href: '/invoices', icon: CircleDollarSign },
  { name: 'Payments', href: '/payments', icon: BriefcaseBusiness, disabled: true },
  { name: 'Analytics', href: '/analytics', icon: Activity, disabled: true },
  { name: 'AI Tools', href: '/ai-tools', icon: Sparkles, disabled: true },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
]

const PAGE_INFO: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Dashboard', description: 'Here is what is happening across your client work.' },
  '/clients': { title: 'Clients', description: 'Manage your client relationships in one place.' },
  '/projects': { title: 'Projects', description: 'Track delivery, milestones, and progress.' },
  '/proposals': { title: 'Proposals', description: 'Create and share professional proposals.' },
  '/invoices': { title: 'Invoices', description: 'Keep every invoice and payment status organized.' },
  '/settings': { title: 'Settings', description: 'Manage your profile, business, and preferences.' },
  '/pricing': { title: 'Pricing', description: 'Compare plans and upgrade.' },
}

// ─── Bottom Nav Items (mobile) ────────────────────────

const bottomNav = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Search', href: '#search', icon: Search },
  { name: 'New', href: '#new', icon: Plus },
  { name: 'Alerts', href: '#alerts', icon: Bell },
  { name: 'Profile', href: '/settings', icon: User },
]

// ─── Notification data (placeholder) ──────────────────

const NOTIFICATIONS = [
  { id: '1', title: 'Welcome to ClientFlow!', description: 'Get started by adding your first client.', time: 'Just now', read: false },
]

// ─── Layout ───────────────────────────────────────────

export function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('cf-sidebar-collapsed') === 'true')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('cf-theme') || 'light')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifPageOpen, setNotifPageOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Persist sidebar + theme
  useEffect(() => { localStorage.setItem('cf-sidebar-collapsed', String(collapsed)) }, [collapsed])
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem('cf-theme', theme) }, [theme])

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('[aria-label="Search ClientFlow"]')?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile panels on route change
  useEffect(() => {
    setMobileSearchOpen(false)
    setMobileMenuOpen(false)
    setNotifPageOpen(false)
  }, [location.pathname])

  const displayName = user?.business_name || user?.username || 'Your workspace'
  const credits = user?.ai_credits_remaining ?? 0
  const creditTotal = Math.max(credits, 5)
  const creditPercent = Math.min(100, (credits / creditTotal) * 100)
  const page = PAGE_INFO[location.pathname] || { title: 'ClientFlow', description: '' }
  const filteredSearch = useMemo(() => search ? navItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : [], [search])
  const isSubPage = location.pathname.split('/').filter(Boolean).length > 1

  // Quick actions for mobile bottom sheet
  const quickActions = [
    { icon: Plus, label: 'New Project', to: '/projects/new', desc: 'Create a project' },
    { icon: User, label: 'Add Client', to: '/clients', desc: 'Add a new client' },
    { icon: FileText, label: 'Create Proposal', to: '/proposals', desc: 'Send a proposal' },
    { icon: CircleDollarSign, label: 'New Invoice', to: '/invoices', desc: 'Create an invoice' },
  ]

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const toggleSidebar = () => setCollapsed(v => !v)

  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* ── Mobile sidebar backdrop ── */}
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 animate-fade-in lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Bottom Sheet (quick actions) ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-full rounded-t-2xl bg-white p-5 pb-8 shadow-xl dark:bg-gray-900 animate-slide-up">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ icon: Icon, label, to, desc }) => (
                <NavLink
                  key={label}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <Icon className="h-6 w-6 text-brand-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                  <span className="text-[10px] text-gray-500">{desc}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Notification Full Page ── */}
      {notifPageOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 animate-fade-in lg:hidden">
          <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
            <button onClick={() => setNotifPageOpen(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <div className="p-4">
            {NOTIFICATIONS.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Bell className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">No notifications</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">New activity will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {NOTIFICATIONS.map(notif => (
                  <div key={notif.id} className={`rounded-xl p-4 ${notif.read ? '' : 'bg-brand-50/50 dark:bg-brand-950/20'}`}>
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                      {!notif.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{notif.description}</p>
                    <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">{notif.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-300 lg:translate-x-0',
        collapsed ? 'lg:w-[72px]' : 'w-[260px] lg:w-[260px]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className={cn('flex h-16 shrink-0 items-center border-b border-[var(--color-border)]', collapsed ? 'justify-center px-3' : 'justify-between px-5')}>
          <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden" aria-label="ClientFlow home">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">C</span>
            {!collapsed && <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">Client<span className="text-brand-600">Flow</span></span>}
          </NavLink>
          {!collapsed && (
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map(item =>
            item.disabled ? (
              <div key={item.name} title={collapsed ? `${item.name} (Coming soon)` : undefined} className={cn('flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-gray-400', collapsed && 'justify-center')}>
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <><span>{item.name}</span><span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span></>}
              </div>
            ) : (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.name : undefined}
                className={({ isActive }) => cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            )
          )}
        </nav>

        {/* Sidebar bottom */}
        <div className="border-t border-[var(--color-border)] p-3">
          <button
            onClick={toggleSidebar}
            className="hidden min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 lg:flex dark:hover:bg-gray-800"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}
          </button>
          {!collapsed && (
            <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5">
              <Avatar name={displayName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className={cn('transition-[padding] duration-300', collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]')}>
        {/* ── Header ── */}
        <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
            >
              <Menu className="h-5 w-5" />
            </button>

            {isSubPage && (
              <button
                onClick={() => navigate(-1)}
                className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 sm:block dark:hover:bg-gray-800"
                title="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {isSubPage && (
                  <button onClick={() => navigate(-1)} className="sm:hidden">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                  </button>
                )}
                <h1 className="truncate text-lg font-semibold tracking-tight text-gray-950 dark:text-white">
                  {page.title}
                </h1>
              </div>
              {page.description && (
                <p className="hidden truncate text-xs text-gray-500 sm:block dark:text-gray-400">
                  {page.description}
                </p>
              )}
            </div>

            {/* Search (desktop) */}
            <div className="relative hidden min-w-0 sm:block sm:w-64 lg:w-80">
              <SearchInput value={search} onChange={setSearch} placeholder="Search (Ctrl+K)" className="w-full" />
              {search && filteredSearch.length > 0 && (
                <div className="absolute left-0 right-0 top-12 z-50 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                  {filteredSearch.map(item => (
                    <button
                      key={item.name}
                      onClick={() => { navigate(item.href); setSearch('') }}
                      className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-gray-400" />
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* AI Credits badge */}
              <div className={cn(
                'hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex',
                credits === 0 ? 'border-red-200 bg-red-50 text-red-700' :
                credits <= 1 ? 'border-orange-200 bg-orange-50 text-orange-700' :
                'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
              )}>
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-medium">{credits}/{creditTotal}</span>
              </div>

              {/* Notifications (desktop dropdown) */}
              <div className="relative hidden sm:block" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(v => !v)}
                  className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[var(--color-surface)]">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button className="text-xs font-medium text-brand-600 hover:text-brand-500">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {NOTIFICATIONS.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center px-4">
                          <Bell className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {NOTIFICATIONS.map(notif => (
                            <div key={notif.id} className={`px-4 py-3 ${notif.read ? '' : 'bg-brand-50/30 dark:bg-brand-950/10'}`}>
                              <div className="flex items-start justify-between">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                                {!notif.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                              </div>
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{notif.description}</p>
                              <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{notif.time}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile (desktop dropdown) */}
              <div className="relative hidden sm:block" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  className="flex min-h-10 items-center gap-2 rounded-lg px-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Avatar name={displayName} size="sm" />
                  <span className="hidden max-w-24 truncate text-sm font-medium text-gray-700 md:block dark:text-gray-200">
                    {displayName}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-gray-400 md:block" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    <div className="border-b border-gray-100 px-3 pb-3 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <Avatar name={displayName} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900 dark:text-white">{displayName}</p>
                          <p className="truncate text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{credits} credits</span>
                        </div>
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                          Free
                        </span>
                      </div>
                    </div>
                    <NavLink
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="mt-2 flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <User className="h-4 w-4" /> Profile & settings
                    </NavLink>
                    <NavLink
                      to="/pricing"
                      onClick={() => setProfileOpen(false)}
                      className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <CreditCard className="h-4 w-4" /> Pricing & plans
                    </NavLink>
                    <button
                      onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setProfileOpen(false) }}
                      className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <PanelLeft className="h-4 w-4" /> {theme === 'dark' ? '☀️ Light' : '🌙 Dark'} theme
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile header actions (notifications bell + avatar) */}
              <button
                onClick={() => setNotifPageOpen(true)}
                className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 sm:hidden dark:hover:bg-gray-800"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--color-surface)]" />
                )}
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="rounded-lg p-1 sm:hidden"
              >
                <Avatar name={displayName} size="sm" className="h-7 w-7 text-[9px]" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-5 sm:px-6 lg:pb-8 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-lg lg:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {bottomNav.map(item => {
            if (item.href === '#search') {
              return (
                <button
                  key={item.name}
                  onClick={() => setMobileSearchOpen(true)}
                  className="flex h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] text-gray-500"
                >
                  <Search className="h-5 w-5" />
                  {item.name}
                </button>
              )
            }
            if (item.href === '#new') {
              return (
                <button
                  key={item.name}
                  onClick={() => setMobileMenuOpen(true)}
                  className="relative -mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )
            }
            if (item.href === '#alerts') {
              return (
                <button
                  key={item.name}
                  onClick={() => setNotifPageOpen(true)}
                  className="relative flex h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] text-gray-500"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2.5 top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--color-surface)]" />
                  )}
                  {item.name}
                </button>
              )
            }
            // Profile & other items use NavLink
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => {
                  // Close any open panels
                  setNotificationsOpen(false)
                  setProfileOpen(false)
                }}
                className={({ isActive }) =>
                  `flex h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] ${
                    isActive ? 'text-brand-600' : 'text-gray-500'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
