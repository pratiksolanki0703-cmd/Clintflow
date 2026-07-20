import React, { Suspense, lazy, Component, type ReactNode } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { Skeleton } from './components/ui'

// Auth pages
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const CreateAccount = lazy(() => import('./pages/CreateAccount').then(m => ({ default: m.CreateAccount })))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })))
const VerifyOtp = lazy(() => import('./pages/VerifyOtp').then(m => ({ default: m.VerifyOtp })))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail').then(m => ({ default: m.VerifyEmail })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })))
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(m => ({ default: m.AuthCallback })))

// App pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Clients = lazy(() => import('./pages/Clients').then(m => ({ default: m.Clients })))
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })))
const Proposals = lazy(() => import('./pages/Proposals').then(m => ({ default: m.Proposals })))
const Invoices = lazy(() => import('./pages/Invoices').then(m => ({ default: m.Invoices })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const ClientPortal = lazy(() => import('./pages/ClientPortal').then(m => ({ default: m.ClientPortal })))
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageSkeleton />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageSkeleton />
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-900">
      <div className="space-y-4 w-64">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
    </div>
  )
}

// Error boundary to catch rendering crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Something went wrong</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function PageFallback() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
      {/* ═══ Auth routes (public) ═══ */}
      <Route element={<PublicRoute><Login /></PublicRoute>} path="/login" />
      <Route element={<PublicRoute><CreateAccount /></PublicRoute>} path="/create-account" />
      <Route element={<PublicRoute><ForgotPassword /></PublicRoute>} path="/forgot-password" />
      <Route element={<VerifyOtp />} path="/verify-otp" />
      <Route element={<VerifyEmail />} path="/verify-email" />
      <Route element={<ResetPassword />} path="/reset-password" />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* ═══ Old auth routes — redirect to new ones ═══ */}
      <Route path="/signin" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Navigate to="/create-account" replace />} />

      {/* ═══ Public pages ═══ */}
      <Route path="/pricing" element={<Pricing />} />

      {/* ═══ Client portal (public, no auth) ═══ */}
      <Route path="/:username/:share_token" element={<ClientPortal />} />

      {/* ═══ Protected app routes ═══ */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<Clients />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<Projects />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/proposals/:id" element={<Proposals />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/:id" element={<Invoices />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* ═══ Fallback ═══ */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" toastOptions={{ className: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700' }} />
    </AuthProvider>
  )
}