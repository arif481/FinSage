import { Link } from 'react-router-dom'

export const AboutScreen = () => {
  return (
    <section className="public-page stack">
      <header className="public-page__header">
        <h1>About FinSage</h1>
        <p>
          FinSage is a secure personal finance web app built to help users manage spending, plan budgets,
          and understand money trends with reliable analytics and assistant-driven insights.
        </p>
      </header>

      <article className="card stack">
        <h2>Product principles</h2>
        <ul className="public-list">
          <li>Accuracy first: finance data is scoped to each authenticated user by Firestore security rules.</li>
          <li>Clarity first: dashboards prioritize essential metrics and actionable patterns.</li>
          <li>Privacy first: AI requests run through server-side functions to protect API secrets.</li>
          <li>Accessibility first: keyboard navigation, semantic structure, and contrast-aware theming.</li>
        </ul>
      </article>

      <article className="card stack">
        <h2>Technology</h2>
        <p>
          Frontend: React + TypeScript. Backend: Firebase Auth, Firestore, Cloud Functions. AI layer:
          Gemini-powered callable functions.
        </p>
      </article>

      <article className="card stack">
        <h2>Developer credit</h2>
        <p>
          Designed and developed by <strong>Arif</strong>. Repository and release management are maintained
          directly in GitHub.
        </p>
        <div className="button-row">
          <Link className="secondary-button" to="/support">
            Contact support
          </Link>
          <Link className="primary-button" to="/auth">
            Launch FinSage
          </Link>
        </div>
      </article>
    </section>
  )
}
