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
import { GoalStatus, SavingsGoal } from '@/types/finance'

const collectionName = 'savingsGoals'

const toSavingsGoal = (id: string, data: Record<string, unknown>): SavingsGoal => {
    const rawStatus = mapStringField(data.status, 'active')

    return {
        id,
        name: mapStringField(data.name),
        targetAmount: mapNumberField(data.targetAmount),
        currentAmount: mapNumberField(data.currentAmount),
        status: (['active', 'completed', 'paused'].includes(rawStatus) ? rawStatus : 'active') as GoalStatus,
        targetDate: data.targetDate ? mapStringField(data.targetDate as string) : undefined,
        icon: data.icon ? mapStringField(data.icon as string) : undefined,
        color: data.color ? mapStringField(data.color as string) : undefined,
        createdAt: mapIsoDate(data.createdAt),
        updatedAt: mapIsoDate(data.updatedAt),
    }
}

export const subscribeSavingsGoals = (
    uid: string,
    callback: (goals: SavingsGoal[]) => void,
    onError?: (error: FirestoreError) => void,
): (() => void) => {
    const goalsQuery = query(
        collection(db, userSubcollectionPath(uid, collectionName)),
        orderBy('createdAt', 'desc'),
    )

    return onSnapshot(
        goalsQuery,
        (snapshot) => {
            callback(snapshot.docs.map((docSnapshot) => toSavingsGoal(docSnapshot.id, docSnapshot.data())))
        },
        (error) => {
            onError?.(error)
        },
    )
}

export type SavingsGoalInput = Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>

export const addSavingsGoal = async (uid: string, payload: SavingsGoalInput): Promise<string> => {
    const docRef = await addDoc(collection(db, userSubcollectionPath(uid, collectionName)), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
    return docRef.id
}

export const updateSavingsGoal = async (
    uid: string,
    goalId: string,
    payload: Partial<SavingsGoalInput>,
): Promise<void> => {
    await setDoc(
        doc(db, userSubcollectionPath(uid, collectionName), goalId),
        { ...payload, updatedAt: serverTimestamp() },
        { merge: true },
    )
}

export const deleteSavingsGoal = async (uid: string, goalId: string): Promise<void> => {
    await deleteDoc(doc(db, userSubcollectionPath(uid, collectionName), goalId))
}

export const contributeToGoal = async (
    uid: string,
    goalId: string,
    currentAmount: number,
    contribution: number,
): Promise<void> => {
    const newAmount = currentAmount + contribution
    await setDoc(
        doc(db, userSubcollectionPath(uid, collectionName), goalId),
        { currentAmount: newAmount, updatedAt: serverTimestamp() },
        { merge: true },
    )
}
