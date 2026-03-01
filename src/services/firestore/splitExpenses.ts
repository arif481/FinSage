import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    type FirestoreError,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import {
    mapIsoDate,
    mapNumberField,
    mapStringField,
} from '@/services/firestore/mappers'
import { userSubcollectionPath } from '@/services/firestore/paths'
import { SplitExpense, SplitStatus } from '@/types/finance'

const collectionName = 'splitExpenses'

const toSplitExpense = (id: string, data: Record<string, unknown>): SplitExpense => {
    const rawStatus = mapStringField(data.status, 'pending')

    return {
        id,
        description: mapStringField(data.description),
        totalAmount: mapNumberField(data.totalAmount),
        myShare: mapNumberField(data.myShare),
        splitWith: mapStringField(data.splitWith),
        status: (rawStatus === 'settled' ? 'settled' : 'pending') as SplitStatus,
        linkedTransactionId: data.linkedTransactionId ? mapStringField(data.linkedTransactionId as string) : undefined,
        settledDate: data.settledDate ? mapIsoDate(data.settledDate) : undefined,
        createdAt: mapIsoDate(data.createdAt),
        updatedAt: mapIsoDate(data.updatedAt),
    }
}

export const subscribeSplitExpenses = (
    uid: string,
    callback: (splits: SplitExpense[]) => void,
    onError?: (error: FirestoreError) => void,
): (() => void) => {
    const splitsQuery = query(
        collection(db, userSubcollectionPath(uid, collectionName)),
        orderBy('createdAt', 'desc'),
    )

    return onSnapshot(
        splitsQuery,
        (snapshot) => {
            callback(snapshot.docs.map((docSnapshot) => toSplitExpense(docSnapshot.id, docSnapshot.data())))
        },
        (error) => {
            onError?.(error)
        },
    )
}

export type SplitExpenseInput = Omit<SplitExpense, 'id' | 'createdAt' | 'updatedAt'>

export const addSplitExpense = async (uid: string, payload: SplitExpenseInput): Promise<string> => {
    const docRef = await addDoc(collection(db, userSubcollectionPath(uid, collectionName)), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
    return docRef.id
}

export const updateSplitExpense = async (
    uid: string,
    splitId: string,
    payload: Partial<SplitExpenseInput>,
): Promise<void> => {
    await setDoc(
        doc(db, userSubcollectionPath(uid, collectionName), splitId),
        { ...payload, updatedAt: serverTimestamp() },
        { merge: true },
    )
}

export const deleteSplitExpense = async (uid: string, splitId: string): Promise<void> => {
    await deleteDoc(doc(db, userSubcollectionPath(uid, collectionName), splitId))
}

export const settleSplitExpense = async (uid: string, splitId: string): Promise<void> => {
    await setDoc(
        doc(db, userSubcollectionPath(uid, collectionName), splitId),
        { status: 'settled', settledDate: new Date().toISOString(), updatedAt: serverTimestamp() },
        { merge: true },
    )
}
