import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import {
    addSavingsGoal,
    contributeToGoal,
    deleteSavingsGoal,
    updateSavingsGoal,
    type SavingsGoalInput,
} from '@/services/firestore/savingsGoals'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { showToast } from '@/components/common/Toast'
import { GoalStatus, SavingsGoal } from '@/types/finance'
import { formatCurrency } from '@/utils/format'

const goalColors = ['#2f7f6d', '#3d5a80', '#ba4d37', '#6d597a', '#b08900', '#577590', '#2b9348', '#855928']
const goalIcons = ['🎯', '🏠', '✈️', '🚗', '💻', '📚', '🏥', '🎓', '🎉', '💍', '📱', '💰']

export const SavingsGoalsScreen = () => {
    const { user } = useAuth()
    const currency = useCurrency()
    const { error, loading, savingsGoals } = useFinanceCollections(user?.uid)
    const [showForm, setShowForm] = useState(false)
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [targetAmount, setTargetAmount] = useState('')
    const [targetDate, setTargetDate] = useState('')
    const [icon, setIcon] = useState('🎯')
    const [color, setColor] = useState(goalColors[0])

    // Contribute form
    const [contributingGoalId, setContributingGoalId] = useState<string | null>(null)
    const [contributionAmount, setContributionAmount] = useState('')

    if (loading) {
        return <LoadingScreen label="Loading savings goals..." />
    }

    const resetForm = () => {
        setName('')
        setTargetAmount('')
        setTargetDate('')
        setIcon('🎯')
        setColor(goalColors[0])
        setEditingGoal(null)
        setShowForm(false)
    }

    const openEdit = (goal: SavingsGoal) => {
        setName(goal.name)
        setTargetAmount(String(goal.targetAmount))
        setTargetDate(goal.targetDate ?? '')
        setIcon(goal.icon ?? '🎯')
        setColor(goal.color ?? goalColors[0])
        setEditingGoal(goal)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !name.trim() || !targetAmount) return

        setSaving(true)
        try {
            const payload: SavingsGoalInput = {
                name: name.trim(),
                targetAmount: Math.abs(parseFloat(targetAmount)),
                currentAmount: editingGoal?.currentAmount ?? 0,
                status: editingGoal?.status ?? 'active',
                targetDate: targetDate || undefined,
                icon,
                color,
            }

            if (editingGoal) {
                await updateSavingsGoal(user.uid, editingGoal.id, payload)
                showToast('Goal updated successfully.', 'success')
            } else {
                await addSavingsGoal(user.uid, payload)
                showToast('Goal created successfully!', 'success')
            }
            resetForm()
        } catch {
            showToast('Failed to save goal.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleContribute = async (goalId: string, currentAmount: number) => {
        if (!user || !contributionAmount) return

        setSaving(true)
        try {
            const amount = Math.abs(parseFloat(contributionAmount))
            await contributeToGoal(user.uid, goalId, currentAmount, amount)
            showToast(`Added ${formatCurrency(amount, currency)} to goal!`, 'success')
            setContributingGoalId(null)
            setContributionAmount('')
        } catch {
            showToast('Failed to add funds.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleStatusChange = async (goalId: string, status: GoalStatus) => {
        if (!user) return
        try {
            await updateSavingsGoal(user.uid, goalId, { status })
            showToast(`Goal ${status === 'completed' ? 'completed! 🎉' : status}.`, 'success')
        } catch {
            showToast('Failed to update status.', 'error')
        }
    }

    const handleDelete = async (goalId: string) => {
        if (!user) return
        try {
            await deleteSavingsGoal(user.uid, goalId)
            showToast('Goal deleted.', 'success')
        } catch {
            showToast('Failed to delete.', 'error')
        }
    }

    const activeGoals = savingsGoals.filter((g) => g.status === 'active')
    const completedGoals = savingsGoals.filter((g) => g.status === 'completed')
    const pausedGoals = savingsGoals.filter((g) => g.status === 'paused')
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0)
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0)
    const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

    const insightData = [
        { label: 'Active goals', value: String(activeGoals.length) },
        { label: 'Total target', value: formatCurrency(totalTarget, currency) },
        { label: 'Total saved', value: formatCurrency(totalSaved, currency) },
        { label: 'Overall progress', value: `${overallProgress}%` },
    ]

    const getProjectedDate = (goal: SavingsGoal): string => {
        if (goal.currentAmount >= goal.targetAmount) return 'Completed!'
        if (goal.currentAmount <= 0) return 'Start saving'

        const remaining = goal.targetAmount - goal.currentAmount
        const created = goal.createdAt ? new Date(goal.createdAt) : new Date()
        const daysSinceCreated = Math.max(1, (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
        const dailyRate = goal.currentAmount / daysSinceCreated
        if (dailyRate <= 0) return 'Start saving'
        const daysToGoal = remaining / dailyRate
        const projectedDate = new Date(Date.now() + daysToGoal * 24 * 60 * 60 * 1000)
        return projectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }

    return (
        <main className="screen stack">
            {error ? <p className="error-text">Data access error: {error}.</p> : null}

            <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
                <div>
                    <h2>Savings Goals</h2>
                    <p className="section-subtitle">
                        Set targets, track progress, and watch your savings grow.
                    </p>
                </div>
                <button className="primary-button" type="button" onClick={() => { resetForm(); setShowForm(true) }}>
                    + New goal
                </button>
            </header>

            <section className="insight-strip">
                {insightData.map((item, i) => (
                    <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                    </article>
                ))}
            </section>

            {/* Overall progress bar */}
            {activeGoals.length > 0 && (
                <section className="card" style={{ '--stagger': 0 } as React.CSSProperties}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>Overall progress</span>
                        <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(totalSaved, currency)} / {formatCurrency(totalTarget, currency)}</span>
                    </div>
                    <div style={{ height: '12px', borderRadius: '6px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.min(overallProgress, 100)}%`,
                            borderRadius: '6px',
                            background: overallProgress >= 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), var(--accent, var(--primary)))',
                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        }} />
                    </div>
                </section>
            )}

            {/* Create / Edit form */}
            {showForm && (
                <section className="card stack" style={{ '--stagger': 1, animation: 'fade-up 400ms ease both' } as React.CSSProperties}>
                    <h3>{editingGoal ? '✏️ Edit goal' : '🎯 New savings goal'}</h3>
                    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="field">
                            <span>Goal name</span>
                            <input type="text" placeholder="e.g. Emergency fund" value={name} onChange={(e) => setName(e.target.value)} required />
                        </label>

                        <div className="field-row">
                            <label className="field">
                                <span>Target amount</span>
                                <input type="number" placeholder="5000" min="1" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
                            </label>

                            <label className="field">
                                <span>Target date (optional)</span>
                                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                            </label>
                        </div>

                        <div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Icon</span>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {goalIcons.map((ic) => (
                                    <button key={ic} type="button" onClick={() => setIcon(ic)}
                                        style={{
                                            fontSize: '1.4rem', padding: '0.4rem', borderRadius: '0.5rem', cursor: 'pointer',
                                            background: icon === ic ? 'var(--primary)' : 'var(--bg-elevated)',
                                            border: icon === ic ? '2px solid var(--primary)' : '2px solid transparent',
                                            transition: 'all 0.2s',
                                        }}>
                                        {ic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Color</span>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {goalColors.map((c) => (
                                    <button key={c} type="button" onClick={() => setColor(c)}
                                        style={{
                                            width: '2rem', height: '2rem', borderRadius: '50%', cursor: 'pointer',
                                            background: c, border: color === c ? '3px solid var(--text)' : '3px solid transparent',
                                            transition: 'all 0.2s',
                                        }} />
                                ))}
                            </div>
                        </div>

                        <div className="button-row">
                            <button className="primary-button" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : editingGoal ? 'Update goal' : 'Create goal'}
                            </button>
                            <button className="secondary-button" type="button" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* Active goals */}
            {activeGoals.length > 0 && (
                <section className="stack" style={{ gap: '1rem' }}>
                    <h3 style={{ animation: 'fade-up 400ms ease both' }}>🟢 Active goals</h3>
                    {activeGoals.map((goal, i) => {
                        const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0
                        const isContributing = contributingGoalId === goal.id
                        return (
                            <article key={goal.id} className="card" style={{ '--stagger': i + 2, borderLeft: `4px solid ${goal.color ?? 'var(--primary)'}` } as React.CSSProperties}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                            <span>{goal.icon ?? '🎯'}</span>
                                            {goal.name}
                                        </h4>
                                        {goal.targetDate && (
                                            <small style={{ color: 'var(--text-muted)' }}>
                                                Target: {new Date(goal.targetDate).toLocaleDateString()} • Projected: {getProjectedDate(goal)}
                                            </small>
                                        )}
                                        {!goal.targetDate && (
                                            <small style={{ color: 'var(--text-muted)' }}>Projected completion: {getProjectedDate(goal)}</small>
                                        )}
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: pct >= 100 ? 'var(--success)' : 'var(--text)' }}>{pct}%</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <span>{formatCurrency(goal.currentAmount, currency)}</span>
                                    <span>{formatCurrency(goal.targetAmount, currency)}</span>
                                </div>
                                <div style={{ height: '10px', borderRadius: '5px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min(pct, 100)}%`,
                                        borderRadius: '5px',
                                        background: pct >= 100 ? 'var(--success)' : (goal.color ?? 'var(--primary)'),
                                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }} />
                                </div>

                                {isContributing && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', animation: 'fade-up 300ms ease both' }}>
                                        <input type="number" placeholder="Amount" min="0.01" step="0.01" value={contributionAmount}
                                            onChange={(e) => setContributionAmount(e.target.value)}
                                            style={{ flex: 1 }} />
                                        <button className="primary-button" type="button" disabled={saving || !contributionAmount}
                                            onClick={() => void handleContribute(goal.id, goal.currentAmount)}>
                                            Add
                                        </button>
                                        <button className="secondary-button" type="button"
                                            onClick={() => { setContributingGoalId(null); setContributionAmount('') }}>
                                            ✕
                                        </button>
                                    </div>
                                )}

                                <div className="button-row" style={{ marginTop: '0.75rem' }}>
                                    {!isContributing && (
                                        <button className="primary-button" type="button" style={{ fontSize: '0.85rem' }}
                                            onClick={() => { setContributingGoalId(goal.id); setContributionAmount('') }}>
                                            💰 Contribute
                                        </button>
                                    )}
                                    {pct >= 100 && (
                                        <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                            onClick={() => void handleStatusChange(goal.id, 'completed')}>
                                            ✅ Mark complete
                                        </button>
                                    )}
                                    <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                        onClick={() => void handleStatusChange(goal.id, 'paused')}>⏸ Pause</button>
                                    <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                        onClick={() => openEdit(goal)}>✏️ Edit</button>
                                    <button className="secondary-button" type="button" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}
                                        onClick={() => void handleDelete(goal.id)}>🗑</button>
                                </div>
                            </article>
                        )
                    })}
                </section>
            )}

            {/* Paused goals */}
            {pausedGoals.length > 0 && (
                <section className="stack" style={{ gap: '1rem' }}>
                    <h3>⏸ Paused goals</h3>
                    {pausedGoals.map((goal) => (
                        <article key={goal.id} className="card" style={{ opacity: 0.7, borderLeft: `4px solid var(--text-muted)` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0 }}>{goal.icon ?? '🎯'} {goal.name}</h4>
                                <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}</span>
                            </div>
                            <div className="button-row" style={{ marginTop: '0.5rem' }}>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                    onClick={() => void handleStatusChange(goal.id, 'active')}>▶ Resume</button>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}
                                    onClick={() => void handleDelete(goal.id)}>🗑 Delete</button>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {/* Completed goals */}
            {completedGoals.length > 0 && (
                <section className="stack" style={{ gap: '1rem' }}>
                    <h3>🏅 Completed goals</h3>
                    {completedGoals.map((goal) => (
                        <article key={goal.id} className="card" style={{ borderLeft: `4px solid var(--success)` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0 }}>{goal.icon ?? '🎯'} {goal.name} 🎉</h4>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(goal.targetAmount, currency)}</span>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {savingsGoals.length === 0 && !showForm && (
                <section className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎯</p>
                    <h3>No savings goals yet</h3>
                    <p className="section-subtitle">Create your first goal to start tracking your progress toward financial milestones.</p>
                    <button className="primary-button" type="button" onClick={() => setShowForm(true)} style={{ marginTop: '1rem' }}>
                        Create your first goal
                    </button>
                </section>
            )}
        </main>
    )
}
