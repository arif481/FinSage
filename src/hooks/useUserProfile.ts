import { useEffect, useState } from 'react'
import { subscribeUserProfile } from '@/services/firestore/profile'
import { UserProfile } from '@/types/finance'

interface UseUserProfileResult {
  loading: boolean
  profile: UserProfile | null
}

export const useUserProfile = (uid: string | undefined): UseUserProfileResult => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(Boolean(uid))

  useEffect(() => {
    if (!uid) {
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = subscribeUserProfile(
      uid,
      (nextProfile) => {
        setProfile(nextProfile)
        setLoading(false)
      },
      () => {
        setLoading(false)
      },
    )

    return unsubscribe
  }, [uid])

  return {
    loading,
    profile,
  }
}
