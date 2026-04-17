import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { CommandPalette } from '@/components/common/CommandPalette'
import { NotificationCenter } from '@/components/common/NotificationCenter'
import { ToastContainer } from '@/components/common/Toast'

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const TransactionsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7" /><path d="M17 7H8" /><path d="M17 7V16" />
  </svg>
)

const BudgetsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
)

const LoansIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const AssistantIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /><path d="M18 15l.75 2.25L21 18l-2.25.75L18 21l-.75-2.25L15 18l2.25-.75L18 15Z" />
  </svg>
)

const ReportsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="M7 16l4-8 4 5 5-7" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
)

const GoalsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)

const SplitsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" />
  </svg>
)

const RecurringIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6" /><path d="M2.5 22v-6h6" /><path d="M22 11.5A10 10 0 0 0 3.2 7.2" /><path d="M2 12.5a10 10 0 0 0 18.8 4.2" />
  </svg>
)

const SpacesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const navItems = [
  { to: '/', label: 'Dashboard', short: 'DB', icon: <DashboardIcon /> },
  { to: '/transactions', label: 'Transactions', short: 'TX', icon: <TransactionsIcon /> },
  { to: '/budgets', label: 'Budgets', short: 'BG', icon: <BudgetsIcon /> },
  { to: '/loans', label: 'Loans', short: 'LN', icon: <LoansIcon /> },
  { to: '/goals', label: 'Goals', short: 'GL', icon: <GoalsIcon /> },
  { to: '/splits', label: 'Splits', short: 'SP', icon: <SplitsIcon /> },
  { to: '/recurring', label: 'Recurring', short: 'RC', icon: <RecurringIcon /> },
  { to: '/spaces', label: 'Spaces', short: 'SP', icon: <SpacesIcon /> },
  { to: '/chat', label: 'Assistant', short: 'AI', icon: <AssistantIcon /> },
  { to: '/reports', label: 'Reports', short: 'RP', icon: <ReportsIcon /> },
  { to: '/settings', label: 'Settings', short: 'ST', icon: <SettingsIcon /> },
]

export const AppShell = () => {
  const { signOutUser, user } = useAuth()
  const location = useLocation()

  return (
    <div className="app-shell">
      <CommandPalette />
      <ToastContainer />
      <aside className="app-shell__sidebar glass-panel" aria-label="Primary">
        <div className="app-shell__brand-stack">
          <h1 className="brand-mark" style={{ animation: 'fade-up 500ms ease both' }}>
            <span className="glow-text" style={{ color: 'var(--primary)' }}>Fin</span>Sage
          </h1>
          <p className="brand-subtitle" style={{ animation: 'fade-up 500ms ease both 100ms' }}>
            Financial command center for secure daily money decisions.
          </p>
          <p className="app-shell__status" style={{ animation: 'fade-up 500ms ease both 200ms' }}>
            <span className="status-dot status-dot--good" style={{ marginRight: '0.3rem' }} />
            Live workspace
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', marginBottom: '0.25rem' }}>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>⌘K to search</small>
          <NotificationCenter />
        </div>

        <nav className="app-shell__nav">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                isActive ? 'app-shell__nav-link active' : 'app-shell__nav-link'
              }
              to={item.to}
              end={item.to === '/'}
              style={{ animation: `fade-up 400ms ease both ${150 + index * 60}ms` }}
            >
              <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__profile">
          <div className="app-shell__links">
            <NavLink className="app-shell__helper-link" to="/about">
              About
            </NavLink>
            <NavLink className="app-shell__helper-link" to="/support">
              Support
            </NavLink>
          </div>
          <p className="app-shell__user">{user?.email}</p>
          <p className="app-shell__credit">Developed by Arif</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void signOutUser()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <LogOutIcon />
            Sign out
          </button>
        </div>
      </aside>

      <div className="app-shell__main" key={location.pathname} style={{ animation: 'fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <Outlet />
      </div>

      <nav className="app-shell__mobile-nav" aria-label="Mobile">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              isActive ? 'app-shell__mobile-link active' : 'app-shell__mobile-link'
            }
            to={item.to}
            end={item.to === '/'}
          >
            <span aria-hidden="true" style={{ display: 'flex', justifyContent: 'center' }}>{item.icon}</span>
            <small>{item.label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
