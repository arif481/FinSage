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
    mapStringArray,
    mapStringField,
} from '@/services/firestore/mappers'
import { spaceSubcollectionPath } from '@/services/firestore/paths'
import type { SpaceReminder } from '@/types/finance'

const SUB = 'reminders'

const toReminder = (id: string, data: Record<string, unknown>): SpaceReminder => {
    const rawFreq = mapStringField(data.recurringFrequency, 'once')
    const validFreqs = ['once', 'daily', 'weekly', 'monthly'] as const
    type Freq = typeof validFreqs[number]

    return {
        id,
        title: mapStringField(data.title),
        description: mapStringField(data.description),
        dueDate: mapIsoDate(data.dueDate),
        recurringFrequency: validFreqs.includes(rawFreq as Freq) ? (rawFreq as Freq) : 'once',
        linkedLoanId: data.linkedLoanId ? mapStringField(data.linkedLoanId) : undefined,
        linkedTransactionId: data.linkedTransactionId ? mapStringField(data.linkedTransactionId) : undefined,
        assignedTo: mapStringArray(data.assignedTo),
        isDismissed: Boolean(data.isDismissed),
        createdBy: mapStringField(data.createdBy),
        createdAt: mapIsoDate(data.createdAt),
    }
}

export const subscribeSpaceReminders = (
    spaceId: string,
    callback: (reminders: SpaceReminder[]) => void,
    onError?: (error: FirestoreError) => void,
): (() => void) => {
    const q = query(
        collection(db, spaceSubcollectionPath(spaceId, SUB)),
        orderBy('dueDate', 'asc'),
    )

    return onSnapshot(
        q,
        (snapshot) => {
            callback(snapshot.docs.map((d) => toReminder(d.id, d.data())))
        },
        (error) => onError?.(error),
    )
}

export type SpaceReminderInput = Omit<SpaceReminder, 'id' | 'createdAt'>

export const addSpaceReminder = async (
    spaceId: string,
    payload: SpaceReminderInput,
): Promise<string> => {
    const docRef = await addDoc(collection(db, spaceSubcollectionPath(spaceId, SUB)), {
        ...payload,
        createdAt: serverTimestamp(),
    })
    return docRef.id
}

export const dismissReminder = async (
    spaceId: string,
    reminderId: string,
): Promise<void> => {
    await setDoc(
        doc(db, spaceSubcollectionPath(spaceId, SUB), reminderId),
        { isDismissed: true },
        { merge: true },
    )
}

export const deleteSpaceReminder = async (
    spaceId: string,
    reminderId: string,
): Promise<void> => {
    await deleteDoc(doc(db, spaceSubcollectionPath(spaceId, SUB), reminderId))
}
