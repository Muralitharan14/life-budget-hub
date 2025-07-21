import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl !== 'https://placeholder.supabase.co' && 
                           supabaseAnonKey !== 'placeholder-key' &&
                           supabaseUrl.includes('supabase.co')

if (!hasValidCredentials) {
  console.warn('⚠️ Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string) => {
    if (!hasValidCredentials) {
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please set up your Supabase credentials.' } 
      }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    if (!hasValidCredentials) {
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please set up your Supabase credentials.' } 
      }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  signOut: async () => {
    if (!hasValidCredentials) {
      return { error: { message: 'Supabase not configured. Please set up your Supabase credentials.' } }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    if (!hasValidCredentials) {
      return { 
        user: null, 
        error: { message: 'Supabase not configured. Please set up your Supabase credentials.' } 
      }
    }
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!hasValidCredentials) {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Profile management functions
export const profileService = {
  // Create user record after Supabase auth signup
  createUser: async (authUser: any, loginId: string) => {
    if (!hasValidCredentials) return null

    // Try to insert with the authenticated user's context
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        login_id: loginId,
        full_name: authUser.user_metadata?.full_name || ''
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return null
    }
    
    return data
  },

  // Get or create user by auth ID
  getOrCreateUser: async (authUser: any, loginId?: string) => {
    if (!hasValidCredentials) return null

    // First try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (existingUser) return existingUser

    // If user doesn't exist, try to create them
    if (loginId) {
      const userData = await profileService.createUser(authUser, loginId)
      if (userData) return userData
    }

    // If creation failed (possibly due to RLS), return a minimal user object
    // so the app can still function with auth-only features
    console.warn('Could not create user record in database, using auth-only mode')
    return {
      id: authUser.id,
      email: authUser.email,
      login_id: loginId || 'unknown',
      full_name: authUser.user_metadata?.full_name || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },

  // Create a new profile for a user
  createProfile: async (userId: string, profileName: string, displayName?: string, isPrimary: boolean = false) => {
    if (!hasValidCredentials) return null
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        profile_name: profileName,
        display_name: displayName || profileName,
        is_primary: isPrimary
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating profile:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return null
    }
    
    return data
  },

  // Get all profiles for a user
  getUserProfiles: async (userId: string) => {
    if (!hasValidCredentials) return []
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching profiles:', error)
      return []
    }
    
    return data || []
  }
}

export { hasValidCredentials }
