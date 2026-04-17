import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    writeBatch,
    type FirestoreError,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { mapIsoDate, mapStringField } from '@/services/firestore/mappers'
import { spaceSubcollectionPath } from '@/services/firestore/paths'
import type { SpaceCategory } from '@/types/finance'

const SUB = 'categories'

const DEFAULT_SPACE_CATEGORIES: Omit<SpaceCategory, 'id' | 'createdAt' | 'createdBy'>[] = [
    { name: 'Food & Dining', icon: '🍕', color: '#ba4d37' },
    { name: 'Transport', icon: '🚗', color: '#577590' },
    { name: 'Shopping', icon: '🛍️', color: '#6d597a' },
    { name: 'Bills & Utilities', icon: '⚡', color: '#b08900' },
    { name: 'Entertainment', icon: '🎬', color: '#e36397' },
    { name: 'Groceries', icon: '🛒', color: '#2f7f6d' },
    { name: 'Rent & Housing', icon: '🏠', color: '#3d5a80' },
    { name: 'Health', icon: '💊', color: '#2b9348' },
    { name: 'Credit Card', icon: '💳', color: '#855928' },
    { name: 'EMI', icon: '📅', color: '#d45b0a' },
    { name: 'Other', icon: '📦', color: '#8f95a1' },
]

const toCategory = (id: string, data: Record<string, unknown>): SpaceCategory => ({
    id,
    name: mapStringField(data.name),
    icon: mapStringField(data.icon, '📦'),
    color: mapStringField(data.color, '#8f95a1'),
    createdBy: mapStringField(data.createdBy),
    createdAt: mapIsoDate(data.createdAt),
})

export const subscribeSpaceCategories = (
    spaceId: string,
    callback: (categories: SpaceCategory[]) => void,
    onError?: (error: FirestoreError) => void,
): (() => void) => {
    const q = query(
        collection(db, spaceSubcollectionPath(spaceId, SUB)),
        orderBy('name', 'asc'),
    )

    return onSnapshot(
        q,
        (snapshot) => {
            callback(snapshot.docs.map((d) => toCategory(d.id, d.data())))
        },
        (error) => onError?.(error),
    )
}

export const addSpaceCategory = async (
    spaceId: string,
    payload: Omit<SpaceCategory, 'id' | 'createdAt'>,
): Promise<void> => {
    await addDoc(collection(db, spaceSubcollectionPath(spaceId, SUB)), {
        ...payload,
        createdAt: serverTimestamp(),
    })
}

export const updateSpaceCategory = async (
    spaceId: string,
    categoryId: string,
    payload: Partial<Omit<SpaceCategory, 'id' | 'createdAt' | 'createdBy'>>,
): Promise<void> => {
    await setDoc(
        doc(db, spaceSubcollectionPath(spaceId, SUB), categoryId),
        payload,
        { merge: true },
    )
}

export const deleteSpaceCategory = async (spaceId: string, categoryId: string): Promise<void> => {
    await deleteDoc(doc(db, spaceSubcollectionPath(spaceId, SUB), categoryId))
}

export const seedDefaultSpaceCategories = async (spaceId: string, createdBy: string): Promise<void> => {
    const catRef = collection(db, spaceSubcollectionPath(spaceId, SUB))
    const existing = await getDocs(catRef)
    if (!existing.empty) return

    const batch = writeBatch(db)
    for (const cat of DEFAULT_SPACE_CATEGORIES) {
        const ref = doc(catRef)
        batch.set(ref, {
            ...cat,
            createdBy,
            createdAt: serverTimestamp(),
        })
    }
    await batch.commit()
}
