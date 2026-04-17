import { useEffect, useState } from 'react'
import { subscribeSpaceTransactions } from '@/services/firestore/spaceTransactions'
import { subscribeSpaceLoans } from '@/services/firestore/spaceLoans'
import { subscribeSpaceReminders } from '@/services/firestore/spaceReminders'
import { subscribeSpaceCategories } from '@/services/firestore/spaceCategories'
import { subscribeSpaceActivity } from '@/services/firestore/spaceActivity'
import type {
    SpaceActivity,
    SpaceCategory,
    SpaceLoan,
    SpaceReminder,
    SpaceTransaction,
} from '@/types/finance'

interface UseSpaceCollectionsResult {
    transactions: SpaceTransaction[]
    loans: SpaceLoan[]
    reminders: SpaceReminder[]
    categories: SpaceCategory[]
    activities: SpaceActivity[]
    loading: boolean
    error: string | null
}

export const useSpaceCollections = (spaceId: string | undefined): UseSpaceCollectionsResult => {
    const [transactions, setTransactions] = useState<SpaceTransaction[]>([])
    const [loans, setLoans] = useState<SpaceLoan[]>([])
    const [reminders, setReminders] = useState<SpaceReminder[]>([])
    const [categories, setCategories] = useState<SpaceCategory[]>([])
    const [activities, setActivities] = useState<SpaceActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!spaceId) {
            setTransactions([])
            setLoans([])
            setReminders([])
            setCategories([])
            setActivities([])
            setLoading(false)
            setError(null)
            return
        }

        setLoading(true)
        setError(null)

        let txReady = false
        let loansReady = false
        let remindersReady = false
        let categoriesReady = false
        let activityReady = false

        const markReady = () => {
            if (txReady && loansReady && remindersReady && categoriesReady && activityReady) {
                setLoading(false)
            }
        }

        const onErr = (msg: string) => {
            setError(msg)
            setLoading(false)
        }

        const unsub1 = subscribeSpaceTransactions(
            spaceId,
            (data) => { setTransactions(data); txReady = true; markReady() },
            (e) => onErr(e.message),
        )

        const unsub2 = subscribeSpaceLoans(
            spaceId,
            (data) => { setLoans(data); loansReady = true; markReady() },
            (e) => onErr(e.message),
        )

        const unsub3 = subscribeSpaceReminders(
            spaceId,
            (data) => { setReminders(data); remindersReady = true; markReady() },
            (e) => onErr(e.message),
        )

        const unsub4 = subscribeSpaceCategories(
            spaceId,
            (data) => { setCategories(data); categoriesReady = true; markReady() },
            (e) => onErr(e.message),
        )

        const unsub5 = subscribeSpaceActivity(
            spaceId,
            (data) => { setActivities(data); activityReady = true; markReady() },
            (e) => onErr(e.message),
        )

        return () => {
            unsub1()
            unsub2()
            unsub3()
            unsub4()
            unsub5()
        }
    }, [spaceId])

    return { transactions, loans, reminders, categories, activities, loading, error }
}
