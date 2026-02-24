import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, type DocumentSnapshot } from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { mapStringArray, mapStringField } from '@/services/firestore/mappers'
import { userDocPath } from '@/services/firestore/paths'
import { UserPreferences, UserProfile } from '@/types/finance'

export const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'USD',
  themeMode: 'light',
  highContrast: false,
  emailNotifications: true,
  pushNotifications: false,
}

export const createUserProfile = async (
  uid: string,
  email: string,
  displayName: string,
): Promise<void> => {
  await setDoc(
    doc(db, userDocPath(uid)),
    {
      email,
      displayName,
      collaborators: [],
      preferences: DEFAULT_PREFERENCES,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

const mapSnapshotToProfile = (snapshot: DocumentSnapshot): UserProfile | null => {
  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  const preferences = (data.preferences ?? {}) as Partial<UserPreferences>

  return {
    id: snapshot.id,
    email: mapStringField(data.email),
    displayName: mapStringField(data.displayName),
    collaborators: mapStringArray(data.collaborators),
    preferences: {
      currency: mapStringField(preferences.currency, DEFAULT_PREFERENCES.currency),
      themeMode: preferences.themeMode === 'dark' ? 'dark' : 'light',
      highContrast: Boolean(preferences.highContrast),
      emailNotifications:
        typeof preferences.emailNotifications === 'boolean'
          ? preferences.emailNotifications
          : DEFAULT_PREFERENCES.emailNotifications,
      pushNotifications:
        typeof preferences.pushNotifications === 'boolean'
          ? preferences.pushNotifications
          : DEFAULT_PREFERENCES.pushNotifications,
    },
  }
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snapshot = await getDoc(doc(db, userDocPath(uid)))
  return mapSnapshotToProfile(snapshot)
}

export const subscribeUserProfile = (
  uid: string,
  callback: (profile: UserProfile | null) => void,
): (() => void) => {
  return onSnapshot(doc(db, userDocPath(uid)), (snapshot) => {
    callback(mapSnapshotToProfile(snapshot))
  })
}

export const updateUserPreferences = async (
  uid: string,
  preferences: Partial<UserPreferences>,
): Promise<void> => {
  await updateDoc(doc(db, userDocPath(uid)), {
    preferences,
    updatedAt: serverTimestamp(),
  })
}
