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
    <main className="auth-layout" style={{ background: 'transparent' }}>
      {/* Animated floating particles */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'color-mix(in srgb, var(--primary) 15%, transparent)', filter: 'blur(80px)', top: '10%', left: '5%', animation: 'aurora-drift-1 12s infinite alternate ease-in-out' }} />
        <div style={{ position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', background: 'color-mix(in srgb, var(--success) 12%, transparent)', filter: 'blur(80px)', bottom: '15%', right: '10%', animation: 'aurora-drift-2 14s infinite alternate-reverse ease-in-out' }} />
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'color-mix(in srgb, var(--primary) 8%, transparent)', filter: 'blur(60px)', top: '50%', right: '30%', animation: 'float 6s infinite ease-in-out' }} />
      </div>

      <section className="auth-card glass-panel" style={{ position: 'relative', zIndex: 1, animation: 'scale-pop 600ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
        <p className="kicker glow-text" style={{ animation: 'fade-up 400ms ease both 100ms' }}>Secure onboarding</p>
        <h1 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', animation: 'fade-up 400ms ease both 200ms' }}>
          <span style={{ color: 'var(--primary)' }}>Fin</span>Sage
        </h1>
        <p className="section-subtitle" style={{ animation: 'fade-up 400ms ease both 300ms' }}>
          Production-grade personal finance platform for budgets, transactions, reporting, and AI
          assistance.
        </p>

        <div className="auth-trust-grid" aria-label="Platform trust highlights" style={{ animation: 'fade-up 400ms ease both 400ms' }}>
          <article className="glass-panel" style={{ border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
            <small className="glow-text">🔒 Security</small>
            <strong>Firebase Auth</strong>
          </article>
          <article className="glass-panel" style={{ border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
            <small className="glow-text">🔄 Sync</small>
            <strong>Realtime Firestore</strong>
          </article>
          <article className="glass-panel" style={{ border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
            <small className="glow-text">✨ Insights</small>
            <strong>Gemini AI</strong>
          </article>
        </div>

        <div className="toggle-row" role="tablist" aria-label="Authentication mode" style={{ animation: 'fade-up 400ms ease both 500ms', display: 'flex', background: 'var(--bg-elevated)', borderRadius: '1rem', padding: '0.25rem' }}>
          <button
            className={mode === 'signin' ? 'primary-button' : 'ghost-button'}
            style={{ width: '50%', margin: 0 }}
            type="button"
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            className={mode === 'signup' ? 'primary-button' : 'ghost-button'}
            style={{ width: '50%', margin: 0 }}
            type="button"
            onClick={() => setMode('signup')}
          >
            Create account
          </button>
        </div>

        <form className="stack" onSubmit={(event) => void handleSubmit(event)} style={{ animation: 'fade-up 400ms ease both 600ms' }}>
          {mode === 'signup' ? (
            <label className="field" style={{ animation: 'fade-up 300ms ease both' }}>
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

          {error ? <p className="error-text" style={{ animation: 'fade-up 200ms ease both' }}>{error}</p> : null}

          <button className="primary-button" disabled={submitting} type="submit" style={{ marginTop: '0.5rem', width: '100%' }}>
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                Processing...
              </span>
            ) : (
              mode === 'signin' ? 'Sign in' : 'Create account'
            )}
          </button>
        </form>

        <div className="divider" style={{ animation: 'fade-up 400ms ease both 700ms' }}>or</div>

        <button
          className="secondary-button"
          disabled={submitting}
          type="button"
          style={{ width: '100%', animation: 'fade-up 400ms ease both 800ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          onClick={() => {
            void signInWithGoogle().catch((googleError) => {
              setError(googleError instanceof Error ? googleError.message : 'Google sign-in failed')
            })
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
          Continue with Google
        </button>

        <div className="auth-meta" style={{ animation: 'fade-up 400ms ease both 900ms' }}>
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
