export const TermsScreen = () => {
  return (
    <section className="public-page stack">
      <header className="public-page__header">
        <h1>Terms of Service</h1>
        <p>Last updated: February 24, 2026</p>
      </header>

      <article className="card stack">
        <h2>Use of service</h2>
        <p>
          FinSage is provided for personal finance organization and planning. You are responsible for accuracy
          of your entries and decisions made from the information shown.
        </p>
      </article>

      <article className="card stack">
        <h2>Acceptable usage</h2>
        <ul className="public-list">
          <li>Do not attempt unauthorized access to other users' data.</li>
          <li>Do not abuse APIs, automation, or traffic patterns that degrade service reliability.</li>
          <li>Do not use the platform for unlawful financial activity.</li>
        </ul>
      </article>

      <article className="card stack">
        <h2>AI assistant disclaimer</h2>
        <p>
          Assistant responses are informational and should not be considered legal, tax, or licensed financial
          advice.
        </p>
      </article>

      <article className="card stack">
        <h2>Service updates</h2>
        <p>
          Features, limits, and policies may be updated to improve security and performance. Material changes
          are documented in repository release notes.
        </p>
      </article>
    </section>
  )
}
