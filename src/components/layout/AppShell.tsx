import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/chat', label: 'Chat' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
]

export const AppShell = () => {
  const { signOutUser, user } = useAuth()

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar" aria-label="Primary">
        <div>
          <h1 className="brand-mark">FinSage</h1>
          <p className="brand-subtitle">Money clarity with secure financial workflows.</p>
        </div>

        <nav className="app-shell__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => (isActive ? 'app-shell__nav-link active' : 'app-shell__nav-link')}
              to={item.to}
              end={item.to === '/'}
            >
              {item.label}
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

      <div className="app-shell__main">
        <Outlet />
      </div>

      <nav className="app-shell__mobile-nav" aria-label="Mobile">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) => (isActive ? 'app-shell__mobile-link active' : 'app-shell__mobile-link')}
            to={item.to}
            end={item.to === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
