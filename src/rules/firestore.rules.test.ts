import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { afterAll, beforeEach, describe, it } from 'vitest'

const projectId = 'demo-finsage'
const rules = readFileSync('firestore.rules', 'utf8')

const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: { rules },
})

const now = new Date('2026-02-24T00:00:00.000Z')

const buildProfile = (displayName: string) => ({
  email: `${displayName.toLowerCase()}@example.com`,
  displayName,
  collaborators: ['bob'],
  preferences: {
    currency: 'USD',
    themeMode: 'light',
    highContrast: false,
    emailNotifications: true,
    pushNotifications: false,
  },
  createdAt: now,
  updatedAt: now,
})

const buildTransaction = () => ({
  amount: 12.5,
  categoryId: 'dining',
  date: '2026-02-20',
  description: 'Lunch',
  tags: ['food'],
  type: 'expense',
  createdAt: now,
  updatedAt: now,
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()

    await setDoc(doc(db, 'users/alice'), buildProfile('Alice'))
    await setDoc(doc(db, 'users/alice/transactions/t1'), buildTransaction())
  })
})

describe('firestore.rules', () => {
  it('allows owners to create their profile', async () => {
    const charlieDb = testEnv.authenticatedContext('charlie').firestore()

    await assertSucceeds(setDoc(doc(charlieDb, 'users/charlie'), buildProfile('Charlie')))
  })

  it('allows owners to update preferences via partial update', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore()

    await assertSucceeds(
      setDoc(
        doc(aliceDb, 'users/alice'),
        {
          preferences: {
            currency: 'EUR',
            themeMode: 'dark',
            highContrast: true,
            emailNotifications: false,
            pushNotifications: true,
          },
          updatedAt: new Date('2026-02-25T00:00:00.000Z'),
        },
        { merge: true },
      ),
    )
  })

  it('blocks owners from updating profile without updatedAt', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore()

    await assertFails(
      setDoc(
        doc(aliceDb, 'users/alice'),
        {
          preferences: {
            currency: 'EUR',
            themeMode: 'dark',
            highContrast: true,
            emailNotifications: false,
            pushNotifications: true,
          },
        },
        { merge: true },
      ),
    )
  })

  it('allows collaborators to read shared transactions but not write categories', async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore()

    await assertSucceeds(getDoc(doc(bobDb, 'users/alice/transactions/t1')))

    await assertFails(
      setDoc(doc(bobDb, 'users/alice/categories/new-category'), {
        name: 'New Category',
        icon: 'sparkles',
        color: '#123456',
        createdAt: now,
      }),
    )
  })

  it('allows owner to partially update transactions with updatedAt', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore()

    await assertSucceeds(
      setDoc(
        doc(aliceDb, 'users/alice/transactions/t1'),
        {
          description: 'Lunch with team',
          updatedAt: new Date('2026-02-25T00:00:00.000Z'),
        },
        { merge: true },
      ),
    )
  })

  it('blocks unauthenticated access to user documents', async () => {
    const guestDb = testEnv.unauthenticatedContext().firestore()

    await assertFails(getDoc(doc(guestDb, 'users/alice')))
    await assertFails(setDoc(doc(guestDb, 'users/alice/transactions/tx2'), buildTransaction()))
  })
})
