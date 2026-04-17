import { useState } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSpaces } from '@/hooks/useSpaces'
import { useSpaceCollections } from '@/hooks/useSpaceCollections'
import { useCurrency } from '@/hooks/useCurrency'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { showToast } from '@/components/common/Toast'
import { formatCurrency, formatDate } from '@/utils/format'
import type { SpaceMember } from '@/types/finance'

export const SpaceDashboardScreen = () => {
    const { spaceId } = useParams<{ spaceId: string }>()
    const { user } = useAuth()
    const currency = useCurrency()
    const navigate = useNavigate()
    const { spaces } = useSpaces(user?.uid)
    const space = spaces.find((s) => s.id === spaceId)
    const { transactions, loans, reminders, activities, loading, error } = useSpaceCollections(spaceId)
    const [codeCopied, setCodeCopied] = useState(false)
    const members = space?.members ?? []

    const handleCopyCode = async () => {
        if (!space) return

        try {
            await navigator.clipboard.writeText(space.inviteCode)
            setCodeCopied(true)
            showToast('Invite code copied!', 'success')
            setTimeout(() => setCodeCopied(false), 2000)
        } catch {
            showToast('Failed to copy', 'error')
        }
    }

    // ─── Balance calculations ───
    const balanceMap = new Map<string, Map<string, number>>()

    // Initialize all members
    for (const m of members) {
        balanceMap.set(m.uid, new Map())
    }

    // Process loans
    for (const loan of loans) {
        if (loan.status === 'settled') continue
        const remaining = loan.amount - loan.repaidAmount
        if (remaining <= 0) continue

        // toUid owes fromUid
        const toOwes = balanceMap.get(loan.toUid)
        if (toOwes) {
            toOwes.set(loan.fromUid, (toOwes.get(loan.fromUid) ?? 0) + remaining)
        }
    }

    // Net balance per member
    const netBalances: { member: SpaceMember; owes: number; isOwed: number }[] = []
    for (const m of members) {
        let owes = 0
        let isOwed = 0
        const myDebts = balanceMap.get(m.uid)
        if (myDebts) {
            for (const amount of myDebts.values()) owes += amount
        }
        for (const [, debts] of balanceMap) {
            isOwed += debts.get(m.uid) ?? 0
        }
        netBalances.push({ member: m, owes, isOwed })
    }

    if (loading) return <LoadingScreen label="Loading space..." />

    if (!space) {
        return (
            <main className="screen stack" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <p style={{ fontSize: '3rem' }}>🔒</p>
                <h2>Space not found</h2>
                <p className="section-subtitle">You may not have access or the space was deleted.</p>
                <button className="primary-button" type="button" onClick={() => navigate('/spaces')} style={{ margin: '1rem auto' }}>
                    ← Back to Spaces
                </button>
            </main>
        )
    }

    const totalExpenses = transactions
        .filter((t) => t.type === 'expense' || t.type === 'credit_purchase')
        .reduce((s, t) => s + t.amount, 0)
    const activeLoans = loans.filter((l) => l.status !== 'settled')
    const totalLoanAmount = activeLoans.reduce((s, l) => s + (l.amount - l.repaidAmount), 0)
    const dueReminders = reminders.filter((r) => !r.isDismissed && new Date(r.dueDate) <= new Date())
    const upcomingReminders = reminders
        .filter((r) => !r.isDismissed && new Date(r.dueDate) > new Date())
        .slice(0, 3)

    const overdueLoans = activeLoans.filter((l) => l.dueDate && new Date(l.dueDate) < new Date())
    const emiLoans = activeLoans.filter((l) => l.isEmi)

    const insightData = [
        { label: 'Members', value: String(space.members.length) },
        { label: 'Total expenses', value: formatCurrency(totalExpenses, currency) },
        { label: 'Active loans', value: String(activeLoans.length) },
        { label: 'Outstanding', value: formatCurrency(totalLoanAmount, currency) },
    ]

    return (
        <main className="screen stack">
            {error ? <p className="error-text">Error: {error}</p> : null}

            {/* Space Header */}
            <header
                className="space-header"
                style={{ '--space-color': space.color, animation: 'fade-up 400ms ease both' } as React.CSSProperties}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <button className="secondary-button" type="button" onClick={() => navigate('/spaces')} style={{ padding: '0.4rem 0.7rem' }}>
                        ←
                    </button>
                    <span style={{ fontSize: '2.2rem' }}>{space.icon}</span>
                    <div>
                        <h2 style={{ fontSize: '1.4rem' }}>{space.name}</h2>
                        {space.description && <p className="section-subtitle" style={{ marginTop: '0.15rem' }}>{space.description}</p>}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="member-stack" style={{ marginRight: '0.25rem' }}>
                        {space.members.slice(0, 5).map((m) => (
                            <span key={m.uid} className="member-avatar" title={m.displayName}
                                style={{ '--space-color': space.color } as React.CSSProperties}>
                                {m.displayName.charAt(0).toUpperCase()}
                            </span>
                        ))}
                    </div>

                    <button
                        className="invite-code-btn"
                        type="button"
                        onClick={() => void handleCopyCode()}
                        title="Copy invite code"
                    >
                        <span className="invite-code">{space.inviteCode}</span>
                        <span>{codeCopied ? '✅' : '📋'}</span>
                    </button>
                </div>
            </header>

            {/* Quick Nav */}
            <nav className="space-nav">
                <NavLink to={`/spaces/${spaceId}`} end className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>
                    📊 Dashboard
                </NavLink>
                <NavLink to={`/spaces/${spaceId}/transactions`} className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>
                    💸 Transactions
                </NavLink>
                <NavLink to={`/spaces/${spaceId}/loans`} className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>
                    🏦 Loans & EMI
                </NavLink>
                <NavLink to={`/spaces/${spaceId}/settings`} className={({ isActive }) => isActive ? 'space-nav__link active' : 'space-nav__link'}>
                    ⚙️ Settings
                </NavLink>
            </nav>

            {/* Insight Strip */}
            <section className="insight-strip">
                {insightData.map((item, i) => (
                    <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                    </article>
                ))}
            </section>

            {/* Due Reminders Alert */}
            {dueReminders.length > 0 && (
                <section className="card" style={{ borderLeft: '4px solid var(--danger)', animation: 'fade-up 400ms ease both' }}>
                    <h3 style={{ color: 'var(--danger)', margin: '0 0 0.5rem' }}>🔔 Due Reminders</h3>
                    {dueReminders.map((r) => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <span style={{ fontWeight: 600 }}>{r.title}</span>
                                <small style={{ display: 'block', color: 'var(--danger)' }}>
                                    Due: {formatDate(r.dueDate)} {r.description && `• ${r.description}`}
                                </small>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* Overdue Loans */}
            {overdueLoans.length > 0 && (
                <section className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                    <h3 style={{ color: 'var(--danger)', margin: '0 0 0.5rem' }}>⚠️ Overdue Loans</h3>
                    {overdueLoans.map((loan) => (
                        <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <span style={{ fontWeight: 600 }}>{loan.fromName} → {loan.toName}</span>
                                <small style={{ display: 'block', color: 'var(--danger)' }}>
                                    {loan.description} • Due: {loan.dueDate ? formatDate(loan.dueDate) : 'N/A'}
                                </small>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(loan.amount - loan.repaidAmount, currency)}</span>
                        </div>
                    ))}
                </section>
            )}

            <div className="grid-two">
                {/* Balance Matrix */}
                <section className="card stack" style={{ '--stagger': 1 } as React.CSSProperties}>
                    <h3>⚖️ Balance Overview</h3>
                    {netBalances.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {netBalances.map(({ member, owes, isOwed }) => {
                                const net = isOwed - owes
                                return (
                                    <div key={member.uid} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.5rem 0', borderBottom: '1px solid var(--border)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className="member-avatar" style={{ '--space-color': space.color, width: '28px', height: '28px', fontSize: '0.75rem' } as React.CSSProperties}>
                                                {member.displayName.charAt(0).toUpperCase()}
                                            </span>
                                            <span style={{ fontWeight: 500 }}>
                                                {member.displayName}
                                                {member.uid === user?.uid && <small style={{ color: 'var(--text-muted)', marginLeft: '0.3rem' }}>(you)</small>}
                                            </span>
                                        </div>
                                        <span style={{
                                            fontWeight: 700,
                                            color: net > 0 ? 'var(--success)' : net < 0 ? 'var(--danger)' : 'var(--text-muted)',
                                        }}>
                                            {net > 0 ? `+${formatCurrency(net, currency)}` : net < 0 ? `-${formatCurrency(Math.abs(net), currency)}` : 'settled'}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>No outstanding balances</p>
                    )}
                </section>

                {/* EMI Tracker */}
                <section className="card stack" style={{ '--stagger': 2 } as React.CSSProperties}>
                    <h3>📅 EMI Tracker</h3>
                    {emiLoans.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {emiLoans.map((loan) => {
                                const pct = loan.totalInstallments ? Math.round(((loan.paidInstallments ?? 0) / loan.totalInstallments) * 100) : 0
                                return (
                                    <div key={loan.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                            <div>
                                                <span style={{ fontWeight: 600 }}>{loan.description || 'EMI'}</span>
                                                {loan.creditCardLabel && (
                                                    <small style={{ display: 'block', color: 'var(--text-muted)' }}>💳 {loan.creditCardLabel}</small>
                                                )}
                                            </div>
                                            <span style={{ fontWeight: 700 }}>{formatCurrency(loan.emiAmount ?? 0, currency)}/mo</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            <span>{loan.paidInstallments ?? 0} of {loan.totalInstallments} paid</span>
                                            <span>Day {loan.emiDay} of month</span>
                                        </div>
                                        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: '3px', background: 'var(--success)', transition: 'width 0.6s ease' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>No EMIs being tracked</p>
                    )}
                </section>
            </div>

            <div className="grid-two">
                {/* Recent Transactions */}
                <section className="card stack" style={{ '--stagger': 3 } as React.CSSProperties}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>💸 Recent Transactions</h3>
                        <button className="ghost-button" type="button" onClick={() => navigate(`/spaces/${spaceId}/transactions`)} style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}>
                            View all →
                        </button>
                    </div>
                    {transactions.slice(0, 5).map((txn) => (
                        <div key={txn.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <span style={{ fontWeight: 500 }}>{txn.description}</span>
                                <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                                    {txn.paidByName} • {formatDate(txn.date)}
                                </small>
                            </div>
                            <span style={{
                                fontWeight: 700,
                                color: txn.type === 'income' ? 'var(--success)' : 'var(--text)',
                            }}>
                                {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, currency)}
                            </span>
                        </div>
                    ))}
                    {transactions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No transactions yet</p>}
                </section>

                {/* Upcoming Reminders */}
                <section className="card stack" style={{ '--stagger': 4 } as React.CSSProperties}>
                    <h3>⏰ Upcoming Reminders</h3>
                    {upcomingReminders.length > 0 ? upcomingReminders.map((r) => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <span style={{ fontWeight: 500 }}>{r.title}</span>
                                <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                                    {formatDate(r.dueDate)} {r.recurringFrequency && r.recurringFrequency !== 'once' ? `• ${r.recurringFrequency}` : ''}
                                </small>
                            </div>
                        </div>
                    )) : <p style={{ color: 'var(--text-muted)' }}>No upcoming reminders</p>}
                </section>
            </div>

            {/* Activity Feed */}
            <section className="card stack" style={{ '--stagger': 5 } as React.CSSProperties}>
                <h3>📋 Activity Feed</h3>
                {activities.length > 0 ? (
                    <div className="activity-feed">
                        {activities.slice(0, 10).map((a) => (
                            <div key={a.id} className="activity-feed__item">
                                <span className="activity-feed__dot" />
                                <div>
                                    <span style={{ fontWeight: 600 }}>{a.userName}</span>{' '}
                                    <span style={{ color: 'var(--text-muted)' }}>{a.action}</span>
                                    {a.amount !== undefined && (
                                        <span style={{ fontWeight: 700, marginLeft: '0.3rem' }}>
                                            {formatCurrency(a.amount, currency)}
                                        </span>
                                    )}
                                    <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        {a.createdAt ? formatDate(a.createdAt) : ''}
                                    </small>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No activity yet — be the first!</p>
                )}
            </section>
        </main>
    )
}
