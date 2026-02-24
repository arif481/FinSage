import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export const AuthScreen = () => {
  const { signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password, displayName || 'FinSage user')
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="kicker">Secure onboarding</p>
        <h1>FinSage</h1>
        <p className="section-subtitle">
          Production-grade personal finance platform for budgets, transactions, reporting, and AI
          assistance.
        </p>

        <div className="auth-trust-grid" aria-label="Platform trust highlights">
          <article>
            <small>Security</small>
            <strong>Firebase Auth + Rules</strong>
          </article>
          <article>
            <small>Sync</small>
            <strong>Realtime Firestore</strong>
          </article>
          <article>
            <small>Insights</small>
            <strong>Gemini assistant</strong>
          </article>
        </div>

        <div className="toggle-row" role="tablist" aria-label="Authentication mode">
          <button
            className={mode === 'signin' ? 'primary-button' : 'ghost-button'}
            type="button"
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            className={mode === 'signup' ? 'primary-button' : 'ghost-button'}
            type="button"
            onClick={() => setMode('signup')}
          >
            Create account
          </button>
        </div>

        <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
          {mode === 'signup' ? (
            <label className="field">
              <span>Display name</span>
              <input
                required
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="primary-button" disabled={submitting} type="submit">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="divider">or</div>

        <button
          className="secondary-button"
          disabled={submitting}
          type="button"
          onClick={() => {
            void signInWithGoogle().catch((googleError) => {
              setError(googleError instanceof Error ? googleError.message : 'Google sign-in failed')
            })
          }}
        >
          Continue with Google
        </button>

        <div className="auth-meta">
          <span>Developed by Arif</span>
          <div className="auth-meta__links">
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/support">Support</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
