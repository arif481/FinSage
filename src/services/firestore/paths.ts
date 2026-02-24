export const userDocPath = (uid: string): string => `users/${uid}`
export const userSubcollectionPath = (uid: string, subcollection: string): string =>
  `${userDocPath(uid)}/${subcollection}`
