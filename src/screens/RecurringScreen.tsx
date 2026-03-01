import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import {
    addRecurringRule,
    deleteRecurringRule,
    toggleRecurringRule,
    updateRecurringRule,
    type RecurringRuleInput,
} from '@/services/firestore/recurringRules'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { showToast } from '@/components/common/Toast'
import { RecurringRule, TransactionType } from '@/types/finance'
import { formatCurrency, formatDate } from '@/utils/format'

export const RecurringScreen = () => {
    const { user } = useAuth()
    const currency = useCurrency()
    const { categories, error, loading, recurringRules } = useFinanceCollections(user?.uid)
    const [showForm, setShowForm] = useState(false)
    const [editingRule, setEditingRule] = useState<RecurringRule | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState<TransactionType>('expense')
    const [categoryId, setCategoryId] = useState('other')
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
    const [nextRun, setNextRun] = useState(new Date().toISOString().slice(0, 10))

    if (loading) {
        return <LoadingScreen label="Loading recurring rules..." />
    }

    const resetForm = () => {
        setDescription('')
        setAmount('')
        setType('expense')
        setCategoryId('other')
        setFrequency('monthly')
        setNextRun(new Date().toISOString().slice(0, 10))
        setEditingRule(null)
        setShowForm(false)
    }

    const openEdit = (rule: RecurringRule) => {
        setDescription(rule.description)
        setAmount(String(rule.amount))
        setType(rule.type)
        setCategoryId(rule.categoryId)
        setFrequency(rule.frequency)
        setNextRun(rule.nextRun.slice(0, 10))
        setEditingRule(rule)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !description.trim() || !amount) return

        setSaving(true)
        try {
            const payload: RecurringRuleInput = {
                description: description.trim(),
                amount: Math.abs(parseFloat(amount)),
                type,
                categoryId,
                frequency,
                nextRun,
                active: editingRule?.active ?? true,
            }

            if (editingRule) {
                await updateRecurringRule(user.uid, editingRule.id, payload)
                showToast('Rule updated.', 'success')
            } else {
                await addRecurringRule(user.uid, payload)
                showToast('Recurring rule created!', 'success')
            }
            resetForm()
        } catch {
            showToast('Failed to save rule.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleToggle = async (ruleId: string, active: boolean) => {
        if (!user) return
        try {
            await toggleRecurringRule(user.uid, ruleId, !active)
            showToast(active ? 'Rule paused.' : 'Rule activated!', 'success')
        } catch {
            showToast('Failed to toggle.', 'error')
        }
    }

    const handleDelete = async (ruleId: string) => {
        if (!user) return
        try {
            await deleteRecurringRule(user.uid, ruleId)
            showToast('Rule deleted.', 'success')
        } catch {
            showToast('Failed to delete.', 'error')
        }
    }

    const activeRules = recurringRules.filter((r) => r.active)
    const pausedRules = recurringRules.filter((r) => !r.active)
    const totalMonthlyExpense = activeRules
        .filter((r) => r.type === 'expense')
        .reduce((sum, r) => {
            if (r.frequency === 'daily') return sum + r.amount * 30
            if (r.frequency === 'weekly') return sum + r.amount * 4.33
            return sum + r.amount
        }, 0)
    const totalMonthlyIncome = activeRules
        .filter((r) => r.type === 'income')
        .reduce((sum, r) => {
            if (r.frequency === 'daily') return sum + r.amount * 30
            if (r.frequency === 'weekly') return sum + r.amount * 4.33
            return sum + r.amount
        }, 0)

    const upcomingRules = [...activeRules].sort((a, b) => a.nextRun.localeCompare(b.nextRun)).slice(0, 5)

    const frequencyLabel = (f: string) => f === 'daily' ? 'Daily' : f === 'weekly' ? 'Weekly' : 'Monthly'

    const insightData = [
        { label: 'Active rules', value: String(activeRules.length) },
        { label: 'Monthly expense', value: formatCurrency(Math.round(totalMonthlyExpense), currency) },
        { label: 'Monthly income', value: formatCurrency(Math.round(totalMonthlyIncome), currency) },
        { label: 'Net recurring', value: formatCurrency(Math.round(totalMonthlyIncome - totalMonthlyExpense), currency) },
    ]

    const getCategoryName = (catId: string) => categories.find((c) => c.id === catId)?.name ?? catId

    return (
        <main className="screen stack">
            {error ? <p className="error-text">Data access error: {error}.</p> : null}

            <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
                <div>
                    <h2>Recurring Transactions</h2>
                    <p className="section-subtitle">
                        Automate repeating income and expenses.
                    </p>
                </div>
                <button className="primary-button" type="button" onClick={() => { resetForm(); setShowForm(true) }}>
                    + New rule
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

            {/* Form */}
            {showForm && (
                <section className="card stack" style={{ '--stagger': 1, animation: 'fade-up 400ms ease both' } as React.CSSProperties}>
                    <h3>{editingRule ? '✏️ Edit rule' : '🔄 New recurring rule'}</h3>
                    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="field">
                            <span>Description</span>
                            <input type="text" placeholder="e.g. Netflix subscription" value={description} onChange={(e) => setDescription(e.target.value)} required />
                        </label>

                        <div className="field-row">
                            <label className="field">
                                <span>Amount</span>
                                <input type="number" placeholder="15.99" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                            </label>

                            <label className="field">
                                <span>Type</span>
                                <select value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </label>
                        </div>

                        <div className="field-row">
                            <label className="field">
                                <span>Category</span>
                                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="field">
                                <span>Frequency</span>
                                <select value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringRule['frequency'])}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </label>
                        </div>

                        <label className="field">
                            <span>Next run date</span>
                            <input type="date" value={nextRun} onChange={(e) => setNextRun(e.target.value)} required />
                        </label>

                        <div className="button-row">
                            <button className="primary-button" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : editingRule ? 'Update' : 'Create rule'}
                            </button>
                            <button className="secondary-button" type="button" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* Upcoming */}
            {upcomingRules.length > 0 && (
                <section className="card stack" style={{ '--stagger': 0 } as React.CSSProperties}>
                    <h3>📅 Upcoming</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {upcomingRules.map((rule) => (
                            <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <span style={{ fontWeight: 500 }}>{rule.description}</span>
                                    <small style={{ display: 'block', color: 'var(--text-muted)' }}>{frequencyLabel(rule.frequency)} • {getCategoryName(rule.categoryId)}</small>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontWeight: 600, color: rule.type === 'income' ? 'var(--success)' : 'var(--text)' }}>
                                        {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount, currency)}
                                    </span>
                                    <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                                        {formatDate(rule.nextRun)}
                                    </small>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Active rules */}
            {activeRules.length > 0 && (
                <section className="stack" style={{ gap: '1rem' }}>
                    <h3 style={{ animation: 'fade-up 400ms ease both' }}>🟢 Active rules</h3>
                    {activeRules.map((rule, i) => (
                        <article key={rule.id} className="card" style={{
                            '--stagger': i + 2,
                            borderLeft: `4px solid ${rule.type === 'income' ? 'var(--success)' : 'var(--primary)'}`,
                        } as React.CSSProperties}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem' }}>{rule.description}</h4>
                                    <small style={{ color: 'var(--text-muted)' }}>
                                        {frequencyLabel(rule.frequency)} • {getCategoryName(rule.categoryId)} • {rule.type === 'income' ? '📈 Income' : '📉 Expense'}
                                    </small>
                                </div>
                                <span style={{ fontWeight: 700, color: rule.type === 'income' ? 'var(--success)' : 'var(--text)' }}>
                                    {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount, currency)}
                                </span>
                            </div>
                            <small style={{ display: 'block', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                                Next: {formatDate(rule.nextRun)}
                            </small>
                            <div className="button-row" style={{ marginTop: '0.75rem' }}>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                    onClick={() => void handleToggle(rule.id, rule.active)}>⏸ Pause</button>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                    onClick={() => openEdit(rule)}>✏️ Edit</button>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}
                                    onClick={() => void handleDelete(rule.id)}>🗑</button>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {/* Paused rules */}
            {pausedRules.length > 0 && (
                <section className="stack" style={{ gap: '1rem' }}>
                    <h3>⏸ Paused rules</h3>
                    {pausedRules.map((rule) => (
                        <article key={rule.id} className="card" style={{ opacity: 0.7, borderLeft: '4px solid var(--text-muted)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.15rem' }}>{rule.description}</h4>
                                    <small style={{ color: 'var(--text-muted)' }}>{frequencyLabel(rule.frequency)} • {formatCurrency(rule.amount, currency)}</small>
                                </div>
                                <div className="button-row">
                                    <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                        onClick={() => void handleToggle(rule.id, rule.active)}>▶ Resume</button>
                                    <button className="secondary-button" type="button" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}
                                        onClick={() => void handleDelete(rule.id)}>🗑</button>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {recurringRules.length === 0 && !showForm && (
                <section className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔄</p>
                    <h3>No recurring rules yet</h3>
                    <p className="section-subtitle">Set up automatic tracking for subscriptions, rent, salary, and other repeating transactions.</p>
                    <button className="primary-button" type="button" onClick={() => setShowForm(true)} style={{ marginTop: '1rem' }}>
                        Create your first rule
                    </button>
                </section>
            )}
        </main>
    )
}
