import {
    addDoc,
    collection,
    limit as firestoreLimit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    type FirestoreError,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { mapIsoDate, mapNumberField, mapStringField } from '@/services/firestore/mappers'
import { spaceSubcollectionPath } from '@/services/firestore/paths'
import type { SpaceActivity } from '@/types/finance'

const SUB = 'activity'

const toActivity = (id: string, data: Record<string, unknown>): SpaceActivity => {
    const rawTarget = mapStringField(data.targetType, 'space')
    const validTargets = ['transaction', 'loan', 'reminder', 'member', 'category', 'space'] as const
    type Target = typeof validTargets[number]

    return {
        id,
        uid: mapStringField(data.uid),
        userName: mapStringField(data.userName, 'Someone'),
        action: mapStringField(data.action),
        targetType: validTargets.includes(rawTarget as Target) ? (rawTarget as Target) : 'space',
        targetId: data.targetId ? mapStringField(data.targetId) : undefined,
        amount: data.amount !== undefined ? mapNumberField(data.amount) : undefined,
        createdAt: mapIsoDate(data.createdAt),
    }
}

export const subscribeSpaceActivity = (
    spaceId: string,
    callback: (activities: SpaceActivity[]) => void,
    onError?: (error: FirestoreError) => void,
    limit = 30,
): (() => void) => {
    const q = query(
        collection(db, spaceSubcollectionPath(spaceId, SUB)),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit),
    )

    return onSnapshot(
        q,
        (snapshot) => {
            callback(snapshot.docs.map((d) => toActivity(d.id, d.data())))
        },
        (error) => onError?.(error),
    )
}

export type LogActivityInput = Omit<SpaceActivity, 'id' | 'createdAt'>

export const logActivity = async (
    spaceId: string,
    payload: LogActivityInput,
): Promise<void> => {
    await addDoc(collection(db, spaceSubcollectionPath(spaceId, SUB)), {
        ...payload,
        createdAt: serverTimestamp(),
    })
}
