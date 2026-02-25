import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useUserProfile } from '@/hooks/useUserProfile'
import { DEFAULT_PREFERENCES, updateUserPreferences } from '@/services/firestore/profile'
import { UserPreferences } from '@/types/finance'
import { ToggleSwitch } from '@/components/common/ToggleSwitch'
import { showToast } from '@/components/common/Toast'

const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'JPY']

export const SettingsScreen = () => {
  const { user } = useAuth()
  const { profile } = useUserProfile(user?.uid)
  const { highContrast, themeMode, toggleHighContrast, toggleThemeMode } = useTheme()
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    if (!profile) {
      return
    }

    setPreferences(profile.preferences)
  }, [profile])

  const savePreferences = async () => {
    if (!user) {
      return
    }

    try {
      await updateUserPreferences(user.uid, {
        ...preferences,
        highContrast,
        themeMode,
      })
      showToast('Preferences saved successfully.', 'success')
    } catch (saveError) {
      showToast(saveError instanceof Error ? saveError.message : 'Unable to save preferences.', 'error')
    }
  }

  const insightData = [
    { label: 'Signed in as', value: user?.email ?? 'Unknown user' },
    { label: 'Theme mode', value: themeMode === 'dark' ? '🌙 Dark' : '☀️ Light' },
    { label: 'High contrast', value: highContrast ? '✅ Enabled' : '❌ Disabled' },
    { label: 'Currency', value: preferences.currency },
  ]

  return (
    <main className="screen stack">
      <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
        <div>
          <h2>Settings</h2>
          <p className="section-subtitle">
            Personalize your experience and notification preferences.
          </p>
        </div>
      </header>

      <section className="insight-strip">
        {insightData.map((item, i) => (
          <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
            <small>{item.label}</small>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="card stack" style={{ '--stagger': 1 } as React.CSSProperties}>
        <h3>⚙️ Appearance</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ToggleSwitch
            checked={themeMode === 'dark'}
            label={`Dark mode ${themeMode === 'dark' ? '(active)' : ''}`}
            onChange={() => {
              toggleThemeMode()
              setPreferences((current) => ({
                ...current,
                themeMode: themeMode === 'light' ? 'dark' : 'light',
              }))
            }}
          />

          <ToggleSwitch
            checked={highContrast}
            label={`High contrast ${highContrast ? '(active)' : ''}`}
            onChange={() => {
              toggleHighContrast()
              setPreferences((current) => ({
                ...current,
                highContrast: !highContrast,
              }))
            }}
          />
        </div>
      </section>

      <section className="card stack" style={{ '--stagger': 2 } as React.CSSProperties}>
        <h3>🔔 Preferences</h3>

        <label className="field">
          <span>Currency</span>
          <select
            value={preferences.currency}
            onChange={(event) => {
              setPreferences((current) => ({
                ...current,
                currency: event.target.value,
              }))
            }}
          >
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

        <ToggleSwitch
          checked={preferences.emailNotifications}
          label="Email notifications"
          onChange={() => {
            setPreferences((current) => ({
              ...current,
              emailNotifications: !current.emailNotifications,
            }))
          }}
        />

        <ToggleSwitch
          checked={preferences.pushNotifications}
          label="Push notifications"
          onChange={() => {
            setPreferences((current) => ({
              ...current,
              pushNotifications: !current.pushNotifications,
            }))
          }}
        />

        <button className="primary-button" type="button" onClick={() => void savePreferences()}>
          Save settings
        </button>
      </section>

      <section className="card stack" style={{ '--stagger': 3 } as React.CSSProperties}>
        <h3>📦 Product and support</h3>
        <p className="section-subtitle">FinSage is developed and maintained by Arif.</p>
        <div className="button-row">
          <Link className="secondary-button" to="/about">
            About FinSage
          </Link>
          <Link className="secondary-button" to="/privacy">
            Privacy policy
          </Link>
          <Link className="secondary-button" to="/support">
            Support
          </Link>
        </div>
      </section>
    </main>
  )
}
