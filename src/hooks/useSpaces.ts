import { useEffect, useState } from 'react'
import { subscribeUserSpaces } from '@/services/firestore/spaces'
import type { Space } from '@/types/finance'

interface UseSpacesResult {
    spaces: Space[]
    loading: boolean
    error: string | null
}

export const useSpaces = (uid: string | undefined): UseSpacesResult => {
    const [spaces, setSpaces] = useState<Space[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!uid) {
            setSpaces([])
            setLoading(false)
            setError(null)
            return
        }

        setLoading(true)
        setError(null)

        const unsubscribe = subscribeUserSpaces(
            uid,
            (nextSpaces) => {
                setSpaces(nextSpaces)
                setLoading(false)
            },
            (listenerError) => {
                setError(listenerError.message)
                setLoading(false)
            },
        )

        return unsubscribe
    }, [uid])

    return { spaces, loading, error }
}
