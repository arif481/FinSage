import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { mapIsoDate, mapStringField } from '@/services/firestore/mappers'
import { userSubcollectionPath } from '@/services/firestore/paths'
import { ChatMessage } from '@/types/finance'

const collectionName = 'chatHistory'

const toChatMessage = (id: string, data: Record<string, unknown>): ChatMessage => {
  const rawRole = mapStringField(data.role, 'assistant')

  return {
    id,
    role: rawRole === 'user' ? 'user' : 'assistant',
    content: mapStringField(data.content),
    timestamp: mapIsoDate(data.timestamp),
  }
}

export const subscribeChatHistory = (
  uid: string,
  callback: (messages: ChatMessage[]) => void,
): (() => void) => {
  const chatQuery = query(
    collection(db, userSubcollectionPath(uid, collectionName)),
    orderBy('timestamp', 'asc'),
  )

  return onSnapshot(chatQuery, (snapshot) => {
    callback(snapshot.docs.map((docSnapshot) => toChatMessage(docSnapshot.id, docSnapshot.data())))
  })
}

export const addChatMessage = async (
  uid: string,
  payload: Omit<ChatMessage, 'id' | 'timestamp'>,
): Promise<void> => {
  await addDoc(collection(db, userSubcollectionPath(uid, collectionName)), {
    role: payload.role,
    content: payload.content,
    timestamp: serverTimestamp(),
  })
}
