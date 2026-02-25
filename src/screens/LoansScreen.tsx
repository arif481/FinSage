import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { addLoan, deleteLoan, updateLoan } from '@/services/firestore/loans'
import { addTransaction } from '@/services/firestore/transactions'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { Loan, LoanDirection } from '@/types/finance'
import { formatCurrency, formatDate } from '@/utils/format'

export const LoansScreen = () => {
    const { user } = useAuth()
    const currency = useCurrency()
    const { error, loading, loans } = useFinanceCollections(user?.uid)

    const [showForm, setShowForm] = useState(false)
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
    const [person, setPerson] = useState('')
    const [amount, setAmount] = useState('')
    const [direction, setDirection] = useState<LoanDirection>('borrowed')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')

    // Partial Repayment State
    const [repayingLoan, setRepayingLoan] = useState<Loan | null>(null)
    const [repayAmount, setRepayAmount] = useState('')

    if (loading) return <LoadingScreen label="Loading loans..." />

    const activeLoans = loans.filter((l) => l.status === 'active')
    const settledLoans = loans.filter((l) => l.status === 'settled')
    const totalBorrowed = activeLoans.filter((l) => l.direction === 'borrowed').reduce((s, l) => s + (l.amount - l.repaidAmount), 0)
    const totalLent = activeLoans.filter((l) => l.direction === 'lent').reduce((s, l) => s + (l.amount - l.repaidAmount), 0)

    const resetForm = () => {
        setPerson('')
        setAmount('')
        setDirection('borrowed')
        setDescription('')
        setDueDate('')
        setEditingLoan(null)
        setShowForm(false)
    }

    const resetRepayForm = () => {
        setRepayingLoan(null)
        setRepayAmount('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !person.trim() || !amount) return

        const numAmount = parseFloat(amount)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
            person: person.trim(),
            amount: numAmount,
            direction,
            status: 'active' as const,
            description: description.trim(),
        }

        if (dueDate) {
            payload.dueDate = dueDate
        }

        if (editingLoan) {
            await updateLoan(user.uid, editingLoan.id, payload)
        } else {
            payload.repaidAmount = 0
            const loanId = await addLoan(user.uid, payload)

            // Auto-create initial transaction
            await addTransaction(user.uid, {
                amount: numAmount,
                categoryId: 'loans',
                date: new Date().toISOString(),
                description: `Initial loan ${payload.direction === 'borrowed' ? 'from' : 'to'} ${payload.person}`,
                tags: ['loan'],
                type: payload.direction === 'borrowed' ? 'income' : 'expense',
                linkedLoanId: loanId
            })
        }
        resetForm()
    }

    const handleRepaySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !repayingLoan || !repayAmount) return

        const payment = parseFloat(repayAmount)
        if (payment <= 0) return

        const newRepaid = repayingLoan.repaidAmount + payment
        const isSettled = newRepaid >= repayingLoan.amount

        // 1. Update Loan Document
        if (isSettled) {
            await updateLoan(user.uid, repayingLoan.id, {
                repaidAmount: repayingLoan.amount,
                status: 'settled',
                settledDate: new Date().toISOString()
            })
        } else {
            await updateLoan(user.uid, repayingLoan.id, {
                repaidAmount: newRepaid
            })
        }

        // 2. Add Linked Transaction
        await addTransaction(user.uid, {
            amount: payment,
            categoryId: 'loans',
            date: new Date().toISOString(),
            description: `Loan repayment ${repayingLoan.direction === 'borrowed' ? 'to' : 'from'} ${repayingLoan.person}`,
            tags: ['loan', 'repayment'],
            type: repayingLoan.direction === 'borrowed' ? 'expense' : 'income',
            linkedLoanId: repayingLoan.id
        })

        resetRepayForm()
    }

    const openEdit = (loan: Loan) => {
        setEditingLoan(loan)
        setPerson(loan.person)
        setAmount(String(loan.amount))
        setDirection(loan.direction)
        setDescription(loan.description)
        setDueDate(loan.dueDate ?? '')
        setShowForm(true)
    }

    const handleSettleFull = async (loan: Loan) => {
        if (!user) return

        const remaining = loan.amount - loan.repaidAmount
        if (remaining > 0) {
            // Auto-create transaction for the remaining balance
            await addTransaction(user.uid, {
                amount: remaining,
                categoryId: 'loans',
                date: new Date().toISOString(),
                description: `Full settlement ${loan.direction === 'borrowed' ? 'to' : 'from'} ${loan.person}`,
                tags: ['loan', 'settlement'],
                type: loan.direction === 'borrowed' ? 'expense' : 'income',
                linkedLoanId: loan.id
            })
        }

        await updateLoan(user.uid, loan.id, {
            repaidAmount: loan.amount, // Set repaid amount to full
            status: 'settled',
            settledDate: new Date().toISOString()
        })
    }

    const handleDelete = async (loanId: string) => {
        if (!user) return
        await deleteLoan(user.uid, loanId)
    }

    return (
        <main className="screen stack">
            {error ? <p className="error-text">Data access error: {error}.</p> : null}

            <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
                <div>
                    <h2>Loans & Borrowings</h2>
                    <p className="section-subtitle">Track money tracking with partial payments and auto-transactions.</p>
                </div>
                <button className="primary-button" onClick={() => { resetForm(); setShowForm(!showForm) }}>
                    {showForm ? 'Cancel' : '+ New Loan'}
                </button>
            </header>

            {/* Summary */}
            <section className="metric-grid" aria-label="Loan summary">
                <article className="metric-card" style={{ '--stagger': 0, '--accent': 'var(--danger)' } as React.CSSProperties}>
                    <small className="metric-card__label">You Owe</small>
                    <strong className="metric-card__value glow-text" style={{ color: 'var(--danger)' }}>
                        {formatCurrency(totalBorrowed, currency)}
                    </strong>
                    <span className="metric-card__sub">{activeLoans.filter((l) => l.direction === 'borrowed').length} active</span>
                </article>
                <article className="metric-card" style={{ '--stagger': 1, '--accent': 'var(--success)' } as React.CSSProperties}>
                    <small className="metric-card__label">Owed to You</small>
                    <strong className="metric-card__value glow-text" style={{ color: 'var(--success)' }}>
                        {formatCurrency(totalLent, currency)}
                    </strong>
                    <span className="metric-card__sub">{activeLoans.filter((l) => l.direction === 'lent').length} active</span>
                </article>
                <article className="metric-card" style={{ '--stagger': 2, '--accent': 'var(--primary)' } as React.CSSProperties}>
                    <small className="metric-card__label">Net Position</small>
                    <strong className="metric-card__value glow-text" style={{ color: totalLent - totalBorrowed >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {totalLent - totalBorrowed >= 0 ? '+' : ''}{formatCurrency(totalLent - totalBorrowed, currency)}
                    </strong>
                    <span className="metric-card__sub">Pending Balance</span>
                </article>
            </section>

            {/* New / Edit Loan Form */}
            {showForm && (
                <section className="card stack" style={{ animation: 'scale-pop 300ms ease both' }}>
                    <h3>{editingLoan ? 'Edit Loan' : 'New Loan'}</h3>
                    <form className="form-grid" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="loan-person">Person</label>
                            <input id="loan-person" type="text" placeholder="Who?" value={person} onChange={(e) => setPerson(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="loan-amount">Amount</label>
                            <input id="loan-amount" type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="loan-direction">Type</label>
                            <select id="loan-direction" value={direction} onChange={(e) => setDirection(e.target.value as LoanDirection)}>
                                <option value="borrowed">I borrowed (I owe them)</option>
                                <option value="lent">I lent (They owe me)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="loan-due">Due date (optional)</label>
                            <input id="loan-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="loan-desc">Description</label>
                            <input id="loan-desc" type="text" placeholder="Reason / notes" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="button-row" style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" className="primary-button">{editingLoan ? 'Update' : 'Add Loan'}</button>
                            <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* Repay Modal/Form inline */}
            {repayingLoan && (
                <section className="card stack" style={{ animation: 'scale-pop 300ms ease both', borderColor: 'var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Record Payment: {repayingLoan.person}</h3>
                        <span className="table-category">Remaining: {formatCurrency(repayingLoan.amount - repayingLoan.repaidAmount, currency)}</span>
                    </div>
                    <form className="form-grid" onSubmit={handleRepaySubmit}>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="repay-amount">Payment Amount</label>
                            <input
                                id="repay-amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={repayingLoan.amount - repayingLoan.repaidAmount}
                                placeholder="0.00"
                                value={repayAmount}
                                onChange={(e) => setRepayAmount(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="button-row" style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" className="primary-button">Confirm Payment</button>
                            <button type="button" className="secondary-button" onClick={resetRepayForm}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* Active Loans */}
            <section className="card stack" style={{ '--stagger': 3 } as React.CSSProperties}>
                <h3>Active Loans</h3>
                {activeLoans.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>💸</span>
                        <p>No active loans. Click <strong>+ New Loan</strong> to track a borrow or lending.</p>
                    </div>
                ) : (
                    <div className="loan-list">
                        {activeLoans.map((loan, i) => {
                            const isOverdue = loan.dueDate && new Date(loan.dueDate) < new Date()
                            const pct = Math.min(100, Math.max(0, (loan.repaidAmount / loan.amount) * 100))
                            const remaining = loan.amount - loan.repaidAmount

                            return (
                                <article
                                    key={loan.id}
                                    className={`loan-card ${isOverdue ? 'loan-card--overdue' : ''}`}
                                    style={{ '--stagger': i } as React.CSSProperties}
                                >
                                    <div className="loan-card__icon">
                                        {loan.direction === 'borrowed' ? '🔴' : '🟢'}
                                    </div>
                                    <div className="loan-card__body" style={{ width: '100%' }}>
                                        <div className="loan-card__header">
                                            <strong>{loan.person}</strong>
                                            <span className={`loan-card__amount ${loan.direction === 'borrowed' ? 'amount--expense' : 'amount--income'}`}>
                                                {formatCurrency(remaining, currency)}
                                            </span>
                                        </div>
                                        {loan.description && <p className="loan-card__desc">{loan.description}</p>}

                                        {/* Progress Bar for Partial Payments */}
                                        <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                <span>{formatCurrency(loan.repaidAmount, currency)} repaid</span>
                                                <span>{formatCurrency(loan.amount, currency)} total</span>
                                            </div>
                                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-panel)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        width: `${pct}%`,
                                                        background: 'var(--primary)',
                                                        transition: 'width 0.3s ease'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="loan-card__meta">
                                            <span className={`table-category ${loan.direction === 'borrowed' ? '' : 'table-category--success'}`}>
                                                {loan.direction === 'borrowed' ? 'You owe' : 'They owe you'}
                                            </span>
                                            {loan.dueDate && (
                                                <small className={isOverdue ? 'text--danger' : ''}>
                                                    {isOverdue ? '⚠️ Overdue' : '📅'} Due: {formatDate(loan.dueDate)}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                    <div className="loan-card__actions" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                                        <button className="primary-button" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setRepayingLoan(loan)}>Repay</button>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="icon-button" title="Full Settle" onClick={() => handleSettleFull(loan)}>✅</button>
                                            <button className="icon-button" title="Edit" onClick={() => openEdit(loan)}>✏️</button>
                                            <button className="icon-button" title="Delete" onClick={() => handleDelete(loan.id)}>🗑️</button>
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* Settled Loans */}
            {settledLoans.length > 0 && (
                <section className="card stack" style={{ '--stagger': 4 } as React.CSSProperties}>
                    <h3>Settled History</h3>
                    <div className="loan-list">
                        {settledLoans.map((loan, i) => (
                            <article
                                key={loan.id}
                                className="loan-card loan-card--settled"
                                style={{ '--stagger': i } as React.CSSProperties}
                            >
                                <div className="loan-card__icon">
                                    {loan.direction === 'borrowed' ? '🔴' : '🟢'}
                                </div>
                                <div className="loan-card__body">
                                    <div className="loan-card__header">
                                        <strong style={{ textDecoration: 'line-through', opacity: 0.7 }}>{loan.person}</strong>
                                        <span style={{ opacity: 0.6 }}>{formatCurrency(loan.amount, currency)}</span>
                                    </div>
                                    {loan.description && <p className="loan-card__desc">{loan.description}</p>}
                                    <small style={{ color: 'var(--success)' }}>✓ Settled{loan.settledDate ? ` on ${formatDate(loan.settledDate)}` : ''}</small>
                                </div>
                                <div className="loan-card__actions">
                                    <button className="icon-button" title="Delete" onClick={() => handleDelete(loan.id)}>🗑️</button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </main>
    )
}
