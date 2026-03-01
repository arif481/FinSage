import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  doc,
  getDocs,
  type FirestoreError,
} from 'firebase/firestore'
import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories'
import { db } from '@/services/firebase/config'
import { mapStringField } from '@/services/firestore/mappers'
import { userSubcollectionPath } from '@/services/firestore/paths'
import { Category } from '@/types/finance'

const collectionName = 'categories'

const toCategory = (id: string, data: Record<string, unknown>): Category => ({
  id,
  name: mapStringField(data.name),
  icon: mapStringField(data.icon, 'dot'),
  color: mapStringField(data.color, '#8f95a1'),
})

export const subscribeCategories = (
  uid: string,
  callback: (categories: Category[]) => void,
  onError?: (error: FirestoreError) => void,
): (() => void) => {
  const categoriesQuery = query(
    collection(db, userSubcollectionPath(uid, collectionName)),
    orderBy('name', 'asc'),
  )

  return onSnapshot(
    categoriesQuery,
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => toCategory(docSnapshot.id, docSnapshot.data())))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export const addCategory = async (
  uid: string,
  payload: Omit<Category, 'id' | 'createdAt'>,
): Promise<void> => {
  await addDoc(collection(db, userSubcollectionPath(uid, collectionName)), {
    ...payload,
    createdAt: serverTimestamp(),
  })
}

export const updateCategory = async (
  uid: string,
  categoryId: string,
  payload: Partial<Omit<Category, 'id' | 'createdAt'>>,
): Promise<void> => {
  await setDoc(
    doc(db, userSubcollectionPath(uid, collectionName), categoryId),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export const seedDefaultCategories = async (uid: string): Promise<void> => {
  const categoriesRef = collection(db, userSubcollectionPath(uid, collectionName))
  const existing = await getDocs(categoriesRef)

  if (!existing.empty) {
    return
  }

  const batch = writeBatch(db)

  for (const category of DEFAULT_CATEGORIES) {
    const ref = doc(categoriesRef, category.id)
    batch.set(ref, {
      name: category.name,
      icon: category.icon,
      color: category.color,
      createdAt: serverTimestamp(),
    })
  }

  await batch.commit()
}

export const deleteCategory = async (uid: string, categoryId: string): Promise<void> => {
  const ref = doc(db, userSubcollectionPath(uid, collectionName), categoryId)
  const { deleteDoc } = await import('firebase/firestore')
  await deleteDoc(ref)
}

/** Reassign all transactions from sourceCategoryId to targetCategoryId, then delete source */
export const mergeCategories = async (
  uid: string,
  sourceCategoryId: string,
  targetCategoryId: string,
): Promise<void> => {
  const transactionsRef = collection(db, userSubcollectionPath(uid, 'transactions'))
  const snapshot = await getDocs(transactionsRef)

  const batch = writeBatch(db)

  for (const d of snapshot.docs) {
    if (d.data().categoryId === sourceCategoryId) {
      batch.update(d.ref, { categoryId: targetCategoryId, updatedAt: serverTimestamp() })
    }
  }

  // Delete the source category
  batch.delete(doc(db, userSubcollectionPath(uid, collectionName), sourceCategoryId))

  await batch.commit()
}
