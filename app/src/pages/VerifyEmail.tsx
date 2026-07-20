import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button, Card } from '../components/ui'
import { MailCheck } from 'lucide-react'

export function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const { verifyOtp, sendSignupOtp, refreshUser } = useAuth()

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [coolDown, setCoolDown] = useState(60)
  const [success, setSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Redirect if no email
  useEffect(() => {
    if (!email) navigate('/create-account', { replace: true })
  }, [email, navigate])

  // Countdown timer
  useEffect(() => {
    if (coolDown <= 0) return
    const timer = setInterval(() => {
      setCoolDown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [coolDown])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') {
      handleVerify()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i]
    setOtp(newOtp)
    const nextEmpty = newOtp.findIndex(c => !c)
    inputRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }

    setError('')
    setLoading(true)

    const { error: verifyError } = await verifyOtp(email, code)
    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
      return
    }

    // ── Resolve user info ────────────────────────────────────
    // Priority: sessionStorage (fresh signup) → auth user metadata (tab closed fallback)
    let userId = sessionStorage.getItem('cf_pending_id')
    let userName = sessionStorage.getItem('cf_pending_username')
    let bizName = sessionStorage.getItem('cf_pending_biz')

    if (!userId || !userName) {
      // Tab was closed after signup — recover from auth metadata
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        userId = authUser.id
        userName = authUser.user_metadata?.username ?? authUser.email?.split('@')[0]
      }
    }

    // ── Create the users row ─────────────────────────────────
    if (userId && userName) {
      let insertError: any = null
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await supabase.from('users').insert({
          id: userId,
          email: email,
          username: userName,
          business_name: bizName || null,
          plan_key: 'free',
          ai_credits_remaining: 5,
        })
        insertError = result.error
        if (!insertError) break
        await new Promise(r => setTimeout(r, 1000))
      }

      if (insertError) {
        setError('Something went wrong setting up your account. Please try signing up again.')
        setLoading(false)
        // Don't clear sessionStorage — they may want to retry
        return
      }

      // Clean up on success
      sessionStorage.removeItem('cf_pending_id')
      sessionStorage.removeItem('cf_pending_email')
      sessionStorage.removeItem('cf_pending_username')
      sessionStorage.removeItem('cf_pending_biz')
    }

    // Refresh user state — AuthContext will now find the users row
    await refreshUser()
    setSuccess(true)
    setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
  }

  const handleResend = async () => {
    setError('')
    setCoolDown(60)

    const { error: sendError } = await sendSignupOtp(email)
    if (sendError) {
      setError(sendError.message)
      return
    }

    setOtp(Array(6).fill(''))
    inputRefs.current[0]?.focus()
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950" />
        <Card className="relative z-10 mx-4 w-full max-w-md overflow-hidden border-0 p-8 text-center shadow-xl dark:border dark:border-gray-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
            <MailCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Email Verified! 🎉
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Your email has been verified. Redirecting to your dashboard...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950" />

      <div className="relative z-10 w-full max-w-md px-4 py-12">
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
            <MailCheck className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Verify your email
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            We've sent a 6-digit verification code to{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Please verify your email to start using ClientFlow.
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

            <div className="space-y-6">
              {/* OTP Input Grid */}
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="h-12 w-10 rounded-xl border-2 text-center text-lg font-bold tracking-widest text-gray-900 transition-all duration-150 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 sm:h-14 sm:w-12 sm:text-xl"
                    aria-label={`Digit ${index + 1} of verification code`}
                  />
                ))}
              </div>

              <Button
                onClick={handleVerify}
                className="w-full"
                size="lg"
                loading={loading}
                disabled={otp.join('').length !== 6}
              >
                Verify Email
              </Button>

              {/* Resend */}
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={coolDown > 0}
                    className="font-medium text-brand-600 transition-colors hover:text-brand-500 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400"
                  >
                    {coolDown > 0 ? `Resend in ${coolDown}s` : 'Resend code'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already verified?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
