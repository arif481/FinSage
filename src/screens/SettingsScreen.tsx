import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useUserProfile } from '@/hooks/useUserProfile'
import { DEFAULT_PREFERENCES, updateUserPreferences } from '@/services/firestore/profile'
import { UserPreferences } from '@/types/finance'

const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'JPY']

export const SettingsScreen = () => {
  const { user } = useAuth()
  const { profile } = useUserProfile(user?.uid)
  const { highContrast, themeMode, toggleHighContrast, toggleThemeMode } = useTheme()
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [status, setStatus] = useState<string | null>(null)

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

    await updateUserPreferences(user.uid, {
      ...preferences,
      highContrast,
      themeMode,
    })
    setStatus('Preferences saved.')
  }

  return (
    <main className="screen stack">
      <header className="screen-header">
        <div>
          <h2>Settings</h2>
          <p className="section-subtitle">Personalize your experience and notification preferences.</p>
        </div>
      </header>

      <section className="card stack">
        <h3>Appearance</h3>

        <div className="field-row">
          <div className="field field--button">
            <span>Theme mode</span>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                toggleThemeMode()
                setPreferences((current) => ({
                  ...current,
                  themeMode: themeMode === 'light' ? 'dark' : 'light',
                }))
              }}
            >
              Switch to {themeMode === 'light' ? 'dark' : 'light'} mode
            </button>
          </div>

          <div className="field field--button">
            <span>High contrast</span>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                toggleHighContrast()
                setPreferences((current) => ({
                  ...current,
                  highContrast: !highContrast,
                }))
              }}
            >
              {highContrast ? 'Disable' : 'Enable'} high contrast
            </button>
          </div>
        </div>
      </section>

      <section className="card stack">
        <h3>Preferences</h3>

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

        <label className="checkbox-field">
          <input
            checked={preferences.emailNotifications}
            type="checkbox"
            onChange={(event) => {
              setPreferences((current) => ({
                ...current,
                emailNotifications: event.target.checked,
              }))
            }}
          />
          <span>Email notifications</span>
        </label>

        <label className="checkbox-field">
          <input
            checked={preferences.pushNotifications}
            type="checkbox"
            onChange={(event) => {
              setPreferences((current) => ({
                ...current,
                pushNotifications: event.target.checked,
              }))
            }}
          />
          <span>Push notifications</span>
        </label>

        <button className="primary-button" type="button" onClick={() => void savePreferences()}>
          Save settings
        </button>

        {status ? <p className="success-text">{status}</p> : null}
      </section>

      <section className="card stack">
        <h3>Product and support</h3>
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
