import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'

export const useCurrency = () => {
  const { user } = useAuth()
  const { profile } = useUserProfile(user?.uid)

  return profile?.preferences.currency ?? 'USD'
}
