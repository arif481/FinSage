import { ReactNode, createContext, useEffect, useMemo, useState } from 'react'
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '@/services/firebase/config'
import { seedDefaultCategories } from '@/services/firestore/categories'
import { createUserProfile, getUserProfile } from '@/services/firestore/profile'

interface AuthContextValue {
  loading: boolean
  user: User | null
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)

      if (!nextUser) {
        setLoading(false)
        return
      }

      const profile = await getUserProfile(nextUser.uid)

      if (!profile) {
        await createUserProfile(
          nextUser.uid,
          nextUser.email ?? '',
          nextUser.displayName ?? 'FinSage user',
        )
      }

      await seedDefaultCategories(nextUser.uid)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      user,
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password)
      },
      signUpWithEmail: async (email, password, displayName) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await createUserProfile(credential.user.uid, email, displayName)
      },
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider()
        await signInWithPopup(auth, provider)
      },
      signOutUser: async () => {
        await signOut(auth)
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
