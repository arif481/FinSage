import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    type FirestoreError,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { mapIsoDate, mapStringArray, mapStringField } from '@/services/firestore/mappers'
import { spacePath } from '@/services/firestore/paths'
import type { Space, SpaceMember, SpaceRole } from '@/types/finance'

const COLLECTION = 'spaces'

const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'FS-'
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

const toMember = (raw: Record<string, unknown>): SpaceMember => ({
    uid: mapStringField(raw.uid),
    displayName: mapStringField(raw.displayName, 'User'),
    email: mapStringField(raw.email),
    role: (['owner', 'admin', 'member'].includes(mapStringField(raw.role))
        ? mapStringField(raw.role)
        : 'member') as SpaceRole,
    joinedAt: mapIsoDate(raw.joinedAt),
})

const toSpace = (id: string, data: Record<string, unknown>): Space => ({
    id,
    name: mapStringField(data.name, 'Untitled Space'),
    description: mapStringField(data.description),
    icon: mapStringField(data.icon, '🏠'),
    color: mapStringField(data.color, '#0ea5e9'),
    createdBy: mapStringField(data.createdBy),
    members: Array.isArray(data.members) ? data.members.map((m: Record<string, unknown>) => toMember(m)) : [],
    memberUids: mapStringArray(data.memberUids),
    inviteCode: mapStringField(data.inviteCode),
    createdAt: mapIsoDate(data.createdAt),
    updatedAt: mapIsoDate(data.updatedAt),
})

// ─── Subscribe to all spaces the user is a member of ───

export const subscribeUserSpaces = (
    uid: string,
    callback: (spaces: Space[]) => void,
    onError?: (error: FirestoreError) => void,
): (() => void) => {
    const q = query(
        collection(db, COLLECTION),
        where('memberUids', 'array-contains', uid),
        orderBy('createdAt', 'desc'),
    )

    return onSnapshot(
        q,
        (snapshot) => {
            callback(snapshot.docs.map((d) => toSpace(d.id, d.data())))
        },
        (error) => onError?.(error),
    )
}

// ─── Create a new space ───

export interface CreateSpaceInput {
    name: string
    description: string
    icon: string
    color: string
}

export const createSpace = async (
    uid: string,
    displayName: string,
    email: string,
    input: CreateSpaceInput,
): Promise<string> => {
    const member: SpaceMember = {
        uid,
        displayName,
        email,
        role: 'owner',
        joinedAt: new Date().toISOString(),
    }

    const docRef = await addDoc(collection(db, COLLECTION), {
        name: input.name,
        description: input.description,
        icon: input.icon,
        color: input.color,
        createdBy: uid,
        members: [member],
        memberUids: [uid],
        inviteCode: generateInviteCode(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })

    return docRef.id
}

// ─── Update space details ───

export const updateSpace = async (
    spaceId: string,
    payload: Partial<CreateSpaceInput>,
): Promise<void> => {
    await updateDoc(doc(db, spacePath(spaceId)), {
        ...payload,
        updatedAt: serverTimestamp(),
    })
}

// ─── Delete a space (owner only) ───

export const deleteSpace = async (spaceId: string): Promise<void> => {
    await deleteDoc(doc(db, spacePath(spaceId)))
}

// ─── Join space by invite code ───

export const joinSpaceByCode = async (
    uid: string,
    displayName: string,
    email: string,
    inviteCode: string,
): Promise<string | null> => {
    const q = query(collection(db, COLLECTION), where('inviteCode', '==', inviteCode.toUpperCase().trim()))
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const spaceDoc = snapshot.docs[0]
    const spaceData = spaceDoc.data()
    const existingUids: string[] = Array.isArray(spaceData.memberUids) ? spaceData.memberUids : []

    if (existingUids.includes(uid)) return spaceDoc.id // already a member

    const newMember: SpaceMember = {
        uid,
        displayName,
        email,
        role: 'member',
        joinedAt: new Date().toISOString(),
    }

    await updateDoc(doc(db, spacePath(spaceDoc.id)), {
        members: arrayUnion(newMember),
        memberUids: arrayUnion(uid),
        updatedAt: serverTimestamp(),
    })

    return spaceDoc.id
}

// ─── Leave space ───

export const leaveSpace = async (spaceId: string, uid: string, currentMembers: SpaceMember[]): Promise<void> => {
    const memberObj = currentMembers.find((m) => m.uid === uid)
    if (!memberObj) return

    await updateDoc(doc(db, spacePath(spaceId)), {
        members: arrayRemove(memberObj),
        memberUids: arrayRemove(uid),
        updatedAt: serverTimestamp(),
    })
}

// ─── Remove a member (admin/owner only) ───

export const removeMember = async (spaceId: string, targetUid: string, currentMembers: SpaceMember[]): Promise<void> => {
    const memberObj = currentMembers.find((m) => m.uid === targetUid)
    if (!memberObj) return

    await updateDoc(doc(db, spacePath(spaceId)), {
        members: arrayRemove(memberObj),
        memberUids: arrayRemove(targetUid),
        updatedAt: serverTimestamp(),
    })
}

// ─── Update member role ───

export const updateMemberRole = async (
    spaceId: string,
    targetUid: string,
    newRole: SpaceRole,
    currentMembers: SpaceMember[],
): Promise<void> => {
    const updated = currentMembers.map((m) =>
        m.uid === targetUid ? { ...m, role: newRole } : m,
    )

    await updateDoc(doc(db, spacePath(spaceId)), {
        members: updated,
        updatedAt: serverTimestamp(),
    })
}

// ─── Regenerate invite code ───

export const regenerateInviteCode = async (spaceId: string): Promise<string> => {
    const newCode = generateInviteCode()
    await updateDoc(doc(db, spacePath(spaceId)), {
        inviteCode: newCode,
        updatedAt: serverTimestamp(),
    })
    return newCode
}
