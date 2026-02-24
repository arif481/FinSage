import { Link, NavLink, Outlet } from 'react-router-dom'

const links = [
  { label: 'About', to: '/about' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Support', to: '/support' },
]

export const PublicLayout = () => {
  return (
    <div className="public-layout">
      <header className="public-header">
        <Link className="public-brand" to="/auth">
          FinSage
        </Link>

        <nav className="public-nav" aria-label="Public">
          {links.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => (isActive ? 'public-nav__link active' : 'public-nav__link')}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
          <Link className="primary-button" to="/auth">
            Open app
          </Link>
        </nav>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <p>FinSage by Arif</p>
        <p>Personal finance management platform</p>
      </footer>
    </div>
  )
}
