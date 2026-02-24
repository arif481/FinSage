import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { afterAll, beforeEach, describe, it } from 'vitest'

const projectId = 'demo-finsage'

const rules = readFileSync('firestore.rules', 'utf8')

const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: { rules },
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'users/alice'), {
      collaborators: ['bob'],
      displayName: 'Alice',
    })
  })
})

describe('firestore.rules', () => {
  it('allows owners to read and write their own profile', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore()

    await assertSucceeds(
      setDoc(doc(aliceDb, 'users/alice'), {
        collaborators: ['bob'],
        displayName: 'Alice Updated',
      }),
    )

    await assertSucceeds(getDoc(doc(aliceDb, 'users/alice')))
  })

  it('blocks non-collaborators from reading another user profile', async () => {
    const eveDb = testEnv.authenticatedContext('eve').firestore()

    await assertFails(getDoc(doc(eveDb, 'users/alice')))
  })

  it('allows collaborators to read shared transactions but not write categories', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore()
      await setDoc(doc(adminDb, 'users/alice/transactions/t1'), {
        amount: 12,
        categoryId: 'dining',
        date: '2026-02-20',
        description: 'Lunch',
        tags: ['food'],
        type: 'expense',
      })
    })

    const bobDb = testEnv.authenticatedContext('bob').firestore()

    await assertSucceeds(getDoc(doc(bobDb, 'users/alice/transactions/t1')))
    await assertFails(
      setDoc(doc(bobDb, 'users/alice/categories/new-category'), {
        name: 'New Category',
        icon: 'sparkles',
        color: '#123456',
      }),
    )
  })

  it('blocks unauthenticated access to user documents', async () => {
    const guestDb = testEnv.unauthenticatedContext().firestore()

    await assertFails(getDoc(doc(guestDb, 'users/alice')))
    await assertFails(
      setDoc(doc(guestDb, 'users/alice/transactions/tx2'), {
        amount: 10,
      }),
    )
  })
})
