import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button, Input, Card } from '../components/ui'
import { useUsernameCheck } from '../hooks/useQueries'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react'

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirmPassword: z.string(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscores and hyphens allowed'),
  businessName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type SignUpForm = z.infer<typeof signUpSchema>

// Simple password strength indicator
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.pass).length

  const barColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? barColors[score - 1] : 'bg-gray-200 dark:bg-gray-700'
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
            {check.pass ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {check.label}
          </span>
        ))}
      </div>
      {password.length >= 8 && (
        <p className={`text-xs font-medium ${score >= 3 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
          Password strength: {labels[score - 1] || 'Weak'}
        </p>
      )}
    </div>
  )
}

export function CreateAccount() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle, signOut, sendSignupOtp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [usernameDebounce, setUsernameDebounce] = useState('')

  const { register, handleSubmit, formState: { errors }, watch, setError: setFormError } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
  })

  const username = watch('username')
  const password = watch('password')

  // Debounced username for real-time check
  useEffect(() => {
    if (username && username.length >= 3 && !errors.username) {
      const timer = setTimeout(() => {
        setUsernameDebounce(username)
      }, 400)
      return () => clearTimeout(timer)
    } else {
      setUsernameDebounce('')
    }
  }, [username, errors.username])

  const { data: usernameCheck, isLoading: checkingUsername } = useUsernameCheck(usernameDebounce)

  const onSubmit = async (data: SignUpForm) => {
    setAuthLoading(true)
    setError('')

    // Final username check before submission
    if (usernameCheck && !usernameCheck.available) {
      setError(usernameCheck.message)
      setAuthLoading(false)
      return
    }

    const res = await signUp(data.email, data.password, data.username, data.businessName || undefined)
    if (res.error) {
      setError(res.error.message)
      setAuthLoading(false)
      return
    }

    // Store pending user info for after OTP verification
    const signupUserId = res.user?.id
    if (signupUserId) {
      sessionStorage.setItem('cf_pending_id', signupUserId)
      sessionStorage.setItem('cf_pending_email', data.email)
      sessionStorage.setItem('cf_pending_username', data.username)
      if (data.businessName) {
        sessionStorage.setItem('cf_pending_biz', data.businessName)
      }
    }

    // Sign out, then delete the temp users row so username is free until OTP verify
    await signOut()
    if (signupUserId) {
      await supabase.from('users').delete().eq('id', signupUserId)
    }
    
    // Send OTP and redirect to verification
    await sendSignupOtp(data.email)
    navigate(`/verify-email?email=${encodeURIComponent(data.email)}`)
    setAuthLoading(false)
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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0ZjQ2ZTUiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        {/* Brand side */}
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
              Start free, upgrade when you grow
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Everything you need to<br />
              <span className="text-brand-200">run your freelance business</span>
            </h1>
            <p className="max-w-md text-lg text-brand-100/80">
              From first proposal to final payment — manage every client interaction in one place.
            </p>
            <div className="space-y-3 pt-2">
              {[
                'Professional proposals with shareable links',
                'Digital contracts with e-signature',
                'Milestone tracking for project delivery',
                'Invoice management with payment tracking',
                'AI-powered writing assistance',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-brand-100">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-300" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-brand-200/60">
            &copy; {new Date().getFullYear()} ClientFlow. All rights reserved.
          </p>
        </div>

        {/* Form side */}
        <div className="flex w-full items-start justify-center overflow-y-auto px-4 py-8 sm:px-6 lg:w-1/2 lg:px-12">
          <div className="w-full max-w-sm space-y-6">
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
                Create your account
              </h2>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                Free plan includes 5 AI credits, 3 clients, and 5 projects/month
              </p>
            </div>

            <Card className="overflow-hidden border-0 shadow-xl dark:border dark:border-gray-800">
              <div className="p-6 sm:p-8">
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
                    <div className="flex items-start gap-2">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Business Name */}
                  <Input
                    label="Business Name (optional)"
                    placeholder="Your brand or studio name"
                    icon={<User className="h-5 w-5 text-gray-400" />}
                    {...register('businessName')}
                  />

                  {/* Username */}
                  <div>
                    <Input
                      label="Username"
                      placeholder="yourname"
                      icon={<User className="h-5 w-5 text-gray-400" />}
                      {...register('username')}
                      error={errors.username?.message}
                    />
                    {username && username.length >= 3 && !errors.username && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {checkingUsername ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                        ) : usernameCheck?.available ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs text-green-600 dark:text-green-400">
                              {usernameCheck.message}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {usernameCheck?.message || 'Username is taken'}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      This will be part of your client portal URL and cannot be changed later.
                    </p>
                  </div>

                  {/* Email */}
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    icon={<Mail className="h-5 w-5 text-gray-400" />}
                    {...register('email')}
                    error={errors.email?.message}
                  />

                  {/* Password */}
                  <div>
                    <div className="relative">
                      <Input
                        label="Password"
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

                  {/* Confirm Password */}
                  <Input
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    icon={<Lock className="h-5 w-5 text-gray-400" />}
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                  />

                  {/* Terms */}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By creating an account, you agree to our{' '}
                    <a href="#" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                      Privacy Policy
                    </a>
                  </p>

                  <Button type="submit" className="w-full" size="lg" loading={authLoading}>
                    Create Account
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-3 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

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

                <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400">
                    Sign in
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
