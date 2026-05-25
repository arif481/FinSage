import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface QuickAddMenuProps {
  variant?: 'sidebar' | 'mobile'
}

interface QuickAddAction {
  id: string
  label: string
  description: string
  icon: string
  to: string
}

const getCurrentSpaceId = (pathname: string): string | null => {
  const match = pathname.match(/^\/spaces\/([^/]+)/)
  return match?.[1] ?? null
}

export const QuickAddMenu = ({ variant = 'sidebar' }: QuickAddMenuProps) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const spaceId = getCurrentSpaceId(location.pathname)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const personalActions = useMemo<QuickAddAction[]>(
    () => [
      {
        id: 'transaction',
        label: 'Transaction',
        description: 'Record income or expense',
        icon: '💳',
        to: '/transactions?new=transaction',
      },
      {
        id: 'budget',
        label: 'Budget',
        description: 'Set or adjust category limits',
        icon: '📋',
        to: '/budgets?new=budget',
      },
      {
        id: 'loan',
        label: 'Loan',
        description: 'Track money lent or borrowed',
        icon: '💸',
        to: '/loans?new=loan',
      },
      {
        id: 'goal',
        label: 'Savings goal',
        description: 'Start a target fund',
        icon: '🎯',
        to: '/goals?new=goal',
      },
      {
        id: 'split',
        label: 'Split expense',
        description: 'Track shared costs',
        icon: '🔀',
        to: '/splits?new=split',
      },
      {
        id: 'rule',
        label: 'Recurring rule',
        description: 'Automate repeating money movement',
        icon: '🔄',
        to: '/recurring?new=rule',
      },
      {
        id: 'category',
        label: 'Category',
        description: 'Create a spending bucket',
        icon: '🗂️',
        to: '/categories?new=category',
      },
      {
        id: 'space',
        label: 'Space',
        description: 'Create a shared workspace',
        icon: '🤝',
        to: '/spaces?new=space',
      },
    ],
    [],
  )

  const spaceActions = useMemo<QuickAddAction[]>(() => {
    if (!spaceId) {
      return []
    }

    return [
      {
        id: 'space-transaction',
        label: 'Shared transaction',
        description: 'Add an item to this space',
        icon: '👥',
        to: `/spaces/${spaceId}/transactions?new=transaction`,
      },
      {
        id: 'space-loan',
        label: 'Shared loan or EMI',
        description: 'Track who owes whom',
        icon: '🏦',
        to: `/spaces/${spaceId}/loans?new=loan`,
      },
      {
        id: 'space-reminder',
        label: 'Space reminder',
        description: 'Add a due date for the group',
        icon: '⏰',
        to: `/spaces/${spaceId}/settings?new=reminder`,
      },
    ]
  }, [spaceId])

  const handleSelect = (action: QuickAddAction) => {
    navigate(action.to)
    setOpen(false)
  }

  return (
    <div className={`quick-add quick-add--${variant}`}>
      <button
        aria-label="Open quick add menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={
          variant === 'mobile'
            ? 'quick-add__trigger quick-add__trigger--mobile'
            : 'quick-add__trigger'
        }
        title="Quick add"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">+</span>
        {variant === 'sidebar' ? <span>Quick add</span> : null}
      </button>

      {open ? (
        <div
          className="quick-add__overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false)
            }
          }}
        >
          <section
            aria-label="Quick add"
            aria-modal="true"
            className="quick-add__panel"
            role="dialog"
          >
            <div className="quick-add__header">
              <div>
                <h2>Quick add</h2>
                <p>Jump straight into the next money action.</p>
              </div>
              <button
                aria-label="Close quick add menu"
                className="ghost-button quick-add__close"
                type="button"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            {spaceActions.length > 0 ? (
              <div className="quick-add__group">
                <p className="quick-add__group-label">Current space</p>
                <div className="quick-add__grid">
                  {spaceActions.map((action) => (
                    <button
                      key={action.id}
                      className="quick-add__item"
                      type="button"
                      onClick={() => handleSelect(action)}
                    >
                      <span className="quick-add__icon">{action.icon}</span>
                      <span>
                        <strong>{action.label}</strong>
                        <small>{action.description}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="quick-add__group">
              <p className="quick-add__group-label">Personal finance</p>
              <div className="quick-add__grid">
                {personalActions.map((action) => (
                  <button
                    key={action.id}
                    className="quick-add__item"
                    type="button"
                    onClick={() => handleSelect(action)}
                  >
                    <span className="quick-add__icon">{action.icon}</span>
                    <span>
                      <strong>{action.label}</strong>
                      <small>{action.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
