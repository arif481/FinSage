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
import { RecurringRule } from '@/types/finance'

const collectionName = 'recurringRules'

const toRecurringRule = (id: string, data: Record<string, unknown>): RecurringRule => {
    const rawFreq = mapStringField(data.frequency, 'monthly')
    const rawType = mapStringField(data.type, 'expense')

    return {
        id,
        description: mapStringField(data.description),
        amount: mapNumberField(data.amount),
        type: rawType === 'income' ? 'income' : 'expense',
        categoryId: mapStringField(data.categoryId, 'other'),
        frequency: (['daily', 'weekly', 'monthly'].includes(rawFreq) ? rawFreq : 'monthly') as RecurringRule['frequency'],
        nextRun: mapIsoDate(data.nextRun),
        active: typeof data.active === 'boolean' ? data.active : true,
        createdAt: mapIsoDate(data.createdAt),
    }
}

export const subscribeRecurringRules = (
    uid: string,
    callback: (rules: RecurringRule[]) => void,
    onError?: (error: FirestoreError) => void,
): (() => void) => {
    const rulesQuery = query(
        collection(db, userSubcollectionPath(uid, collectionName)),
        orderBy('createdAt', 'desc'),
    )

    return onSnapshot(
        rulesQuery,
        (snapshot) => {
            callback(snapshot.docs.map((docSnapshot) => toRecurringRule(docSnapshot.id, docSnapshot.data())))
        },
        (error) => {
            onError?.(error)
        },
    )
}

export type RecurringRuleInput = Omit<RecurringRule, 'id' | 'createdAt'>

export const addRecurringRule = async (uid: string, payload: RecurringRuleInput): Promise<string> => {
    const docRef = await addDoc(collection(db, userSubcollectionPath(uid, collectionName)), {
        ...payload,
        createdAt: serverTimestamp(),
    })
    return docRef.id
}

export const updateRecurringRule = async (
    uid: string,
    ruleId: string,
    payload: Partial<RecurringRuleInput>,
): Promise<void> => {
    await setDoc(
        doc(db, userSubcollectionPath(uid, collectionName), ruleId),
        { ...payload },
        { merge: true },
    )
}

export const deleteRecurringRule = async (uid: string, ruleId: string): Promise<void> => {
    await deleteDoc(doc(db, userSubcollectionPath(uid, collectionName), ruleId))
}

export const toggleRecurringRule = async (uid: string, ruleId: string, active: boolean): Promise<void> => {
    await setDoc(
        doc(db, userSubcollectionPath(uid, collectionName), ruleId),
        { active },
        { merge: true },
    )
}
