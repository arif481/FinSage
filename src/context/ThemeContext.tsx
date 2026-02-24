import { ReactNode, createContext, useEffect, useMemo, useState } from 'react'

interface ThemeContextValue {
  highContrast: boolean
  themeMode: 'light' | 'dark'
  setThemeMode: (mode: 'light' | 'dark') => void
  toggleThemeMode: () => void
  toggleHighContrast: () => void
}

const STORAGE_KEY = 'finsage-theme'

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface StoredTheme {
  highContrast: boolean
  themeMode: 'light' | 'dark'
}

const getInitialTheme = (): StoredTheme => {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {
      highContrast: false,
      themeMode: 'light',
    }
  }

  try {
    const parsed = JSON.parse(raw) as StoredTheme

    return {
      highContrast: Boolean(parsed.highContrast),
      themeMode: parsed.themeMode === 'dark' ? 'dark' : 'light',
    }
  } catch {
    return {
      highContrast: false,
      themeMode: 'light',
    }
  }
}

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const initialTheme = getInitialTheme()
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(initialTheme.themeMode)
  const [highContrast, setHighContrast] = useState(initialTheme.highContrast)

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
    document.documentElement.dataset.contrast = highContrast ? 'high' : 'default'

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        highContrast,
        themeMode,
      } satisfies StoredTheme),
    )
  }, [themeMode, highContrast])

  const value = useMemo<ThemeContextValue>(
    () => ({
      highContrast,
      themeMode,
      setThemeMode,
      toggleThemeMode: () => {
        setThemeMode((current) => (current === 'light' ? 'dark' : 'light'))
      },
      toggleHighContrast: () => {
        setHighContrast((current) => !current)
      },
    }),
    [highContrast, themeMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
