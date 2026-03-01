import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { updateUserPreferences } from '@/services/firestore/profile'

const currencyOptions = [
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
]

const tips = [
    '📊 Dashboard gives you a real-time financial overview',
    '🎯 Set savings goals to track progress toward milestones',
    '🔄 Use recurring rules to automate subscription tracking',
    '🔀 Split expenses with friends and settle up easily',
    '🤖 Ask the AI assistant anything about your finances',
    '⌘K opens the command palette for quick navigation',
]

interface OnboardingWizardProps {
    onComplete: () => void
}

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
    const { user } = useAuth()
    const [step, setStep] = useState(0)
    const [currency, setCurrency] = useState('USD')
    const [saving, setSaving] = useState(false)

    const handleFinish = async () => {
        if (!user) return
        setSaving(true)
        try {
            await updateUserPreferences(user.uid, {
                currency,
                onboardingComplete: true,
            })
            onComplete()
        } catch {
            // If save fails, still let them proceed
            onComplete()
        } finally {
            setSaving(false)
        }
    }

    const handleSkip = async () => {
        if (!user) return
        try {
            await updateUserPreferences(user.uid, { onboardingComplete: true })
        } catch { /* noop */ }
        onComplete()
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(10, 15, 25, 0.6)',
            animation: 'fade-in 0.3s ease forwards',
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '520px', borderRadius: '1.5rem',
                padding: '2.5rem', textAlign: 'center',
                boxShadow: 'var(--glow-primary)',
                animation: 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}>
                {step === 0 && (
                    <div style={{ animation: 'fade-up 300ms ease both' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👋</p>
                        <h2 style={{ margin: '0 0 0.5rem' }}>Welcome to FinSage</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                            Your premium personal finance companion. Let&apos;s set things up in under a minute.
                        </p>
                        <button className="primary-button" type="button" onClick={() => setStep(1)}
                            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}>
                            Get started →
                        </button>
                        <button type="button" onClick={() => void handleSkip()}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '1rem', fontSize: '0.85rem' }}>
                            Skip setup
                        </button>
                    </div>
                )}

                {step === 1 && (
                    <div style={{ animation: 'fade-up 300ms ease both' }}>
                        <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</p>
                        <h3 style={{ margin: '0 0 0.75rem' }}>Choose your currency</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            This will be used across all screens. You can change it later in Settings.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {currencyOptions.map((opt) => (
                                <button key={opt.code} type="button" onClick={() => setCurrency(opt.code)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.8rem 1rem', borderRadius: '0.75rem', cursor: 'pointer',
                                        border: currency === opt.code ? '2px solid var(--primary)' : '2px solid var(--border)',
                                        background: currency === opt.code ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'var(--bg-elevated)',
                                        color: 'var(--text)', transition: 'all 0.2s',
                                    }}>
                                    <span style={{ fontWeight: 500 }}>{opt.symbol} {opt.label}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{opt.code}</span>
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="secondary-button" type="button" onClick={() => setStep(0)} style={{ flex: 1 }}>
                                ← Back
                            </button>
                            <button className="primary-button" type="button" onClick={() => setStep(2)} style={{ flex: 2 }}>
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ animation: 'fade-up 300ms ease both' }}>
                        <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚀</p>
                        <h3 style={{ margin: '0 0 0.75rem' }}>You&apos;re all set!</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Here are some things you can do right away:
                        </p>
                        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                            {tips.map((tip, i) => (
                                <div key={tip} style={{
                                    padding: '0.5rem 0', borderBottom: i < tips.length - 1 ? '1px solid var(--border)' : 'none',
                                    fontSize: '0.9rem', animation: `fade-up 300ms ease both ${i * 60}ms`,
                                }}>
                                    {tip}
                                </div>
                            ))}
                        </div>
                        <button className="primary-button" type="button" onClick={() => void handleFinish()}
                            disabled={saving}
                            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}>
                            {saving ? 'Saving...' : 'Start using FinSage ✨'}
                        </button>
                    </div>
                )}

                {/* Step indicators */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                    {[0, 1, 2].map((s) => (
                        <div key={s} style={{
                            width: step === s ? '2rem' : '0.5rem', height: '0.5rem',
                            borderRadius: '0.25rem', transition: 'all 0.3s ease',
                            background: step >= s ? 'var(--primary)' : 'var(--border)',
                        }} />
                    ))}
                </div>
            </div>
        </div>
    )
}
