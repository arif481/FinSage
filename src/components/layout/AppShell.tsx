import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { CommandPalette } from '@/components/common/CommandPalette'

const navItems = [
  { to: '/', label: 'Dashboard', short: 'DB' },
  { to: '/transactions', label: 'Transactions', short: 'TX' },
  { to: '/budgets', label: 'Budgets', short: 'BG' },
  { to: '/chat', label: 'Assistant', short: 'AI' },
  { to: '/reports', label: 'Reports', short: 'RP' },
  { to: '/settings', label: 'Settings', short: 'ST' },
]

export const AppShell = () => {
  const { signOutUser, user } = useAuth()
  const location = useLocation()

  return (
    <div className="app-shell">
      <CommandPalette />
      <aside className="app-shell__sidebar glass-panel" aria-label="Primary">
        <div className="app-shell__brand-stack">
          <h1 className="brand-mark">FinSage</h1>
          <p className="brand-subtitle">
            Financial command center for secure daily money decisions.
          </p>
          <p className="app-shell__status">Live workspace</p>
        </div>

        <nav className="app-shell__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                isActive ? 'app-shell__nav-link active' : 'app-shell__nav-link'
              }
              to={item.to}
              end={item.to === '/'}
            >
              <span aria-hidden="true" className="app-shell__nav-badge">
                {item.short}
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
          <button className="secondary-button" type="button" onClick={() => void signOutUser()}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="app-shell__main" key={location.pathname} style={{ animation: 'fade-up 400ms ease-out' }}>
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
            <span aria-hidden="true">{item.short}</span>
            <small>{item.label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
