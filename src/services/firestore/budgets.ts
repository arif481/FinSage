import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { mapNumberField, mapStringField } from '@/services/firestore/mappers'
import { userSubcollectionPath } from '@/services/firestore/paths'
import { Budget } from '@/types/finance'

const collectionName = 'budgets'

const toBudget = (id: string, data: Record<string, unknown>): Budget => ({
  id,
  categoryId: mapStringField(data.categoryId),
  month: mapStringField(data.month),
  limit: mapNumberField(data.limit),
})

export const buildBudgetId = (month: string, categoryId: string): string => `${month}_${categoryId}`

export const subscribeBudgets = (uid: string, callback: (budgets: Budget[]) => void): (() => void) => {
  const budgetsQuery = query(
    collection(db, userSubcollectionPath(uid, collectionName)),
    orderBy('month', 'desc'),
  )

  return onSnapshot(budgetsQuery, (snapshot) => {
    callback(snapshot.docs.map((docSnapshot) => toBudget(docSnapshot.id, docSnapshot.data())))
  })
}

export const upsertBudget = async (uid: string, budget: Omit<Budget, 'id'>): Promise<void> => {
  const budgetId = buildBudgetId(budget.month, budget.categoryId)

  await setDoc(
    doc(db, userSubcollectionPath(uid, collectionName), budgetId),
    {
      ...budget,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
