import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  display_name: string | null // Mapped from full_name
  email: string | null
  avatar_url: string | null
  role: 'admin' | 'user' | 'editor'
  plan_type: 'trial' | 'individual' | 'family'
  plan_status: 'active' | 'suspended' | 'trial_expired'
  trial_ends_at: string | null
  subscription_expires_at: string | null
}

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setUser(user)

          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (data) {
            setProfile({
              id: data.id,
              display_name: data.full_name,
              email: data.email,
              avatar_url: data.avatar_url,
              role: data.role || 'user',
              plan_type: data.plan_type || 'trial',
              plan_status: data.plan_status || 'active',
              trial_ends_at: data.trial_ends_at,
              subscription_expires_at: data.subscription_expires_at
            })
          } else if (error) {
            console.error('Error fetching profile:', error)
            // Fallback to metadata if available
            setProfile({
              id: user.id,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email || null,
              avatar_url: user.user_metadata?.avatar_url || null,
              role: 'user',
              plan_type: 'trial',
              plan_status: 'active',
              trial_ends_at: null,
              subscription_expires_at: null
            })
          }
        }
      } catch (error) {
        console.error('Error in useUserProfile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, profile, loading }
}
