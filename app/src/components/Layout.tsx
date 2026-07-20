import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Avatar, Button, SearchInput } from './ui'
import {
  Activity, Bell, BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight,
  CircleDollarSign, FileCheck2, FileText, FolderKanban, LayoutDashboard,
  LogOut, Menu, MoreHorizontal, PanelLeft, Settings, Sparkles, User,
  Users, X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
]

const pageNames: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Good morning', description: 'Here is what is happening across your client work.' },
  '/clients': { title: 'Clients', description: 'Manage your client relationships in one place.' },
  '/projects': { title: 'Projects', description: 'Track delivery, milestones, and progress.' },
  '/proposals': { title: 'Proposals', description: 'Create and share professional proposals.' },
  '/invoices': { title: 'Invoices', description: 'Keep every invoice and payment status organized.' },
  '/settings': { title: 'Settings', description: 'Manage your profile, business, and preferences.' },
}

export function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('clientflow-sidebar-collapsed') === 'true')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('clientflow-theme') || 'light')

  useEffect(() => { localStorage.setItem('clientflow-sidebar-collapsed', String(collapsed)) }, [collapsed])
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem('clientflow-theme', theme) }, [theme])
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.querySelector<HTMLInputElement>('[aria-label="Search ClientFlow"]')?.focus() } }; document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler) }, [])

  const displayName = user?.business_name || user?.username || 'Your workspace'
  const credits = user?.ai_credits_remaining ?? 0
  const creditTotal = Math.max(credits, 5)
  const creditPercent = Math.min(100, (credits / creditTotal) * 100)
  const page = pageNames[location.pathname] || { title: 'ClientFlow', description: 'Keep your freelance business moving.' }
  const filteredSearch = useMemo(() => search ? navItems.filter(item => item.name.toLowerCase().includes(search.toLowerCase())) : [], [search])

  const handleSignOut = async () => { await signOut(); navigate('/signin') }
  const toggleSidebar = () => setCollapsed(value => !value)

  return <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
    {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width,transform] duration-200 lg:translate-x-0 ${collapsed ? 'lg:w-[72px]' : ''} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className={`flex h-16 shrink-0 items-center border-b border-[var(--color-border)] ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
        <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden" aria-label="ClientFlow home">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">C</span>
          {!collapsed && <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">Client<span className="text-brand-600">Flow</span></span>}
        </NavLink>
        {!collapsed && <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>}
      </div>
      <nav className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map(item => item.disabled ? <div key={item.name} title={collapsed ? `${item.name} (Coming soon)` : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-gray-400 ${collapsed ? 'justify-center' : ''}`}><item.icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && <><span>{item.name}</span><span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span></>}</div> : <NavLink key={item.name} to={item.href} onClick={() => setSidebarOpen(false)} title={collapsed ? item.name : undefined} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'}`}><item.icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span>{item.name}</span>}</NavLink>)}
      </nav>
      <div className="border-t border-[var(--color-border)] p-3">
        <button onClick={toggleSidebar} className="hidden min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 lg:flex dark:hover:bg-gray-800" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}</button>
        {!collapsed && <button onClick={handleSignOut} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><LogOut className="h-[18px] w-[18px]" />Log out</button>}
      </div>
    </aside>

    <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}`}>
      <header className="sticky top-0 z-30 h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"><Menu className="h-5 w-5" /></button>
          <div className="relative hidden min-w-0 flex-1 sm:block"><SearchInput value={search} onChange={setSearch} placeholder="Search ClientFlow" className="max-w-md" />{search && filteredSearch.length > 0 && <div className="absolute top-12 z-50 w-full max-w-md rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">{filteredSearch.map(item => <button key={item.name} onClick={() => { navigate(item.href); setSearch('') }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><item.icon className="h-4 w-4 text-gray-400" />{item.name}</button>)}</div>}</div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className={`hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex ${credits === 0 ? 'border-red-200 bg-red-50 text-red-700' : credits <= 1 ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'}`}><Sparkles className="h-4 w-4" /><span className="text-xs font-medium">{credits} / {creditTotal} Credits</span><span className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><span className="block h-full rounded-full bg-current" style={{ width: `${creditPercent}%` }} /></span></div>
            <button onClick={() => setNotificationsOpen(value => !value)} className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Notifications"><Bell className="h-5 w-5" /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-[var(--color-surface)]" /></button>
            <div className="relative"><button onClick={() => setProfileOpen(value => !value)} className="flex min-h-11 items-center gap-2 rounded-lg px-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"><Avatar name={displayName} size="sm" /><span className="hidden max-w-28 truncate text-left text-sm font-medium text-gray-700 md:block dark:text-gray-200">{displayName}</span><ChevronDown className="hidden h-4 w-4 text-gray-400 md:block" /></button>{profileOpen && <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900"><div className="border-b border-gray-100 px-3 pb-3 dark:border-gray-800"><p className="font-medium text-gray-900 dark:text-white">{displayName}</p><p className="truncate text-xs text-gray-500">{user?.email}</p><span className="mt-2 inline-flex rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">Free plan</span></div><NavLink to="/settings" onClick={() => setProfileOpen(false)} className="mt-2 flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"><User className="h-4 w-4" />Profile & settings</NavLink><button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"><PanelLeft className="h-4 w-4" />{theme === 'dark' ? 'Light theme' : 'Dark theme'}</button><button onClick={handleSignOut} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><LogOut className="h-4 w-4" />Log out</button></div>}</div>
            {notificationsOpen && <div className="absolute right-4 top-14 z-50 w-[min(380px,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900"><div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3><button className="text-xs text-brand-600">Mark all as read</button></div><div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">You’re all caught up. New activity will appear here.</div></div>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:pb-8"><div className="mb-6 flex items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">{page.title}</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{page.description}</p></div></div><Outlet /></main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-2 backdrop-blur lg:hidden">{[{ name: 'Home', href: '/dashboard', icon: LayoutDashboard }, { name: 'Projects', href: '/projects', icon: FolderKanban }, { name: 'Clients', href: '/clients', icon: Users }, { name: 'Alerts', href: '#', icon: Bell }, { name: 'More', href: '/settings', icon: MoreHorizontal }].map(item => <NavLink key={item.name} to={item.href} className={({ isActive }) => `flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] ${isActive ? 'text-brand-600' : 'text-gray-500'}`}><item.icon className="h-5 w-5" />{item.name}</NavLink>)}</nav>
  </div>
}
