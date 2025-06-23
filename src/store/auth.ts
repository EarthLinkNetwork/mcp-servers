import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/auth'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    set({ loading: true })
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    set({ user, loading: false })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      set({ user: session?.user ?? null })
    })
  }
}))