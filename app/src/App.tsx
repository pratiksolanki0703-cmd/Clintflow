import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { Skeleton } from './components/ui'

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Clients = lazy(() => import('./pages/Clients').then(m => ({ default: m.Clients })))
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })))
const Proposals = lazy(() => import('./pages/Proposals').then(m => ({ default: m.Proposals })))
const Invoices = lazy(() => import('./pages/Invoices').then(m => ({ default: m.Invoices })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const ClientPortal = lazy(() => import('./pages/ClientPortal').then(m => ({ default: m.ClientPortal })))
const SignUp = lazy(() => import('./pages/SignUp').then(m => ({ default: m.SignUp })))
const SignIn = lazy(() => import('./pages/SignIn').then(m => ({ default: m.SignIn })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })))
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(m => ({ default: m.AuthCallback })))

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageSkeleton />
  if (!user) return <Navigate to="/signin" replace />
  return <Outlet />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageSkeleton />
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="space-y-4 w-64">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        element={
          <PublicRoute>
            <SignIn />
          </PublicRoute>
        }
        path="/signin"
      />
      <Route
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        }
        path="/signup"
      />
      <Route
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
        path="/reset-password"
      />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/:username/:share_token" element={<ClientPortal />} />

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

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" toastOptions={{ className: 'bg-white border border-gray-200' }} />
    </AuthProvider>
  )
}