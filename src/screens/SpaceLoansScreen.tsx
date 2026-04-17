import { useState } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useSpaces } from '@/hooks/useSpaces'
import { useSpaceCollections } from '@/hooks/useSpaceCollections'
import { useCurrency } from '@/hooks/useCurrency'
import {
    addSpaceLoan,
    updateSpaceLoan,
    deleteSpaceLoan,
    recordSpaceRepayment,
    settleSpaceLoan,
    type SpaceLoanInput,
} from '@/services/firestore/spaceLoans'
import { logActivity } from '@/services/firestore/spaceActivity'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { showToast } from '@/components/common/Toast'
import { formatCurrency, formatDate } from '@/utils/format'
import type { SpaceLoan } from '@/types/finance'

export const SpaceLoansScreen = () => {
    const { spaceId } = useParams<{ spaceId: string }>()
    const { user } = useAuth()
    const { profile } = useUserProfile(user?.uid)
    const currency = useCurrency()
    const navigate = useNavigate()
    const { spaces } = useSpaces(user?.uid)
    const space = spaces.find((s) => s.id === spaceId)
    const { loans, loading, error } = useSpaceCollections(spaceId)

    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<SpaceLoan | null>(null)
    const [saving, setSaving] = useState(false)
    const [repayingId, setRepayingId] = useState<string | null>(null)
    const [repayAmount, setRepayAmount] = useState('')

    // Form state
    const [fromUid, setFromUid] = useState('')
    const [toUid, setToUid] = useState('')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [isEmi, setIsEmi] = useState(false)
    const [emiAmount, setEmiAmount] = useState('')
    const [emiDay, setEmiDay] = useState('1')
    const [totalInstallments, setTotalInstallments] = useState('')
    const [creditCardLabel, setCreditCardLabel] = useState('')
    const [loanTags, setLoanTags] = useState('')

    if (loading) return <LoadingScreen label="Loading loans..." />
    if (!space) { navigate('/spaces'); return null }

    const resetForm = () => {
        setFromUid(user?.uid ?? '')
        setToUid('')
        setAmount('')
        setDescription('')
        setDueDate('')
        setIsEmi(false)
        setEmiAmount('')
        setEmiDay('1')
        setTotalInstallments('')
        setCreditCardLabel('')
        setLoanTags('')
        setEditing(null)
        setShowForm(false)
    }

    const openEdit = (loan: SpaceLoan) => {
        setFromUid(loan.fromUid)
        setToUid(loan.toUid)
        setAmount(String(loan.amount))
        setDescription(loan.description)
        setDueDate(loan.dueDate?.slice(0, 10) ?? '')
        setIsEmi(loan.isEmi)
        setEmiAmount(loan.emiAmount ? String(loan.emiAmount) : '')
        setEmiDay(loan.emiDay ? String(loan.emiDay) : '1')
        setTotalInstallments(loan.totalInstallments ? String(loan.totalInstallments) : '')
        setCreditCardLabel(loan.creditCardLabel ?? '')
        setLoanTags(loan.tags.join(', '))
        setEditing(loan)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !spaceId || !fromUid || !toUid || !amount) return
        if (fromUid === toUid) {
            showToast('Creditor and debtor cannot be the same person.', 'error')
            return
        }

        setSaving(true)
        try {
            const fromMember = space.members.find((m) => m.uid === fromUid)
            const toMember = space.members.find((m) => m.uid === toUid)
            const displayName = profile?.displayName ?? user.displayName ?? 'User'

            const payload: SpaceLoanInput = {
                fromUid,
                fromName: fromMember?.displayName ?? 'Unknown',
                toUid,
                toName: toMember?.displayName ?? 'Unknown',
                amount: Math.abs(parseFloat(amount)),
                repaidAmount: editing?.repaidAmount ?? 0,
                description: description.trim(),
                status: editing?.status ?? 'active',
                isEmi,
                emiAmount: isEmi && emiAmount ? Math.abs(parseFloat(emiAmount)) : undefined,
                emiDay: isEmi ? parseInt(emiDay) : undefined,
                totalInstallments: isEmi && totalInstallments ? parseInt(totalInstallments) : undefined,
                paidInstallments: editing?.paidInstallments ?? 0,
                dueDate: dueDate || undefined,
                creditCardLabel: creditCardLabel.trim() || undefined,
                tags: loanTags.split(',').map((t) => t.trim()).filter(Boolean),
                createdBy: user.uid,
            }

            if (editing) {
                await updateSpaceLoan(spaceId, editing.id, payload)
                showToast('Loan updated.', 'success')
            } else {
                await addSpaceLoan(spaceId, payload)
                await logActivity(spaceId, {
                    uid: user.uid,
                    userName: displayName,
                    action: `added a loan: ${fromMember?.displayName} → ${toMember?.displayName}`,
                    targetType: 'loan',
                    amount: Math.abs(parseFloat(amount)),
                })
                showToast('Loan added!', 'success')
            }
            resetForm()
        } catch {
            showToast('Failed to save loan.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleRepay = async (loan: SpaceLoan) => {
        if (!spaceId || !repayAmount) return
        setSaving(true)
        try {
            await recordSpaceRepayment(
                spaceId, loan.id,
                Math.abs(parseFloat(repayAmount)),
                loan.repaidAmount,
                loan.paidInstallments,
                loan.isEmi,
            )
            showToast('Repayment recorded!', 'success')
            setRepayingId(null)
            setRepayAmount('')
        } catch {
            showToast('Failed to record repayment.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleSettle = async (loanId: string) => {
        if (!spaceId) return
        try {
            await settleSpaceLoan(spaceId, loanId)
            showToast('Loan settled! ✅', 'success')
        } catch {
            showToast('Failed to settle.', 'error')
        }
    }

    const handleDelete = async (loanId: string) => {
        if (!spaceId) return
        try {
            await deleteSpaceLoan(spaceId, loanId)
            showToast('Loan deleted.', 'success')
        } catch {
            showToast('Failed to delete.', 'error')
        }
    }

    const activeLoans = loans.filter((l) => l.status !== 'settled')
    const settledLoans = loans.filter((l) => l.status === 'settled')
    const emiLoans = activeLoans.filter((l) => l.isEmi)
    const regularLoans = activeLoans.filter((l) => !l.isEmi)
    const totalOutstanding = activeLoans.reduce((s, l) => s + (l.amount - l.repaidAmount), 0)
    const now = new Date()
    const overdueCount = activeLoans.filter((l) => l.dueDate && new Date(l.dueDate) < now).length

    const insightData = [
        { label: 'Active loans', value: String(activeLoans.length) },
        { label: 'Outstanding', value: formatCurrency(totalOutstanding, currency) },
        { label: 'EMIs', value: String(emiLoans.length) },
        { label: 'Overdue', value: String(overdueCount) },
    ]

    const renderLoanCard = (loan: SpaceLoan, index: number) => {
        const isOverdue = loan.dueDate && new Date(loan.dueDate) < now && loan.status === 'active'
        const pctPaid = loan.amount > 0 ? Math.round((loan.repaidAmount / loan.amount) * 100) : 0
        const isRepaying = repayingId === loan.id

        return (
            <article key={loan.id} className="card" style={{
                '--stagger': index + 2,
                borderLeft: `4px solid ${isOverdue ? 'var(--danger)' : loan.isEmi ? 'var(--warning)' : 'var(--primary)'}`,
            } as React.CSSProperties}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {loan.fromName} → {loan.toName}
                            {isOverdue && <span style={{ fontSize: '0.7rem', background: 'var(--danger)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>OVERDUE</span>}
                            {loan.isEmi && <span style={{ fontSize: '0.7rem', background: 'color-mix(in srgb, var(--warning) 20%, transparent)', color: 'var(--warning)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>📅 EMI</span>}
                            {loan.creditCardLabel && <span style={{ fontSize: '0.7rem', background: 'color-mix(in srgb, var(--primary) 20%, transparent)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>💳 {loan.creditCardLabel}</span>}
                        </h4>
                        <small style={{ color: 'var(--text-muted)' }}>
                            {loan.description && `${loan.description} • `}
                            {loan.dueDate ? `Due: ${formatDate(loan.dueDate)}` : 'No due date'}
                            {loan.isEmi && loan.emiAmount && ` • ${formatCurrency(loan.emiAmount, currency)}/mo on day ${loan.emiDay}`}
                        </small>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap' }}>{formatCurrency(loan.amount, currency)}</span>
                </div>

                {/* Progress bar */}
                {loan.repaidAmount > 0 && (
                    <div style={{ marginTop: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                            <span>Repaid: {formatCurrency(loan.repaidAmount, currency)}</span>
                            <span>{pctPaid}%</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(pctPaid, 100)}%`, borderRadius: '3px', background: 'var(--success)', transition: 'width 0.6s ease' }} />
                        </div>
                    </div>
                )}

                {/* EMI progress */}
                {loan.isEmi && loan.totalInstallments && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Installments: {loan.paidInstallments ?? 0} of {loan.totalInstallments} paid
                    </div>
                )}

                {/* Repay form */}
                {isRepaying && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', animation: 'fade-up 300ms ease both' }}>
                        <input type="number" placeholder="Amount" min="0.01" step="0.01" value={repayAmount}
                            onChange={(e) => setRepayAmount(e.target.value)} style={{ flex: 1 }} />
                        <button className="primary-button" type="button" disabled={saving || !repayAmount}
                            onClick={() => void handleRepay(loan)}>Record</button>
                        <button className="secondary-button" type="button"
                            onClick={() => { setRepayingId(null); setRepayAmount('') }}>✕</button>
                    </div>
                )}

                <div className="button-row" style={{ marginTop: '0.75rem' }}>
                    {!isRepaying && (
                        <button className="secondary-button" type="button" style={{ fontSize: '0.85rem' }}
                            onClick={() => { setRepayingId(loan.id); setRepayAmount(loan.isEmi && loan.emiAmount ? String(loan.emiAmount) : '') }}>
                            💰 Repay
                        </button>
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
    }

    return (
        <main className="screen stack">
            {error ? <p className="error-text">Error: {error}</p> : null}

            <nav className="space-nav" style={{ animation: 'fade-up 300ms ease both' }}>
                <button className="space-nav__link" type="button" onClick={() => navigate(`/spaces/${spaceId}`)}>← Back</button>
                <NavLink to={`/spaces/${spaceId}`} end className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>📊 Dashboard</NavLink>
                <NavLink to={`/spaces/${spaceId}/transactions`} className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>💸 Transactions</NavLink>
                <NavLink to={`/spaces/${spaceId}/loans`} className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>🏦 Loans</NavLink>
                <NavLink to={`/spaces/${spaceId}/settings`} className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>⚙️ Settings</NavLink>
            </nav>

            <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
                <div>
                    <h2>{space.icon} Loans & EMI</h2>
                    <p className="section-subtitle">Track who owes whom, manage EMIs and credit card installments.</p>
                </div>
                <button className="primary-button" type="button" onClick={() => { resetForm(); setFromUid(user?.uid ?? ''); setShowForm(true) }}>
                    + New loan
                </button>
            </header>

            <section className="insight-strip">
                {insightData.map((item, i) => (
                    <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
                        <small>{item.label}</small>
                        <strong style={{ color: item.label === 'Overdue' && overdueCount > 0 ? 'var(--danger)' : undefined }}>
                            {item.value}
                        </strong>
                    </article>
                ))}
            </section>

            {/* Form */}
            {showForm && (
                <section className="card stack" style={{ animation: 'fade-up 400ms ease both' }}>
                    <h3>{editing ? '✏️ Edit Loan' : '💸 New Loan'}</h3>
                    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="field-row">
                            <label className="field">
                                <span>From (creditor)</span>
                                <select value={fromUid} onChange={(e) => setFromUid(e.target.value)} required>
                                    <option value="">Select member...</option>
                                    {space.members.map((m) => (
                                        <option key={m.uid} value={m.uid}>{m.displayName}{m.uid === user?.uid ? ' (you)' : ''}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="field">
                                <span>To (debtor)</span>
                                <select value={toUid} onChange={(e) => setToUid(e.target.value)} required>
                                    <option value="">Select member...</option>
                                    {space.members.map((m) => (
                                        <option key={m.uid} value={m.uid}>{m.displayName}{m.uid === user?.uid ? ' (you)' : ''}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="field-row">
                            <label className="field">
                                <span>Total Amount</span>
                                <input type="number" placeholder="5000" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                            </label>
                            <label className="field">
                                <span>Due Date (optional)</span>
                                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                            </label>
                        </div>

                        <label className="field">
                            <span>Description</span>
                            <input type="text" placeholder="What's this loan for?" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>

                        {/* EMI Toggle */}
                        <div className="checkbox-field" style={{ padding: '0.5rem', background: 'var(--bg-strong)', borderRadius: '0.8rem' }}>
                            <input type="checkbox" checked={isEmi} onChange={(e) => setIsEmi(e.target.checked)} id="emi-toggle" />
                            <label htmlFor="emi-toggle" style={{ fontWeight: 700 }}>📅 This is an EMI / Installment loan</label>
                        </div>

                        {isEmi && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', background: 'color-mix(in srgb, var(--warning) 8%, transparent)', borderRadius: 'var(--radius)', border: '1px solid color-mix(in srgb, var(--warning) 25%, var(--border))' }}>
                                <div className="field-row">
                                    <label className="field">
                                        <span>Monthly EMI Amount</span>
                                        <input type="number" placeholder="2500" min="0.01" step="0.01" value={emiAmount} onChange={(e) => setEmiAmount(e.target.value)} />
                                    </label>
                                    <label className="field">
                                        <span>EMI Day of Month</span>
                                        <select value={emiDay} onChange={(e) => setEmiDay(e.target.value)}>
                                            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="field-row">
                                    <label className="field">
                                        <span>Total Installments</span>
                                        <input type="number" placeholder="12" min="1" value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)} />
                                    </label>
                                    <label className="field">
                                        <span>Credit Card Label (optional)</span>
                                        <input type="text" placeholder="e.g. HDFC Visa ending 4521" value={creditCardLabel} onChange={(e) => setCreditCardLabel(e.target.value)} />
                                    </label>
                                </div>
                            </div>
                        )}

                        <label className="field">
                            <span>Tags (comma separated)</span>
                            <input type="text" placeholder="e.g. phone, electronics" value={loanTags} onChange={(e) => setLoanTags(e.target.value)} />
                        </label>

                        <div className="button-row">
                            <button className="primary-button" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : editing ? 'Update' : 'Add loan'}
                            </button>
                            <button className="secondary-button" type="button" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* EMI Loans */}
            {emiLoans.length > 0 && (
                <section className="stack" style={{ gap: '0.75rem' }}>
                    <h3 style={{ animation: 'fade-up 400ms ease both' }}>📅 EMI / Installment Loans</h3>
                    {emiLoans.map((loan, i) => renderLoanCard(loan, i))}
                </section>
            )}

            {/* Regular Loans */}
            {regularLoans.length > 0 && (
                <section className="stack" style={{ gap: '0.75rem' }}>
                    <h3 style={{ animation: 'fade-up 400ms ease both' }}>🟢 Active Loans</h3>
                    {regularLoans.map((loan, i) => renderLoanCard(loan, i + emiLoans.length))}
                </section>
            )}

            {/* Settled */}
            {settledLoans.length > 0 && (
                <section className="stack" style={{ gap: '0.75rem' }}>
                    <h3>✅ Settled</h3>
                    {settledLoans.map((loan) => (
                        <article key={loan.id} className="card" style={{ borderLeft: '4px solid var(--success)', opacity: 0.7 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{loan.fromName} → {loan.toName}</h4>
                                    <small style={{ color: 'var(--text-muted)' }}>{loan.description || 'Settled loan'} • {formatCurrency(loan.amount, currency)}</small>
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
                    <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏦</p>
                    <h3>No loans yet</h3>
                    <p className="section-subtitle">Track money lent between members, credit card usage, and EMI installments.</p>
                    <button className="primary-button" type="button" onClick={() => { resetForm(); setFromUid(user?.uid ?? ''); setShowForm(true) }} style={{ marginTop: '1rem' }}>
                        Add your first loan
                    </button>
                </section>
            )}
        </main>
    )
}
