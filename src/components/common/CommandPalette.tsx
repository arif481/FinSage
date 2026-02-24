import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { useAuth } from '@/hooks/useAuth'

export const CommandPalette = () => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const navigate = useNavigate()
    const { user } = useAuth()
    const { transactions } = useFinanceCollections(user?.uid)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault()
                setOpen((prev) => !prev)
            } else if (event.key === 'Escape') {
                setOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setQuery('')
        }
    }, [open])

    if (!open) return null

    const actions = [
        { id: 'dashboard', label: 'Go to Dashboard', onSelect: () => navigate('/') },
        { id: 'transactions', label: 'Go to Transactions', onSelect: () => navigate('/transactions') },
        { id: 'budgets', label: 'Go to Budgets', onSelect: () => navigate('/budgets') },
        { id: 'chat', label: 'Ask AI Assistant', onSelect: () => navigate('/chat') },
        { id: 'reports', label: 'View Reports', onSelect: () => navigate('/reports') },
        { id: 'settings', label: 'Open Settings', onSelect: () => navigate('/settings') },
    ]

    const transactionResults = transactions
        .filter(t => t.description.toLowerCase().includes(query.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
        .slice(0, 3)
        .map(t => ({
            id: t.id,
            label: `Transaction: ${t.description} (${t.amount})`,
            onSelect: () => {
                navigate('/transactions')
            }
        }))

    const filteredActions = [
        ...actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase())),
        ...(query.length > 2 ? transactionResults : [])
    ]

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '15vh',
                backdropFilter: 'blur(16px)',
                backgroundColor: 'rgba(10, 15, 25, 0.4)',
                animation: 'fade-in 0.2s ease-out forwards',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false)
            }}
        >
            <div
                className="glass-panel"
                style={{
                    width: '100%',
                    maxWidth: '600px',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--glow-primary)',
                    animation: 'fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
            >
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search commands, transactions, or jump to..."
                    style={{
                        width: '100%',
                        padding: '1.25rem 1.5rem',
                        fontSize: '1.2rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                        color: 'var(--text)',
                        outline: 'none',
                        fontFamily: 'Space Grotesk, sans-serif'
                    }}
                />
                <ul style={{ listStyle: 'none', margin: 0, padding: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredActions.length === 0 ? (
                        <li style={{ padding: '1rem', color: 'var(--text-muted)' }}>No results found.</li>
                    ) : (
                        filteredActions.map((action) => (
                            <li key={action.id}>
                                <button
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '0.8rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 20%, transparent)';
                                        e.currentTarget.style.color = 'var(--primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text)';
                                    }}
                                    onClick={() => {
                                        action.onSelect()
                                        setOpen(false)
                                    }}
                                >
                                    {action.label}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
                <div style={{ padding: '0.5rem 1.5rem', borderTop: '1px solid color-mix(in srgb, var(--border) 60%, transparent)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <span><kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }}>↑↓</kbd> to navigate</span>
                    <span><kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }}>Enter</kbd> to select</span>
                    <span><kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }}>Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    )
}
