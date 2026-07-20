import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card } from '../components/ui'
import { Mail, ArrowLeft, Send, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type EmailForm = z.infer<typeof emailSchema>

export function ForgotPassword() {
  const { sendOtp, checkEmailExists } = useAuth()
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [coolDown, setCoolDown] = useState(0)
  const [sentEmail, setSentEmail] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  })

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (coolDown <= 0) return
    const timer = setInterval(() => {
      setCoolDown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [coolDown])

  const onSubmit = async (data: EmailForm) => {
    setError('')
    setLoading(true)

    // First check if email exists in our system
    const { exists, error: checkError } = await checkEmailExists(data.email)
    if (checkError) {
      setError(checkError.message)
      setLoading(false)
      return
    }

    if (!exists) {
      setError('No account found with this email address.')
      setLoading(false)
      return
    }

    // Send OTP
    const { error: otpError, coolDown: cd } = await sendOtp(data.email)
    if (otpError) {
      setError(otpError.message)
      setLoading(false)
      return
    }

    setSentEmail(data.email)
    setCoolDown(cd)
    setStep('sent')
    setLoading(false)
  }

  const handleResend = async () => {
    setError('')
    setLoading(true)

    const { error: otpError, coolDown: cd } = await sendOtp(sentEmail)
    if (otpError) {
      setError(otpError.message)
      setLoading(false)
      return
    }

    setCoolDown(cd)
    setLoading(false)
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

        {step === 'email' ? (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/50">
                <Mail className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Forgot password?
              </h2>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                Enter your email and we'll send you a one-time code to reset your password.
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
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    icon={<Mail className="h-5 w-5 text-gray-400" />}
                    {...register('email')}
                    error={errors.email?.message}
                  />

                  <Button type="submit" className="w-full" size="lg" loading={loading}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Reset Code
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Remember your password?{' '}
                  <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400">
                    Sign in
                  </Link>
                </p>
              </div>
            </Card>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/50">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Check your email
              </h2>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                We've sent a 6-digit verification code to{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{sentEmail}</span>
              </p>
            </div>

            <Card className="overflow-hidden border-0 shadow-xl dark:border dark:border-gray-800">
              <div className="p-6 sm:p-8 text-center">
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Enter the code on the next screen to continue.
                  </p>

                  <Link
                    to={`/verify-otp?email=${encodeURIComponent(sentEmail)}`}
                    className="btn inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    Enter Verification Code
                  </Link>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={coolDown > 0 || loading}
                      className="text-sm text-brand-600 transition-colors hover:text-brand-500 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Sending...
                        </span>
                      ) : coolDown > 0 ? (
                        `Resend code in ${coolDown}s`
                      ) : (
                        'Resend code'
                      )}
                    </button>
                  </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-500">
                  <Link to="/login" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </Link>
                </p>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
