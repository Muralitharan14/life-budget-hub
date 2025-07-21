import { useState, useEffect } from 'react'
import { User, Session, localAuth } from '@/lib/localStorage'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await localAuth.getSession()
      if (error) {
        console.error('Error getting session:', {
          message: error.message,
        })
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = localAuth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true)
    try {
      const { data, error } = await localAuth.signUp(email, password, fullName)
      if (error) throw error

      // Update state immediately
      if (data?.user && data?.session) {
        setUser(data.user)
        setSession(data.session)
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await localAuth.signIn(email, password)
      if (error) throw error

      // Update state immediately
      if (data?.user && data?.session) {
        setUser(data.user)
        setSession(data.session)
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await localAuth.signOut()
      if (error) throw error

      // Update state immediately
      setUser(null)
      setSession(null)

      return { error: null }
    } catch (error: any) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }
}
