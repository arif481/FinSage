import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { useAuth } from '@/hooks/useAuth'

/** Simple fuzzy match: checks if all query chars appear (in order) in the target */
const fuzzyMatch = (query: string, target: string): boolean => {
    const q = query.toLowerCase()
    const t = target.toLowerCase()
    let qi = 0
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) qi++
    }
    return qi === q.length
}

/** Score a fuzzy match: lower = better match */
const fuzzyScore = (query: string, target: string): number => {
    const q = query.toLowerCase()
    const t = target.toLowerCase()
    if (t.startsWith(q)) return 0
    if (t.includes(q)) return 1
    let qi = 0
    let gaps = 0
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) qi++
        else if (qi > 0) gaps++
    }
    return 2 + gaps
}

interface Action {
    id: string
    label: string
    shortcut?: string
    icon?: string
    onSelect: () => void
}

export const CommandPalette = () => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const navigate = useNavigate()
    const { user } = useAuth()
    const { transactions } = useFinanceCollections(user?.uid)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

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
            setActiveIndex(0)
        }
    }, [open])

    // Reset active index when query changes
    useEffect(() => {
        setActiveIndex(0)
    }, [query])

    const navActions: Action[] = useMemo(() => [
        { id: 'dashboard', label: 'Go to Dashboard', icon: '📊', shortcut: 'D', onSelect: () => navigate('/') },
        { id: 'transactions', label: 'Go to Transactions', icon: '💳', shortcut: 'T', onSelect: () => navigate('/transactions') },
        { id: 'budgets', label: 'Go to Budgets', icon: '📋', shortcut: 'B', onSelect: () => navigate('/budgets') },
        { id: 'loans', label: 'Go to Loans', icon: '💸', shortcut: 'L', onSelect: () => navigate('/loans') },
        { id: 'goals', label: 'Go to Savings Goals', icon: '🎯', onSelect: () => navigate('/goals') },
        { id: 'splits', label: 'Go to Split Expenses', icon: '🔀', onSelect: () => navigate('/splits') },
        { id: 'recurring', label: 'Go to Recurring', icon: '🔄', onSelect: () => navigate('/recurring') },
        { id: 'categories', label: 'Manage Categories', icon: '🗂️', onSelect: () => navigate('/categories') },
        { id: 'chat', label: 'Ask AI Assistant', icon: '🤖', shortcut: 'A', onSelect: () => navigate('/chat') },
        { id: 'reports', label: 'View Reports', icon: '📈', shortcut: 'R', onSelect: () => navigate('/reports') },
        { id: 'settings', label: 'Open Settings', icon: '⚙️', shortcut: 'S', onSelect: () => navigate('/settings') },
    ], [navigate])

    const transactionResults: Action[] = useMemo(() => query.length > 2
        ? transactions
            .filter(t => fuzzyMatch(query, t.description) || t.tags.some(tag => fuzzyMatch(query, tag)))
            .slice(0, 5)
            .map(t => ({
                id: t.id,
                label: `Transaction: ${t.description} (${t.amount})`,
                icon: t.type === 'income' ? '📈' : '📉',
                onSelect: () => navigate('/transactions'),
            }))
        : []
        , [query, transactions, navigate])

    const filteredActions = useMemo(() => [
        ...navActions
            .filter(a => fuzzyMatch(query, a.label))
            .sort((a, b) => fuzzyScore(query, a.label) - fuzzyScore(query, b.label)),
        ...transactionResults,
    ], [query, navActions, transactionResults])

    const selectAction = useCallback((action: Action) => {
        action.onSelect()
        setOpen(false)
    }, [])

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex(i => Math.min(i + 1, filteredActions.length - 1))
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex(i => Math.max(i - 1, 0))
        } else if (event.key === 'Enter' && filteredActions.length > 0) {
            event.preventDefault()
            selectAction(filteredActions[activeIndex])
        }
    }, [filteredActions, activeIndex, selectAction])

    // Scroll active item into view
    useEffect(() => {
        const list = listRef.current
        if (!list) return
        const activeItem = list.children[activeIndex] as HTMLElement | undefined
        activeItem?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex])

    if (!open) return null

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
                    onKeyDown={handleKeyDown}
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
                <ul ref={listRef} style={{ listStyle: 'none', margin: 0, padding: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredActions.length === 0 ? (
                        <li style={{ padding: '1rem', color: 'var(--text-muted)' }}>No results found.</li>
                    ) : (
                        filteredActions.map((action, index) => (
                            <li key={action.id}>
                                <button
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '0.8rem 1rem',
                                        background: index === activeIndex
                                            ? 'color-mix(in srgb, var(--primary) 20%, transparent)'
                                            : 'transparent',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        color: index === activeIndex ? 'var(--primary)' : 'var(--text)',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '0.5rem',
                                    }}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => selectAction(action)}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {action.icon && <span>{action.icon}</span>}
                                        {action.label}
                                    </span>
                                    {action.shortcut && (
                                        <kbd style={{
                                            background: 'var(--bg-elevated)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '4px',
                                            padding: '2px 6px',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-muted)',
                                        }}>
                                            {action.shortcut}
                                        </kbd>
                                    )}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
                <div style={{ padding: '0.5rem 1.5rem', borderTop: '1px solid color-mix(in srgb, var(--border) 60%, transparent)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <span><kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }}>↑↓</kbd> navigate</span>
                    <span><kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }}>Enter</kbd> select</span>
                    <span><kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }}>Esc</kbd> close</span>
                </div>
            </div>
        </div>
    )
}
