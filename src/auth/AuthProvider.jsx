import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  signInWithPassword: async (_email, _password) => ({ error: new Error('not ready') }),
  signInWithOtp: async (_email) => ({ error: new Error('not ready') }),
  signOut: async () => ({ error: new Error('not ready') }),
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => { mounted = false; sub.subscription?.unsubscribe?.() }
  }, [])

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    async signInWithPassword(email, password) {
      return await supabase.auth.signInWithPassword({ email, password })
    },
    async signInWithOtp(email) {
      return await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    },
    async signOut() {
      return await supabase.auth.signOut()
    },
  }), [session, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}


