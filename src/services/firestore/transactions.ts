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
  writeBatch,
  type FirestoreError,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import {
  mapIsoDate,
  mapNumberField,
  mapStringArray,
  mapStringField,
} from '@/services/firestore/mappers'
import { userSubcollectionPath } from '@/services/firestore/paths'
import { FinanceTransaction } from '@/types/finance'

const collectionName = 'transactions'

export type TransactionInput = Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt'>

const toTransaction = (id: string, data: Record<string, unknown>): FinanceTransaction => {
  const rawType = mapStringField(data.type, 'expense')

  return {
    id,
    amount: mapNumberField(data.amount),
    categoryId: mapStringField(data.categoryId, 'other'),
    date: mapIsoDate(data.date),
    description: mapStringField(data.description),
    tags: mapStringArray(data.tags),
    type: rawType === 'income' ? 'income' : 'expense',
    linkedLoanId: data.linkedLoanId ? mapStringField(data.linkedLoanId) : undefined,
    createdAt: mapIsoDate(data.createdAt),
    updatedAt: mapIsoDate(data.updatedAt),
  }
}

export const subscribeTransactions = (
  uid: string,
  callback: (transactions: FinanceTransaction[]) => void,
  onError?: (error: FirestoreError) => void,
): (() => void) => {
  const transactionsQuery = query(
    collection(db, userSubcollectionPath(uid, collectionName)),
    orderBy('date', 'desc'),
  )

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => toTransaction(docSnapshot.id, docSnapshot.data())))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export const addTransaction = async (uid: string, payload: TransactionInput): Promise<void> => {
  await addDoc(collection(db, userSubcollectionPath(uid, collectionName)), {
    ...payload,
    date: payload.date,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateTransaction = async (
  uid: string,
  transactionId: string,
  payload: Partial<TransactionInput>,
): Promise<void> => {
  await setDoc(
    doc(db, userSubcollectionPath(uid, collectionName), transactionId),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export const deleteTransaction = async (uid: string, transactionId: string): Promise<void> => {
  await deleteDoc(doc(db, userSubcollectionPath(uid, collectionName), transactionId))
}

export const importTransactionsBatch = async (
  uid: string,
  transactions: TransactionInput[],
): Promise<void> => {
  const batch = writeBatch(db)

  for (const payload of transactions) {
    const targetRef = doc(collection(db, userSubcollectionPath(uid, collectionName)))

    batch.set(targetRef, {
      ...payload,
      date: payload.date,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()
}
