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
import { Loan, LoanDirection, LoanStatus } from '@/types/finance'

const collectionName = 'loans'

const toLoan = (id: string, data: Record<string, unknown>): Loan => {
    const rawDirection = mapStringField(data.direction, 'borrowed')
    const rawStatus = mapStringField(data.status, 'active')

    return {
        id,
        person: mapStringField(data.person),
        amount: mapNumberField(data.amount),
        repaidAmount: mapNumberField(data.repaidAmount, 0),
        direction: (rawDirection === 'lent' ? 'lent' : 'borrowed') as LoanDirection,
        status: (rawStatus === 'settled' ? 'settled' : 'active') as LoanStatus,
        description: mapStringField(data.description),
        dueDate: data.dueDate ? mapIsoDate(data.dueDate) : undefined,
        settledDate: data.settledDate ? mapIsoDate(data.settledDate) : undefined,
        createdAt: mapIsoDate(data.createdAt),
        updatedAt: mapIsoDate(data.updatedAt),
    }
}

export const subscribeLoans = (
    uid: string,
    callback: (loans: Loan[]) => void,
    onError?: (error: FirestoreError) => void,
): (() => void) => {
    const loansQuery = query(
        collection(db, userSubcollectionPath(uid, collectionName)),
        orderBy('createdAt', 'desc'),
    )

    return onSnapshot(
        loansQuery,
        (snapshot) => {
            callback(snapshot.docs.map((docSnapshot) => toLoan(docSnapshot.id, docSnapshot.data())))
        },
        (error) => {
            onError?.(error)
        },
    )
}

export type LoanInput = Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>

export const addLoan = async (uid: string, payload: LoanInput): Promise<string> => {
    const docRef = await addDoc(collection(db, userSubcollectionPath(uid, collectionName)), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
    return docRef.id
}

export const updateLoan = async (
    uid: string,
    loanId: string,
    payload: Partial<LoanInput>,
): Promise<void> => {
    await setDoc(
        doc(db, userSubcollectionPath(uid, collectionName), loanId),
        { ...payload, updatedAt: serverTimestamp() },
        { merge: true },
    )
}

export const deleteLoan = async (uid: string, loanId: string): Promise<void> => {
    await deleteDoc(doc(db, userSubcollectionPath(uid, collectionName), loanId))
}

export const settleLoan = async (uid: string, loanId: string): Promise<void> => {
    await setDoc(
        doc(db, userSubcollectionPath(uid, collectionName), loanId),
        { status: 'settled', settledDate: new Date().toISOString(), updatedAt: serverTimestamp() },
        { merge: true },
    )
}
