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
    mapStringArray,
    mapStringField,
} from '@/services/firestore/mappers'
import { spaceSubcollectionPath } from '@/services/firestore/paths'
import type { SpaceTransaction, SpaceTransactionType } from '@/types/finance'

const SUB = 'transactions'

const toSpaceTransaction = (id: string, data: Record<string, unknown>): SpaceTransaction => {
    const rawType = mapStringField(data.type, 'expense')
    const validTypes: SpaceTransactionType[] = ['expense', 'income', 'credit_purchase', 'emi_payment']

    return {
        id,
        amount: mapNumberField(data.amount),
        description: mapStringField(data.description),
        categoryId: mapStringField(data.categoryId, 'other'),
        type: validTypes.includes(rawType as SpaceTransactionType) ? (rawType as SpaceTransactionType) : 'expense',
        paidBy: mapStringField(data.paidBy),
        paidByName: mapStringField(data.paidByName, 'Unknown'),
        splitAmong: mapStringArray(data.splitAmong),
        date: mapIsoDate(data.date),
        tags: mapStringArray(data.tags),
        linkedLoanId: data.linkedLoanId ? mapStringField(data.linkedLoanId) : undefined,
        attachmentNote: data.attachmentNote ? mapStringField(data.attachmentNote) : undefined,
        createdBy: mapStringField(data.createdBy),
        createdAt: mapIsoDate(data.createdAt),
        updatedAt: mapIsoDate(data.updatedAt),
    }
}

export const subscribeSpaceTransactions = (
    spaceId: string,
    callback: (txns: SpaceTransaction[]) => void,
    onError?: (error: FirestoreError) => void,
): (() => void) => {
    const q = query(
        collection(db, spaceSubcollectionPath(spaceId, SUB)),
        orderBy('date', 'desc'),
    )

    return onSnapshot(
        q,
        (snapshot) => {
            callback(snapshot.docs.map((d) => toSpaceTransaction(d.id, d.data())))
        },
        (error) => onError?.(error),
    )
}

export type SpaceTransactionInput = Omit<SpaceTransaction, 'id' | 'createdAt' | 'updatedAt'>

export const addSpaceTransaction = async (
    spaceId: string,
    payload: SpaceTransactionInput,
): Promise<string> => {
    const docRef = await addDoc(collection(db, spaceSubcollectionPath(spaceId, SUB)), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
    return docRef.id
}

export const updateSpaceTransaction = async (
    spaceId: string,
    txnId: string,
    payload: Partial<SpaceTransactionInput>,
): Promise<void> => {
    await setDoc(
        doc(db, spaceSubcollectionPath(spaceId, SUB), txnId),
        { ...payload, updatedAt: serverTimestamp() },
        { merge: true },
    )
}

export const deleteSpaceTransaction = async (
    spaceId: string,
    txnId: string,
): Promise<void> => {
    await deleteDoc(doc(db, spaceSubcollectionPath(spaceId, SUB), txnId))
}
