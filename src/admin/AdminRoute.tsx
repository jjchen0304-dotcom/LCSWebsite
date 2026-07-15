import { useEffect, useState, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import {
  checkAdminSession,
  signOutAdmin,
  signInAdmin,
  supabase,
  type AdminSessionStatus,
} from '../lib/supabase'
import { ADMIN_LOGIN_PATH, navigateTo } from '../lib/router'

export function useAdminSession() {
  const [status, setStatus] = useState<AdminSessionStatus>('loading')
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  const verify = async () => {
    if (!supabase) {
      setStatus('signed_out')
      setEmail(null)
      return
    }

    setStatus('loading')
    setError(null)

    try {
      const result = await checkAdminSession()
      setStatus(result.status)
      setEmail(result.email)
    } catch (sessionError) {
      setStatus('signed_out')
      setEmail(null)
      setError(sessionError instanceof Error ? sessionError.message : 'Unable to verify admin session.')
    }
  }

  useEffect(() => {
    void verify()

    const subscription = supabase?.auth.onAuthStateChange(() => {
      void verify()
    })

    return () => {
      subscription?.data.subscription.unsubscribe()
    }
  }, [])

  const login = async (emailInput: string, password: string) => {
    setWorking(true)
    setError(null)

    try {
      await signInAdmin(emailInput, password)
      const result = await checkAdminSession()
      setStatus(result.status)
      setEmail(result.email)

      if (result.status !== 'verified') {
        throw new Error('This account is not authorized to access admin tools.')
      }
    } catch (loginError) {
      setStatus('signed_out')
      setEmail(null)
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.')
      throw loginError
    } finally {
      setWorking(false)
    }
  }

  const logout = async () => {
    setWorking(true)

    try {
      await signOutAdmin()
    } finally {
      setStatus('signed_out')
      setEmail(null)
      setError(null)
      setWorking(false)
    }
  }

  return {
    status,
    email,
    error,
    working,
    isVerified: status === 'verified',
    setError,
    verify,
    login,
    logout,
  }
}

export function AdminRoute({
  status,
  onUnauthorized,
  children,
}: {
  status: AdminSessionStatus
  onUnauthorized?: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (status === 'signed_out' || status === 'unauthorized') {
      onUnauthorized?.()
      navigateTo(ADMIN_LOGIN_PATH)
    }
  }, [onUnauthorized, status])

  if (status === 'loading') {
    return (
      <section className="registration section">
        <div className="container">
          <p className="loading-note"><LoaderCircle size={18} /> Loading admin session…</p>
        </div>
      </section>
    )
  }

  if (status !== 'verified') {
    return (
      <section className="registration section">
        <div className="container">
          <p className="loading-note"><LoaderCircle size={18} /> Redirecting to admin login…</p>
        </div>
      </section>
    )
  }

  return <>{children}</>
}
