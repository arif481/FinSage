import { Link } from 'react-router-dom'

export const NotFoundScreen = () => {
  return (
    <section className="public-page stack">
      <header className="public-page__header">
        <h1>Page not found</h1>
        <p>The link you opened does not match any available route.</p>
      </header>

      <div className="card stack">
        <p>Use one of the options below to continue.</p>
        <div className="button-row">
          <Link className="secondary-button" to="/about">
            About FinSage
          </Link>
          <Link className="primary-button" to="/auth">
            Go to sign in
          </Link>
        </div>
      </div>
    </section>
  )
}
