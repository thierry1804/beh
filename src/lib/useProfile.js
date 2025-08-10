import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from '../auth/AuthProvider'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    async function fetchProfile() {
      try {
        setLoading(true)
        setError(null)
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          throw error
        }

        setProfile(data)
      } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const updateProfile = async (updates) => {
    if (!user) return { error: new Error('Utilisateur non connecté') }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err)
      return { error: err }
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    isAdmin: profile?.role === 'admin',
    isOperator: profile?.role === 'operator'
  }
}
