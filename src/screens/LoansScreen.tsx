import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import {
    addLoan,
    deleteLoan,
    settleLoan,
    type LoanInput,
    updateLoan,
} from '@/services/firestore/loans'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { showToast } from '@/components/common/Toast'
import { Loan } from '@/types/finance'
import { formatCurrency, formatDate } from '@/utils/format'

export const LoansScreen = () => {
    const { user } = useAuth()
    const currency = useCurrency()
    const { error, loading, loans } = useFinanceCollections(user?.uid)
    const [showForm, setShowForm] = useState(false)
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
    const [saving, setSaving] = useState(false)
    const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null)
    const [repayAmount, setRepayAmount] = useState('')

    // Form state
    const [person, setPerson] = useState('')
    const [amount, setAmount] = useState('')
    const [direction, setDirection] = useState<'borrowed' | 'lent'>('lent')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')

    if (loading) {
        return <LoadingScreen label="Loading loans..." />
    }

    const resetForm = () => {
        setPerson('')
        setAmount('')
        setDirection('lent')
        setDescription('')
        setDueDate('')
        setEditingLoan(null)
        setShowForm(false)
    }

    const openEdit = (loan: Loan) => {
        setPerson(loan.person)
        setAmount(String(loan.amount))
        setDirection(loan.direction)
        setDescription(loan.description ?? '')
        setDueDate(loan.dueDate ?? '')
        setEditingLoan(loan)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !person.trim() || !amount) return

        setSaving(true)
        try {
            const payload: LoanInput = {
                person: person.trim(),
                amount: Math.abs(parseFloat(amount)),
                repaidAmount: editingLoan?.repaidAmount ?? 0,
                direction,
                description: description.trim(),
                dueDate: dueDate || undefined,
                status: 'active',
            }

            if (editingLoan) {
                await updateLoan(user.uid, editingLoan.id, payload)
                showToast('Loan updated.', 'success')
            } else {
                await addLoan(user.uid, payload)
                showToast('Loan added!', 'success')
            }
            resetForm()
        } catch {
            showToast('Failed to save loan.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleRepay = async (loanId: string, currentRepaid: number) => {
        if (!user || !repayAmount) return
        setSaving(true)
        try {
            const newRepaid = currentRepaid + Math.abs(parseFloat(repayAmount))
            await updateLoan(user.uid, loanId, { repaidAmount: newRepaid })
            showToast('Repayment recorded!', 'success')
            setRepayingLoanId(null)
            setRepayAmount('')
        } catch {
            showToast('Failed to record repayment.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleSettle = async (loanId: string) => {
        if (!user) return
        try {
            await settleLoan(user.uid, loanId)
            showToast('Loan settled! ✅', 'success')
        } catch {
            showToast('Failed to settle.', 'error')
        }
    }

    const handleDelete = async (loanId: string) => {
        if (!user) return
        try {
            await deleteLoan(user.uid, loanId)
            showToast('Loan deleted.', 'success')
        } catch {
            showToast('Failed to delete.', 'error')
        }
    }

    const activeLoans = loans.filter((l) => l.status === 'active')
    const settledLoans = loans.filter((l) => l.status === 'settled')
    const totalLent = activeLoans.filter((l) => l.direction === 'lent').reduce((s, l) => s + l.amount, 0)
    const totalBorrowed = activeLoans.filter((l) => l.direction === 'borrowed').reduce((s, l) => s + l.amount, 0)
    const now = new Date()
    const overdueLoans = activeLoans.filter((l) => l.dueDate && new Date(l.dueDate) < now)
    const upcomingDue = activeLoans
        .filter((l) => l.dueDate && new Date(l.dueDate) >= now)
        .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
        .slice(0, 3)

    const insightData = [
        { label: 'Total lent', value: formatCurrency(totalLent, currency) },
        { label: 'Total borrowed', value: formatCurrency(totalBorrowed, currency) },
        { label: 'Net position', value: formatCurrency(totalLent - totalBorrowed, currency) },
        { label: 'Overdue', value: String(overdueLoans.length) },
    ]

    return (
        <main className="screen stack">
            {error ? <p className="error-text">Data access error: {error}.</p> : null}

            <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
                <div>
                    <h2>Loans</h2>
                    <p className="section-subtitle">
                        Track money lent and borrowed — never forget who owes what.
                    </p>
                </div>
                <button className="primary-button" type="button" onClick={() => { resetForm(); setShowForm(true) }}>
                    + New loan
                </button>
            </header>

            <section className="insight-strip">
                {insightData.map((item, i) => (
                    <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
                        <small>{item.label}</small>
                        <strong style={{
                            color: item.label === 'Overdue' && overdueLoans.length > 0 ? 'var(--danger)' :
                                item.label === 'Net position' && totalLent - totalBorrowed > 0 ? 'var(--success)' :
                                    item.label === 'Net position' && totalLent - totalBorrowed < 0 ? 'var(--danger)' : undefined,
                        }}>
                            {item.value}
                        </strong>
                    </article>
                ))}
            </section>

            {/* Overdue alerts */}
            {overdueLoans.length > 0 && (
                <section className="card" style={{ borderLeft: '4px solid var(--danger)', animation: 'fade-up 400ms ease both' }}>
                    <h3 style={{ color: 'var(--danger)', margin: '0 0 0.5rem' }}>⚠️ Overdue loans</h3>
                    {overdueLoans.map((loan) => (
                        <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <span style={{ fontWeight: 600 }}>{loan.person}</span>
                                <small style={{ display: 'block', color: 'var(--danger)' }}>
                                    Due: {loan.dueDate ? formatDate(loan.dueDate) : 'N/A'} • {loan.direction === 'lent' ? 'They owe you' : 'You owe them'}
                                </small>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(loan.amount, currency)}</span>
                        </div>
                    ))}
                </section>
            )}

            {/* Upcoming due dates */}
            {upcomingDue.length > 0 && (
                <section className="card" style={{ '--stagger': 0 } as React.CSSProperties}>
                    <h3>📅 Upcoming due dates</h3>
                    {upcomingDue.map((loan) => (
                        <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <span style={{ fontWeight: 500 }}>{loan.person}</span>
                                <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                                    {loan.dueDate ? formatDate(loan.dueDate) : ''} • {loan.direction === 'lent' ? 'They owe you' : 'You owe them'}
                                </small>
                            </div>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(loan.amount, currency)}</span>
                        </div>
                    ))}
                </section>
            )}

            {/* Form */}
            {showForm && (
                <section className="card stack" style={{ '--stagger': 1, animation: 'fade-up 400ms ease both' } as React.CSSProperties}>
                    <h3>{editingLoan ? '✏️ Edit loan' : '💸 New loan'}</h3>
                    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="field">
                            <span>Person</span>
                            <input type="text" placeholder="Who?" value={person} onChange={(e) => setPerson(e.target.value)} required />
                        </label>

                        <div className="field-row">
                            <label className="field">
                                <span>Amount</span>
                                <input type="number" placeholder="500" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                            </label>
                            <label className="field">
                                <span>Direction</span>
                                <select value={direction} onChange={(e) => setDirection(e.target.value as 'borrowed' | 'lent')}>
                                    <option value="lent">I lent (they owe me)</option>
                                    <option value="borrowed">I borrowed (I owe them)</option>
                                </select>
                            </label>
                        </div>

                        <div className="field-row">
                            <label className="field">
                                <span>Description</span>
                                <input type="text" placeholder="What for? (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </label>
                            <label className="field">
                                <span>Due date (optional)</span>
                                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                            </label>
                        </div>

                        <div className="button-row">
                            <button className="primary-button" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : editingLoan ? 'Update' : 'Add loan'}
                            </button>
                            <button className="secondary-button" type="button" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* Active loans */}
            {activeLoans.length > 0 && (
                <section className="stack" style={{ gap: '0.75rem' }}>
                    <h3>🟢 Active loans</h3>
                    {activeLoans.map((loan, i) => {
                        const isOverdue = loan.dueDate && new Date(loan.dueDate) < now
                        const isRepaying = repayingLoanId === loan.id
                        const pctPaid = loan.amount > 0 ? Math.round((loan.repaidAmount / loan.amount) * 100) : 0

                        return (
                            <article key={loan.id} className="card" style={{
                                '--stagger': i + 2,
                                borderLeft: `4px solid ${isOverdue ? 'var(--danger)' : loan.direction === 'lent' ? 'var(--success)' : 'var(--primary)'}`,
                            } as React.CSSProperties}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {loan.person}
                                            {isOverdue && <span style={{ fontSize: '0.7rem', background: 'var(--danger)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>OVERDUE</span>}
                                            <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: loan.direction === 'lent' ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'color-mix(in srgb, var(--primary) 20%, transparent)', color: loan.direction === 'lent' ? 'var(--success)' : 'var(--primary)' }}>
                                                {loan.direction === 'lent' ? '↑ Lent' : '↓ Borrowed'}
                                            </span>
                                        </h4>
                                        <small style={{ color: 'var(--text-muted)' }}>
                                            {loan.description && `${loan.description} • `}
                                            {loan.dueDate ? `Due: ${formatDate(loan.dueDate)}` : 'No due date'}
                                        </small>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(loan.amount, currency)}</span>
                                </div>

                                {/* Repayment progress */}
                                {loan.repaidAmount > 0 && (
                                    <div style={{ marginTop: '0.6rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                                            <span>Repaid: {formatCurrency(loan.repaidAmount, currency)}</span>
                                            <span>{pctPaid}%</span>
                                        </div>
                                        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.min(pctPaid, 100)}%`,
                                                borderRadius: '3px',
                                                background: 'var(--success)',
                                                transition: 'width 0.6s ease',
                                            }} />
                                        </div>
                                    </div>
                                )}

                                {/* Repay form */}
                                {isRepaying && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', animation: 'fade-up 300ms ease both' }}>
                                        <input type="number" placeholder="Amount" min="0.01" step="0.01" value={repayAmount}
                                            onChange={(e) => setRepayAmount(e.target.value)} style={{ flex: 1 }} />
                                        <button className="primary-button" type="button" disabled={saving || !repayAmount}
                                            onClick={() => void handleRepay(loan.id, loan.repaidAmount)}>Record</button>
                                        <button className="secondary-button" type="button"
                                            onClick={() => { setRepayingLoanId(null); setRepayAmount('') }}>✕</button>
                                    </div>
                                )}

                                <div className="button-row" style={{ marginTop: '0.75rem' }}>
                                    {!isRepaying && (
                                        <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                            onClick={() => { setRepayingLoanId(loan.id); setRepayAmount('') }}>💰 Repay</button>
                                    )}
                                    <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                        onClick={() => void handleSettle(loan.id)}>✅ Settle</button>
                                    <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                                        onClick={() => openEdit(loan)}>✏️ Edit</button>
                                    <button className="secondary-button" type="button" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}
                                        onClick={() => void handleDelete(loan.id)}>🗑</button>
                                </div>
                            </article>
                        )
                    })}
                </section>
            )}

            {/* Settled loans */}
            {settledLoans.length > 0 && (
                <section className="stack" style={{ gap: '0.75rem' }}>
                    <h3>✅ Settled</h3>
                    {settledLoans.map((loan) => (
                        <article key={loan.id} className="card" style={{ borderLeft: '4px solid var(--success)', opacity: 0.7 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{loan.person}</h4>
                                    <small style={{ color: 'var(--text-muted)' }}>{loan.description || loan.direction} • {formatCurrency(loan.amount, currency)}</small>
                                </div>
                                <button className="secondary-button" type="button" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}
                                    onClick={() => void handleDelete(loan.id)}>🗑</button>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {loans.length === 0 && !showForm && (
                <section className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💸</p>
                    <h3>No loans yet</h3>
                    <p className="section-subtitle">Start tracking money you've lent or borrowed.</p>
                    <button className="primary-button" type="button" onClick={() => setShowForm(true)} style={{ marginTop: '1rem' }}>
                        Add your first loan
                    </button>
                </section>
            )}
        </main>
    )
}
