import { useState } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useSpaces } from '@/hooks/useSpaces'
import { useSpaceCollections } from '@/hooks/useSpaceCollections'
import { useCurrency } from '@/hooks/useCurrency'
import {
    addSpaceTransaction,
    updateSpaceTransaction,
    deleteSpaceTransaction,
    type SpaceTransactionInput,
} from '@/services/firestore/spaceTransactions'
import { logActivity } from '@/services/firestore/spaceActivity'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { showToast } from '@/components/common/Toast'
import { formatCurrency, formatDate } from '@/utils/format'
import type { SpaceTransaction, SpaceTransactionType } from '@/types/finance'

const TYPE_LABELS: Record<SpaceTransactionType, string> = {
    expense: '💸 Expense',
    income: '💰 Income',
    credit_purchase: '💳 Credit Purchase',
    emi_payment: '📅 EMI Payment',
}

export const SpaceTransactionsScreen = () => {
    const { spaceId } = useParams<{ spaceId: string }>()
    const { user } = useAuth()
    const { profile } = useUserProfile(user?.uid)
    const currency = useCurrency()
    const navigate = useNavigate()
    const { spaces } = useSpaces(user?.uid)
    const space = spaces.find((s) => s.id === spaceId)
    const { transactions, categories, loading, error } = useSpaceCollections(spaceId)

    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<SpaceTransaction | null>(null)
    const [saving, setSaving] = useState(false)
    const [filterType, setFilterType] = useState<string>('all')
    const [filterMember, setFilterMember] = useState<string>('all')

    // Form state
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [type, setType] = useState<SpaceTransactionType>('expense')
    const [paidBy, setPaidBy] = useState('')
    const [splitAmong, setSplitAmong] = useState<string[]>([])
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
    const [tags, setTags] = useState('')
    const [note, setNote] = useState('')

    if (loading) return <LoadingScreen label="Loading transactions..." />
    if (!space) {
        navigate('/spaces')
        return null
    }

    const resetForm = () => {
        setAmount('')
        setDescription('')
        setCategoryId(categories[0]?.id ?? '')
        setType('expense')
        setPaidBy(user?.uid ?? '')
        setSplitAmong(space.memberUids)
        setDate(new Date().toISOString().slice(0, 10))
        setTags('')
        setNote('')
        setEditing(null)
        setShowForm(false)
    }

    const openEdit = (txn: SpaceTransaction) => {
        setAmount(String(txn.amount))
        setDescription(txn.description)
        setCategoryId(txn.categoryId)
        setType(txn.type)
        setPaidBy(txn.paidBy)
        setSplitAmong(txn.splitAmong)
        setDate(txn.date.slice(0, 10))
        setTags(txn.tags.join(', '))
        setNote(txn.attachmentNote ?? '')
        setEditing(txn)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !spaceId || !amount || !description.trim()) return

        setSaving(true)
        try {
            const displayName = profile?.displayName ?? user.displayName ?? 'User'
            const paidByMember = space.members.find((m) => m.uid === paidBy)

            const payload: SpaceTransactionInput = {
                amount: Math.abs(parseFloat(amount)),
                description: description.trim(),
                categoryId: categoryId || 'other',
                type,
                paidBy: paidBy || user.uid,
                paidByName: paidByMember?.displayName ?? displayName,
                splitAmong: splitAmong.length > 0 ? splitAmong : space.memberUids,
                date,
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
                attachmentNote: note.trim() || undefined,
                createdBy: user.uid,
            }

            if (editing) {
                await updateSpaceTransaction(spaceId, editing.id, payload)
                showToast('Transaction updated.', 'success')
            } else {
                await addSpaceTransaction(spaceId, payload)
                await logActivity(spaceId, {
                    uid: user.uid,
                    userName: displayName,
                    action: `added ${type === 'income' ? 'income' : 'an expense'}: "${description.trim()}"`,
                    targetType: 'transaction',
                    amount: Math.abs(parseFloat(amount)),
                })
                showToast('Transaction added!', 'success')
            }
            resetForm()
        } catch {
            showToast('Failed to save transaction.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (txnId: string) => {
        if (!spaceId) return
        try {
            await deleteSpaceTransaction(spaceId, txnId)
            showToast('Transaction deleted.', 'success')
        } catch {
            showToast('Failed to delete.', 'error')
        }
    }

    const toggleSplitMember = (uid: string) => {
        setSplitAmong((prev) =>
            prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid],
        )
    }

    // Filters
    const filtered = transactions.filter((txn) => {
        if (filterType !== 'all' && txn.type !== filterType) return false
        if (filterMember !== 'all' && txn.paidBy !== filterMember) return false
        return true
    })

    const totalFiltered = filtered.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)

    // Per-member spending
    const memberSpending = space.members.map((m) => {
        const spent = transactions
            .filter((t) => t.paidBy === m.uid && t.type !== 'income')
            .reduce((s, t) => s + t.amount, 0)
        return { member: m, spent }
    }).sort((a, b) => b.spent - a.spent)

    return (
        <main className="screen stack">
            {error ? <p className="error-text">Error: {error}</p> : null}

            {/* Space Sub-Nav */}
            <nav className="space-nav" style={{ animation: 'fade-up 300ms ease both' }}>
                <button className="space-nav__link" type="button" onClick={() => navigate(`/spaces/${spaceId}`)}>
                    ← Back
                </button>
                <NavLink to={`/spaces/${spaceId}`} end className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>📊 Dashboard</NavLink>
                <NavLink to={`/spaces/${spaceId}/transactions`} className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>💸 Transactions</NavLink>
                <NavLink to={`/spaces/${spaceId}/loans`} className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>🏦 Loans</NavLink>
                <NavLink to={`/spaces/${spaceId}/settings`} className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>⚙️ Settings</NavLink>
            </nav>

            <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
                <div>
                    <h2>{space.icon} Transactions</h2>
                    <p className="section-subtitle">All shared transactions in {space.name}.</p>
                </div>
                <button className="primary-button" type="button" onClick={() => { resetForm(); setPaidBy(user?.uid ?? ''); setSplitAmong(space.memberUids); setCategoryId(categories[0]?.id ?? ''); setShowForm(true) }}>
                    + Add transaction
                </button>
            </header>

            {/* Filters */}
            <section style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', animation: 'fade-up 400ms ease both 100ms' }}>
                <label className="field" style={{ minWidth: '140px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Type</span>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="all">All types</option>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                        <option value="credit_purchase">Credit Purchase</option>
                        <option value="emi_payment">EMI Payment</option>
                    </select>
                </label>
                <label className="field" style={{ minWidth: '140px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Paid by</span>
                    <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}>
                        <option value="all">All members</option>
                        {space.members.map((m) => (
                            <option key={m.uid} value={m.uid}>{m.displayName}</option>
                        ))}
                    </select>
                </label>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div className="insight-strip__item" style={{ padding: '0.5rem 0.75rem' }}>
                        <small>Net total</small>
                        <strong style={{ color: totalFiltered >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {formatCurrency(Math.abs(totalFiltered), currency)}
                        </strong>
                    </div>
                </div>
            </section>

            {/* Member Spending Breakdown */}
            {memberSpending.some((m) => m.spent > 0) && (
                <section className="card" style={{ '--stagger': 0 } as React.CSSProperties}>
                    <h3 style={{ marginBottom: '0.5rem' }}>👥 Spending by Member</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {memberSpending.filter((m) => m.spent > 0).map(({ member, spent }) => {
                            const maxSpent = memberSpending[0]?.spent || 1
                            return (
                                <div key={member.uid} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span className="member-avatar" style={{ '--space-color': space.color, width: '26px', height: '26px', fontSize: '0.7rem' } as React.CSSProperties}>
                                        {member.displayName.charAt(0).toUpperCase()}
                                    </span>
                                    <span style={{ fontWeight: 500, minWidth: '80px' }}>{member.displayName}</span>
                                    <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(spent / maxSpent) * 100}%`, borderRadius: '4px', background: space.color, transition: 'width 0.6s ease' }} />
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: '70px', textAlign: 'right' }}>{formatCurrency(spent, currency)}</span>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Form */}
            {showForm && (
                <section className="card stack" style={{ animation: 'fade-up 400ms ease both' }}>
                    <h3>{editing ? '✏️ Edit Transaction' : '💸 New Transaction'}</h3>
                    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="field-row">
                            <label className="field">
                                <span>Amount</span>
                                <input type="number" placeholder="500" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                            </label>
                            <label className="field">
                                <span>Type</span>
                                <select value={type} onChange={(e) => setType(e.target.value as SpaceTransactionType)}>
                                    {Object.entries(TYPE_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <label className="field">
                            <span>Description</span>
                            <input type="text" placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} required />
                        </label>

                        <div className="field-row">
                            <label className="field">
                                <span>Category</span>
                                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="field">
                                <span>Date</span>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                            </label>
                        </div>

                        <label className="field">
                            <span>Paid by</span>
                            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                                {space.members.map((m) => (
                                    <option key={m.uid} value={m.uid}>{m.displayName}{m.uid === user?.uid ? ' (you)' : ''}</option>
                                ))}
                            </select>
                        </label>

                        <div>
                            <span style={{ fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Split among</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {space.members.map((m) => (
                                    <button
                                        key={m.uid}
                                        type="button"
                                        className={splitAmong.includes(m.uid) ? 'space-member-chip space-member-chip--active' : 'space-member-chip'}
                                        onClick={() => toggleSplitMember(m.uid)}
                                    >
                                        {m.displayName}{m.uid === user?.uid ? ' (you)' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="field-row">
                            <label className="field">
                                <span>Tags (comma separated)</span>
                                <input type="text" placeholder="e.g. food, weekend" value={tags} onChange={(e) => setTags(e.target.value)} />
                            </label>
                            <label className="field">
                                <span>Note (optional)</span>
                                <input type="text" placeholder="Additional details" value={note} onChange={(e) => setNote(e.target.value)} />
                            </label>
                        </div>

                        <div className="button-row">
                            <button className="primary-button" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : editing ? 'Update' : 'Add transaction'}
                            </button>
                            <button className="secondary-button" type="button" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* Transaction List */}
            {filtered.length > 0 ? (
                <section className="stack" style={{ gap: '0.5rem' }}>
                    {filtered.map((txn, i) => (
                        <article key={txn.id} className="card" style={{ '--stagger': i + 1, padding: '0.8rem 1rem' } as React.CSSProperties}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <h4 style={{ margin: 0 }}>{txn.description}</h4>
                                        <span style={{
                                            fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                                            background: txn.type === 'income' ? 'color-mix(in srgb, var(--success) 20%, transparent)' : txn.type === 'credit_purchase' ? 'color-mix(in srgb, var(--warning) 20%, transparent)' : txn.type === 'emi_payment' ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'color-mix(in srgb, var(--danger) 20%, transparent)',
                                            color: txn.type === 'income' ? 'var(--success)' : txn.type === 'credit_purchase' ? 'var(--warning)' : txn.type === 'emi_payment' ? 'var(--primary)' : 'var(--danger)',
                                            fontWeight: 600,
                                        }}>
                                            {TYPE_LABELS[txn.type]}
                                        </span>
                                    </div>
                                    <small style={{ color: 'var(--text-muted)' }}>
                                        Paid by {txn.paidByName} • {formatDate(txn.date)}
                                        {txn.tags.length > 0 && ` • ${txn.tags.join(', ')}`}
                                    </small>
                                </div>
                                <span style={{
                                    fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap',
                                    color: txn.type === 'income' ? 'var(--success)' : undefined,
                                }}>
                                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, currency)}
                                </span>
                            </div>
                            <div className="button-row" style={{ marginTop: '0.5rem' }}>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={() => openEdit(txn)}>✏️ Edit</button>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', color: 'var(--danger)' }} onClick={() => void handleDelete(txn.id)}>🗑</button>
                            </div>
                        </article>
                    ))}
                </section>
            ) : (
                <section className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💸</p>
                    <h3>No transactions yet</h3>
                    <p className="section-subtitle">Start tracking shared expenses and income.</p>
                </section>
            )}
        </main>
    )
}
