import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export interface UserProfile {
  email: string
  name: string
  password?: string
  age?: string | number
  city?: string
  state?: string
  country?: string
  fitnessProfile?: Record<string, any>
  allergyProfile?: {
    hasAllergies: boolean
    allergens: string[]
    otherAllergy: string
    severity: string
    medicallyDiagnosed: string
  }
}

export interface AuthContextType {
  user: UserProfile
  login: (email: string, name?: string) => void
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updated: Partial<UserProfile>) => void
}

function deriveNameFromEmail(email: string): string {
  const prefix = email.split('@')[0] || 'User'
  const cleaned = prefix.replace(/[._-]+/g, ' ')
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function profileFromSupabaseUser(authUser: User): UserProfile {
  const email = authUser.email || ''
  const name =
    (authUser.user_metadata?.full_name as string) ||
    (authUser.user_metadata?.name as string) ||
    deriveNameFromEmail(email)
  return {
    email,
    name,
    age: 26,
    city: 'New York',
    state: 'New York',
    country: 'United States',
  }
}

const defaultUser: UserProfile = {
  name: 'Alex Morgan',
  email: 'alex@example.com',
  age: 26,
  city: 'San Francisco',
  state: 'California',
  country: 'United States',
  fitnessProfile: {
    'Do you have a fitness goal?': { isYes: true, selected: ['Muscle Gain', 'Endurance'] },
    'Do you have gym access?': { isYes: true, selected: ['Full Gym'] },
  },
  allergyProfile: {
    hasAllergies: false,
    allergens: [],
    otherAllergy: '',
    severity: 'Moderate',
    medicallyDiagnosed: 'No',
  },
}

const AuthContext = createContext<AuthContextType>({
  user: defaultUser,
  login: () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  logout: async () => {},
  updateProfile: () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('nutriguard_user')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // ignore
    }
    return defaultUser
  })

  const persistUser = useCallback((profile: UserProfile) => {
    setUser(profile)
    try {
      localStorage.setItem('nutriguard_user', JSON.stringify(profile))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        persistUser(profileFromSupabaseUser(data.session.user))
      }
    }).catch(() => {
      // ignore
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        persistUser(profileFromSupabaseUser(session.user))
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [persistUser])

  const login = (email: string, name?: string) => {
    const formattedName = name?.trim() || deriveNameFromEmail(email)
    persistUser({ email: email.trim(), name: formattedName })
  }

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      // Simulate Google sign-in with a demo Google account
      await new Promise((resolve) => setTimeout(resolve, 800))
      persistUser({ email: 'demo.google@gmail.com', name: 'Google User' })
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      throw new Error(error.message || 'Google sign-in failed. Please try again.')
    }
  }

  const signInWithApple = async () => {
    if (!isSupabaseConfigured) {
      // Simulate Apple sign-in with a demo Apple account
      await new Promise((resolve) => setTimeout(resolve, 800))
      persistUser({ email: 'demo.apple@icloud.com', name: 'Apple User' })
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw new Error(error.message || 'Apple sign-in failed. Please try again.')
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    localStorage.removeItem('sb-access-token')
    localStorage.removeItem('sb-refresh-token')
    localStorage.removeItem('nutriguard_user')
    setUser(defaultUser)
  }

  const updateProfile = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...prev, ...updated }
      try {
        localStorage.setItem('nutriguard_user', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, login, signInWithGoogle, signInWithApple, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
