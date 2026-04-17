export const userDocPath = (uid: string): string => `users/${uid}`
export const userSubcollectionPath = (uid: string, subcollection: string): string =>
  `${userDocPath(uid)}/${subcollection}`

export const spacePath = (spaceId: string): string => `spaces/${spaceId}`
export const spaceSubcollectionPath = (spaceId: string, subcollection: string): string =>
  `${spacePath(spaceId)}/${subcollection}`

