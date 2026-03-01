import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import {
    addSplitExpense,
    deleteSplitExpense,
    settleSplitExpense,
    updateSplitExpense,
    type SplitExpenseInput,
} from '@/services/firestore/splitExpenses'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { showToast } from '@/components/common/Toast'
import { SplitExpense } from '@/types/finance'
import { formatCurrency } from '@/utils/format'

export const SplitExpensesScreen = () => {
    const { user } = useAuth()
    const currency = useCurrency()
    const { error, loading, splitExpenses } = useFinanceCollections(user?.uid)
    const [showForm, setShowForm] = useState(false)
    const [editingSplit, setEditingSplit] = useState<SplitExpense | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [description, setDescription] = useState('')
    const [totalAmount, setTotalAmount] = useState('')
    const [myShare, setMyShare] = useState('')
    const [splitWith, setSplitWith] = useState('')

    if (loading) {
        return <LoadingScreen label="Loading split expenses..." />
    }

    const resetForm = () => {
        setDescription('')
        setTotalAmount('')
        setMyShare('')
        setSplitWith('')
        setEditingSplit(null)
        setShowForm(false)
    }

    const openEdit = (split: SplitExpense) => {
        setDescription(split.description)
        setTotalAmount(String(split.totalAmount))
        setMyShare(String(split.myShare))
        setSplitWith(split.splitWith)
        setEditingSplit(split)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !description.trim() || !totalAmount || !splitWith.trim()) return

        setSaving(true)
        try {
            const total = Math.abs(parseFloat(totalAmount))
            const share = myShare ? Math.abs(parseFloat(myShare)) : total / 2

            const payload: SplitExpenseInput = {
                description: description.trim(),
                totalAmount: total,
                myShare: Math.min(share, total),
                splitWith: splitWith.trim(),
                status: editingSplit?.status ?? 'pending',
            }

            if (editingSplit) {
                await updateSplitExpense(user.uid, editingSplit.id, payload)
                showToast('Split updated.', 'success')
            } else {
                await addSplitExpense(user.uid, payload)
                showToast('Split created!', 'success')
            }
            resetForm()
        } catch {
            showToast('Failed to save split.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleSettle = async (splitId: string) => {
        if (!user) return
        try {
            await settleSplitExpense(user.uid, splitId)
            showToast('Split settled! ✅', 'success')
        } catch {
            showToast('Failed to settle.', 'error')
        }
    }

    const handleDelete = async (splitId: string) => {
        if (!user) return
        try {
            await deleteSplitExpense(user.uid, splitId)
            showToast('Split deleted.', 'success')
        } catch {
            showToast('Failed to delete.', 'error')
        }
    }

    const pending = splitExpenses.filter((s) => s.status === 'pending')
    const settled = splitExpenses.filter((s) => s.status === 'settled')
    const totalPending = pending.reduce((sum, s) => sum + (s.totalAmount - s.myShare), 0)
    const totalSettled = settled.reduce((sum, s) => sum + s.totalAmount, 0)

    // Group by person
    const personMap = new Map<string, { owed: number; owes: number }>()
    for (const s of pending) {
        const person = s.splitWith
        const entry = personMap.get(person) ?? { owed: 0, owes: 0 }
        const othersShare = s.totalAmount - s.myShare
        entry.owed += othersShare
        personMap.set(person, entry)
    }

    const insightData = [
        { label: 'Pending splits', value: String(pending.length) },
        { label: 'Owed to you', value: formatCurrency(totalPending, currency) },
        { label: 'Settled', value: String(settled.length) },
        { label: 'Total settled', value: formatCurrency(totalSettled, currency) },
    ]

    return (
        <main className="screen stack">
            {error ? <p className="error-text">Data access error: {error}.</p> : null}

            <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
                <div>
                    <h2>Split Expenses</h2>
                    <p className="section-subtitle">
                        Track shared expenses and settle up with friends.
                    </p>
                </div>
                <button className="primary-button" type="button" onClick={() => { resetForm(); setShowForm(true) }}>
                    + New split
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

            {/* Who owes what summary */}
            {personMap.size > 0 && (
                <section className="card stack" style={{ '--stagger': 0 } as React.CSSProperties}>
                    <h3>💸 Who owes what</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {Array.from(personMap.entries()).map(([person, { owed }]) => (
                            <div key={person} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontWeight: 500 }}>{person}</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>owes you {formatCurrency(owed, currency)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Form */}
            {showForm && (
                <section className="card stack" style={{ '--stagger': 1, animation: 'fade-up 400ms ease both' } as React.CSSProperties}>
                    <h3>{editingSplit ? '✏️ Edit split' : '🔀 New split expense'}</h3>
                    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="field">
                            <span>Description</span>
                            <input type="text" placeholder="e.g. Dinner at restaurant" value={description} onChange={(e) => setDescription(e.target.value)} required />
                        </label>

                        <div className="field-row">
                            <label className="field">
                                <span>Total amount</span>
                                <input type="number" placeholder="120" min="0.01" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
                            </label>

                            <label className="field">
                                <span>Your share</span>
                                <input type="number" placeholder="60 (default: half)" min="0" step="0.01" value={myShare} onChange={(e) => setMyShare(e.target.value)} />
                            </label>
                        </div>

                        <label className="field">
                            <span>Split with</span>
                            <input type="text" placeholder="Person's name" value={splitWith} onChange={(e) => setSplitWith(e.target.value)} required />
                        </label>

                        <div className="button-row">
                            <button className="primary-button" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : editingSplit ? 'Update' : 'Create split'}
                            </button>
                            <button className="secondary-button" type="button" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* Pending */}
            {pending.length > 0 && (
                <section className="stack" style={{ gap: '1rem' }}>
                    <h3 style={{ animation: 'fade-up 400ms ease both' }}>🟡 Pending</h3>
                    {pending.map((split, i) => (
                        <article key={split.id} className="card" style={{ '--stagger': i + 2, borderLeft: '4px solid var(--warning, orange)' } as React.CSSProperties}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem' }}>{split.description}</h4>
                                    <small style={{ color: 'var(--text-muted)' }}>
                                        with {split.splitWith} • Total: {formatCurrency(split.totalAmount, currency)} • Your share: {formatCurrency(split.myShare, currency)}
                                    </small>
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                                    {formatCurrency(split.totalAmount - split.myShare, currency)}
                                </span>
                            </div>
                            <div className="button-row" style={{ marginTop: '0.75rem' }}>
                                <button className="primary-button" type="button" style={{ fontSize: '0.85rem' }}
                                    onClick={() => void handleSettle(split.id)}>✅ Settle</button>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                    onClick={() => openEdit(split)}>✏️ Edit</button>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}
                                    onClick={() => void handleDelete(split.id)}>🗑</button>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {/* Settled */}
            {settled.length > 0 && (
                <section className="stack" style={{ gap: '1rem' }}>
                    <h3>✅ Settled</h3>
                    {settled.map((split) => (
                        <article key={split.id} className="card" style={{ borderLeft: '4px solid var(--success)', opacity: 0.75 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.15rem' }}>{split.description}</h4>
                                    <small style={{ color: 'var(--text-muted)' }}>with {split.splitWith} • {formatCurrency(split.totalAmount, currency)}</small>
                                </div>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}
                                    onClick={() => void handleDelete(split.id)}>🗑</button>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {splitExpenses.length === 0 && !showForm && (
                <section className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔀</p>
                    <h3>No split expenses yet</h3>
                    <p className="section-subtitle">Split bills, dinners, and shared costs with friends — track who owes what.</p>
                    <button className="primary-button" type="button" onClick={() => setShowForm(true)} style={{ marginTop: '1rem' }}>
                        Create your first split
                    </button>
                </section>
            )}
        </main>
    )
}
