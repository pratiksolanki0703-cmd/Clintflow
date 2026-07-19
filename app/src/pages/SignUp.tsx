import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Lock, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, Avatar } from '../components/ui'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscore and hyphen allowed'),
  businessName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type SignUpForm = z.infer<typeof signUpSchema>

export function SignUp() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | null>(null)

  const { register, handleSubmit, formState: { errors }, watch, setError: setFormError } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  })

  const username = watch('username')

  const onSubmit = async (data: SignUpForm) => {
    setAuthLoading(true)
    setError('')
    const res = await signUp(data.email, data.password, data.username, data.businessName || undefined)
    if (res.error) {
      setError(res.error.message)
    } else {
      navigate('/dashboard')
    }
    setAuthLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    setError('')
    const res = await signInWithGoogle()
    if (res.error) setError(res.error.message)
    setAuthLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Avatar name="ClientFlow" size="xl" className="mx-auto mb-4 bg-brand-100 text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-gray-600">Start managing clients professionally</p>
        </div>

        <Card className="p-6">
          {error && <div className="mb-4 text-red-600 text-sm text-center" role="alert">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Input
                label="Business Name (optional)"
                placeholder="Your brand name"
                icon={<User className="w-5 h-5" />}
                {...register('businessName')}
              />
            </div>

            <div>
              <Input
                label="Username"
                placeholder="yourname"
                icon={<User className="w-5 h-5" />}
                {...register('username')}
                error={errors.username?.message}
                onBlur={() => {
                  if (username && username.length >= 3 && !errors.username) {
                    setUsernameStatus('checking')
                    // TODO: check username availability via API
                    setTimeout(() => setUsernameStatus('available'), 500)
                  }
                }}
              />
              {usernameStatus === 'checking' && <p className="mt-1 text-sm text-gray-500">Checking availability...</p>}
              {usernameStatus === 'available' && <p className="mt-1 text-sm text-green-600">✓ Username available</p>}
              {usernameStatus === 'taken' && <p className="mt-1 text-sm text-red-600">Username taken</p>}
            </div>

            <div>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-5 h-5" />}
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                {...register('password')}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />
            </div>

            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-brand-600 hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>
            </p>

            <Button type="submit" className="w-full" size="lg" loading={authLoading}>
              Create Account
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={authLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="text-brand-600 hover:text-brand-500 font-medium">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}