import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card } from '../components/ui'
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInForm = z.infer<typeof signInSchema>

export function Login() {
  const { signIn, signInWithGoogle, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  })

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const onSubmit = async (data: SignInForm) => {
    setError('')
    const res = await signIn(data.email, data.password)
    if (res.error) {
      setError(res.error.message)
    } else {
      navigate('/dashboard')
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setIsGoogleLoading(true)
    const res = await signInWithGoogle()
    if (res.error) {
      setError(res.error.message)
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0ZjQ2ZTUiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        {/* Brand side - visible on larger screens */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-12 text-white">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 text-xl font-bold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur text-lg font-bold">
                C
              </span>
              ClientFlow
            </Link>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              Secure platform for freelancers
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Manage your clients<br />
              <span className="text-brand-200">professionally</span>
            </h1>
            <p className="max-w-md text-lg text-brand-100/80">
              Proposals, contracts, milestones, invoices, and payment tracking — all from one secure portal.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              {['Proposals', 'Contracts', 'Milestones', 'Invoices'].map((feature) => (
                <span key={feature} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm backdrop-blur">
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm text-brand-200/60">
            &copy; {new Date().getFullYear()} ClientFlow. All rights reserved.
          </p>
        </div>

        {/* Form side */}
        <div className="flex w-full items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile logo */}
            <div className="text-center lg:hidden">
              <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-brand-600">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white text-sm font-bold">
                  C
                </span>
                ClientFlow
              </Link>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                Sign in to your account to continue
              </p>
            </div>

            <Card className="overflow-hidden border-0 shadow-xl dark:border dark:border-gray-800">
              <div className="p-6 sm:p-8">
                {/* Error display */}
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
                    <Input
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      icon={<Mail className="h-5 w-5 text-gray-400" />}
                      {...register('email')}
                      error={errors.email?.message}
                    />
                  </div>

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="current-password"
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

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    loading={authLoading}
                  >
                    Sign In
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-3 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google button */}
                <Button
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading || isGoogleLoading}
                  loading={isGoogleLoading}
                >
                  {!isGoogleLoading && (
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Google
                </Button>

                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link to="/create-account" className="font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400">
                    Create account
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
