import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

interface QuickCreateOptions {
  enabled?: boolean
  scrollToId?: string
}

export const useQuickCreateParam = (
  target: string,
  onOpen: () => void,
  options: QuickCreateOptions = {},
) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const enabled = options.enabled ?? true
  const scrollToId = options.scrollToId

  useEffect(() => {
    if (!enabled || searchParams.get('new') !== target) {
      return
    }

    onOpen()

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('new')
    setSearchParams(nextParams, { replace: true })

    if (scrollToId) {
      window.requestAnimationFrame(() => {
        document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [enabled, onOpen, scrollToId, searchParams, setSearchParams, target])
}
