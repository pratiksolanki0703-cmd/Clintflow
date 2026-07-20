import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, CheckCircle2, Loader2, ShieldCheck, KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card } from '../components/ui'

const resetSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ResetForm = z.infer<typeof resetSchema>

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.pass).length

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map(check => (
          <span
            key={check.label}
            className={`flex items-center gap-1 text-xs ${
              check.pass ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
            }`}
          >
            {check.pass ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-gray-300" />}
            {check.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const { updatePassword, user, session } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if user is authenticated (from OTP verification)
  useEffect(() => {
    if (!session && !user) {
      navigate('/forgot-password', { replace: true })
    }
  }, [session, user, navigate])

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
  })

  const password = watch('password')

  const onSubmit = async (data: ResetForm) => {
    setLoading(true)
    setError('')

    const res = await updatePassword(data.password)
    if (res.error) {
      setError(res.error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Auto-redirect to login after 3 seconds
    setTimeout(() => navigate('/login', { replace: true }), 3000)
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950" />
        <Card className="relative z-10 mx-4 w-full max-w-md overflow-hidden border-0 p-8 text-center shadow-xl dark:border dark:border-gray-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Password Updated!
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Your password has been successfully reset. Redirecting you to sign in...
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-brand-700"
            >
              Sign in now
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950" />

      <div className="relative z-10 w-full max-w-md px-4 py-12">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-brand-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white text-sm font-bold">
              C
            </span>
            ClientFlow
          </Link>
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/50">
            <KeyRound className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Set new password
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Your identity has been verified. Create a new strong password for your account.
          </p>
        </div>

        <Card className="overflow-hidden border-0 shadow-xl dark:border dark:border-gray-800">
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    icon={<Lock className="h-5 w-5 text-gray-400" />}
                    {...register('password')}
                    error={errors.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password || ''} />
              </div>

              <Input
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                icon={<Lock className="h-5 w-5 text-gray-400" />}
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Update Password
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                Back to sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
