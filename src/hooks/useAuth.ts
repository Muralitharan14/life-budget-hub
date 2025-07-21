import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, auth, profileService } from '@/lib/supabase'

interface UserProfile {
  id: string
  user_id: string
  profile_name: string
  display_name: string | null
  is_primary: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ExtendedUser extends User {
  login_id?: string
  profiles?: UserProfile[]
}

export function useAuth() {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', {
          message: error.message,
        })
      } else {
        setSession(session)
        if (session?.user) {
          await loadUserWithProfiles(session.user)
        }
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (session?.user) {
          await loadUserWithProfiles(session.user)
        } else {
          setUser(null)
          setProfiles([])
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserWithProfiles = async (authUser: User) => {
    try {
      // Get or create user record
      const userData = await profileService.getOrCreateUser(authUser)
      if (userData) {
        // Get user profiles
        const userProfiles = await profileService.getUserProfiles(userData.id)
        setProfiles(userProfiles)
        
        // Extend user object with additional data
        const extendedUser: ExtendedUser = {
          ...authUser,
          login_id: userData.login_id,
          profiles: userProfiles
        }
        setUser(extendedUser)
      } else {
        setUser(authUser as ExtendedUser)
      }
    } catch (error) {
      console.error('Error loading user profiles:', error)
      setUser(authUser as ExtendedUser)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string, loginId?: string) => {
    setLoading(true)
    try {
      const { data, error } = await auth.signUp(email, password)
      if (error) throw error
      
      // If signup successful and we have user data, create user record
      if (data?.user && loginId) {
        const userData = await profileService.createUser(data.user, loginId)
        if (userData) {
          // Create default profiles (user's own profile)
          await profileService.createProfile(userData.id, 'Primary', fullName || 'Primary Profile', true)
        }
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
      const { data, error } = await auth.signIn(email, password)
      if (error) throw error
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
      const { error } = await auth.signOut()
      if (error) throw error
      setUser(null)
      setProfiles([])
      return { error: null }
    } catch (error: any) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async (profileName: string, displayName?: string) => {
    if (!user) return null
    
    try {
      const newProfile = await profileService.createProfile(
        user.id, 
        profileName, 
        displayName, 
        false
      )
      
      if (newProfile) {
        setProfiles(prev => [...prev, newProfile])
        return newProfile
      }
      return null
    } catch (error) {
      console.error('Error creating profile:', error)
      return null
    }
  }

  const refreshProfiles = async () => {
    if (!user) return
    
    try {
      const userProfiles = await profileService.getUserProfiles(user.id)
      setProfiles(userProfiles)
    } catch (error) {
      console.error('Error refreshing profiles:', error)
    }
  }

  return {
    user,
    session,
    profiles,
    loading,
    signUp,
    signIn,
    signOut,
    createProfile,
    refreshProfiles,
    isAuthenticated: !!user,
  }
}
