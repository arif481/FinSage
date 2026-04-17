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
import type { SpaceLoan, SpaceLoanStatus } from '@/types/finance'

const SUB = 'loans'

const toSpaceLoan = (id: string, data: Record<string, unknown>): SpaceLoan => {
    const rawStatus = mapStringField(data.status, 'active')
    const validStatuses: SpaceLoanStatus[] = ['active', 'settled', 'overdue']

    return {
        id,
        fromUid: mapStringField(data.fromUid),
        fromName: mapStringField(data.fromName, 'Unknown'),
        toUid: mapStringField(data.toUid),
        toName: mapStringField(data.toName, 'Unknown'),
        amount: mapNumberField(data.amount),
        repaidAmount: mapNumberField(data.repaidAmount, 0),
        description: mapStringField(data.description),
        status: validStatuses.includes(rawStatus as SpaceLoanStatus) ? (rawStatus as SpaceLoanStatus) : 'active',
        isEmi: Boolean(data.isEmi),
        emiAmount: data.emiAmount ? mapNumberField(data.emiAmount) : undefined,
        emiDay: data.emiDay ? mapNumberField(data.emiDay) : undefined,
        totalInstallments: data.totalInstallments ? mapNumberField(data.totalInstallments) : undefined,
        paidInstallments: data.paidInstallments ? mapNumberField(data.paidInstallments, 0) : undefined,
        dueDate: data.dueDate ? mapIsoDate(data.dueDate) : undefined,
        settledDate: data.settledDate ? mapIsoDate(data.settledDate) : undefined,
        creditCardLabel: data.creditCardLabel ? mapStringField(data.creditCardLabel) : undefined,
        tags: mapStringArray(data.tags),
        createdBy: mapStringField(data.createdBy),
        createdAt: mapIsoDate(data.createdAt),
        updatedAt: mapIsoDate(data.updatedAt),
    }
}

export const subscribeSpaceLoans = (
    spaceId: string,
    callback: (loans: SpaceLoan[]) => void,
    onError?: (error: FirestoreError) => void,
): (() => void) => {
    const q = query(
        collection(db, spaceSubcollectionPath(spaceId, SUB)),
        orderBy('createdAt', 'desc'),
    )

    return onSnapshot(
        q,
        (snapshot) => {
            callback(snapshot.docs.map((d) => toSpaceLoan(d.id, d.data())))
        },
        (error) => onError?.(error),
    )
}

export type SpaceLoanInput = Omit<SpaceLoan, 'id' | 'createdAt' | 'updatedAt'>

export const addSpaceLoan = async (
    spaceId: string,
    payload: SpaceLoanInput,
): Promise<string> => {
    const docRef = await addDoc(collection(db, spaceSubcollectionPath(spaceId, SUB)), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
    return docRef.id
}

export const updateSpaceLoan = async (
    spaceId: string,
    loanId: string,
    payload: Partial<SpaceLoanInput>,
): Promise<void> => {
    await setDoc(
        doc(db, spaceSubcollectionPath(spaceId, SUB), loanId),
        { ...payload, updatedAt: serverTimestamp() },
        { merge: true },
    )
}

export const recordSpaceRepayment = async (
    spaceId: string,
    loanId: string,
    additionalAmount: number,
    currentRepaid: number,
    currentPaidInstallments?: number,
    isEmi?: boolean,
): Promise<void> => {
    const update: Record<string, unknown> = {
        repaidAmount: currentRepaid + additionalAmount,
        updatedAt: serverTimestamp(),
    }

    if (isEmi && currentPaidInstallments !== undefined) {
        update.paidInstallments = currentPaidInstallments + 1
    }

    await setDoc(
        doc(db, spaceSubcollectionPath(spaceId, SUB), loanId),
        update,
        { merge: true },
    )
}

export const settleSpaceLoan = async (spaceId: string, loanId: string): Promise<void> => {
    await setDoc(
        doc(db, spaceSubcollectionPath(spaceId, SUB), loanId),
        {
            status: 'settled',
            settledDate: new Date().toISOString(),
            updatedAt: serverTimestamp(),
        },
        { merge: true },
    )
}

export const deleteSpaceLoan = async (spaceId: string, loanId: string): Promise<void> => {
    await deleteDoc(doc(db, spaceSubcollectionPath(spaceId, SUB), loanId))
}
