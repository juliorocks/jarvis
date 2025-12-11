import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  display_name: string | null
  avatar_url: string | null
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
            .from('user_settings')
            .select('*')
            .eq('id', user.id)
            .single()

          if (data) {
            setProfile(data)
          } else if (error) {
             console.error('Error fetching profile:', error)
             // Fallback to metadata if available
             setProfile({
                id: user.id,
                display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                avatar_url: user.user_metadata?.avatar_url || null
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
