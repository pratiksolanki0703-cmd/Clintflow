import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, username: string, businessName?: string) => Promise<{ error: Error | null; user?: { id: string; email: string } }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  checkEmailExists: (email: string) => Promise<{ exists: boolean; error: Error | null }>
  sendOtp: (email: string) => Promise<{ error: Error | null; coolDown: number }>
  sendSignupOtp: (email: string) => Promise<{ error: Error | null; coolDown: number }>
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Rate limiting helpers (client-side)
const RATE_LIMITS = {
  OTP_COOLDOWN: 60,      // seconds before can request another OTP
  OTP_MAX_ATTEMPTS: 5,   // max OTP verification attempts before lockout
  LOGIN_MAX_ATTEMPTS: 5, // max login attempts before temporary lockout
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes lockout
}

function getStoredAttempts(key: string): { count: number; timestamp: number } {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { count: 0, timestamp: 0 }
}

function setStoredAttempts(key: string, count: number) {
  localStorage.setItem(key, JSON.stringify({ count, timestamp: Date.now() }))
}

function clearStoredAttempts(key: string) {
  localStorage.removeItem(key)
}

function isLockedOut(key: string): boolean {
  const stored = getStoredAttempts(key)
  if (stored.count >= RATE_LIMITS.LOGIN_MAX_ATTEMPTS) {
    const elapsed = Date.now() - stored.timestamp
    if (elapsed < RATE_LIMITS.LOCKOUT_DURATION) return true
    clearStoredAttempts(key)
  }
  return false
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(session)
      if (session?.user) {
        await fetchUser(session.user.id)
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      setSession(session)
      if (session?.user) {
        await fetchUser(session.user.id)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUser = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } else {
      setUser(data)
    }
  }

  const signUp = async (email: string, password: string, username: string, businessName?: string) => {
    // First check if username is available
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingUser) {
      return { error: new Error('Username is already taken. Please choose another.') }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

    if (error) return { error }

    if (data.user && businessName) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ business_name: businessName })
        .eq('id', data.user.id)

      if (updateError) {
        console.error('Error updating business name:', updateError)
      }
    }

    return { 
      error: null,
      user: data.user ? { id: data.user.id, email: data.user.email ?? email } : undefined
    }
  }

  const signIn = async (email: string, password: string) => {
    const lockoutKey = `login_attempts_${email.toLowerCase()}`

    if (isLockedOut(lockoutKey)) {
      const remaining = Math.ceil((RATE_LIMITS.LOCKOUT_DURATION - (Date.now() - getStoredAttempts(lockoutKey).timestamp)) / 60000)
      return { error: new Error(`Too many login attempts. Please try again in ${remaining} minute(s).`) }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Track failed attempt
      const stored = getStoredAttempts(lockoutKey)
      setStoredAttempts(lockoutKey, stored.count + 1)
      return { error }
    }

    // Clear attempts on success
    clearStoredAttempts(lockoutKey)
    return { error: null }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const sendSignupOtp = async (email: string): Promise<{ error: Error | null; coolDown: number }> => {
    const otpKey = `signup_otp_${email.toLowerCase()}`
    const stored = getStoredAttempts(otpKey)
    const elapsed = Date.now() - stored.timestamp
    const remaining = RATE_LIMITS.OTP_COOLDOWN - Math.floor(elapsed / 1000)

    if (remaining > 0) {
      return { error: new Error(`Please wait ${remaining} seconds before requesting another OTP.`), coolDown: remaining }
    }

    // Send OTP via Supabase (shouldCreateUser: false so it doesn't create a new user)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    if (error) return { error, coolDown: 0 }

    // Set cooldown
    setStoredAttempts(otpKey, 1)
    return { error: null, coolDown: RATE_LIMITS.OTP_COOLDOWN }
  }

  const checkEmailExists = async (email: string): Promise<{ exists: boolean; error: Error | null }> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (error) return { exists: false, error }
      return { exists: !!data, error: null }
    } catch (err) {
      return { exists: false, error: err instanceof Error ? err : new Error('Failed to check email') }
    }
  }

  const sendOtp = async (email: string): Promise<{ error: Error | null; coolDown: number }> => {
    const otpKey = `otp_cooldown_${email.toLowerCase()}`
    const stored = getStoredAttempts(otpKey)
    const elapsed = Date.now() - stored.timestamp
    const remaining = RATE_LIMITS.OTP_COOLDOWN - Math.floor(elapsed / 1000)

    if (remaining > 0) {
      return { error: new Error(`Please wait ${remaining} seconds before requesting another OTP.`), coolDown: remaining }
    }

    // Check email exists in our users table
    const { exists } = await checkEmailExists(email)
    if (!exists) {
      return { error: new Error('No account found with this email address.'), coolDown: 0 }
    }

    // Use Supabase's built-in OTP (signInWithOtp)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    if (error) return { error, coolDown: 0 }

    // Set cooldown
    setStoredAttempts(otpKey, 1)
    return { error: null, coolDown: RATE_LIMITS.OTP_COOLDOWN }
  }

  const verifyOtp = async (email: string, token: string): Promise<{ error: Error | null }> => {
    const attemptsKey = `otp_attempts_${email.toLowerCase()}`

    // Check max attempts
    const stored = getStoredAttempts(attemptsKey)
    if (stored.count >= RATE_LIMITS.OTP_MAX_ATTEMPTS) {
      return { error: new Error('Too many incorrect attempts. Please request a new OTP.') }
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      // Track failed attempt
      setStoredAttempts(attemptsKey, stored.count + 1)
      const remaining = RATE_LIMITS.OTP_MAX_ATTEMPTS - (stored.count + 1)
      return {
        error: new Error(
          remaining > 0
            ? `Invalid OTP. ${remaining} attempt(s) remaining.`
            : 'Too many incorrect attempts. Please request a new OTP.'
        ),
      }
    }

    // Clear on success
    clearStoredAttempts(attemptsKey)
    clearStoredAttempts(`otp_cooldown_${email.toLowerCase()}`)
    return { error: null }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await fetchUser(session.user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        checkEmailExists,
        sendOtp,
        sendSignupOtp,
        verifyOtp,
        updatePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
