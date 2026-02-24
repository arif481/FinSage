export const PrivacyScreen = () => {
  return (
    <section className="public-page stack">
      <header className="public-page__header">
        <h1>Privacy Policy</h1>
        <p>Last updated: February 24, 2026</p>
      </header>

      <article className="card stack">
        <h2>What data we store</h2>
        <p>
          FinSage stores account profile information, transactions, categories, budgets, and chat history that
          you create inside the app.
        </p>
      </article>

      <article className="card stack">
        <h2>How data is protected</h2>
        <ul className="public-list">
          <li>Authentication is managed by Firebase Auth.</li>
          <li>Access is restricted by Firestore security rules per user path.</li>
          <li>Data in transit uses HTTPS/TLS; data at rest uses Google Cloud encryption.</li>
          <li>AI calls are handled server-side through Cloud Functions to avoid exposing secrets.</li>
        </ul>
      </article>

      <article className="card stack">
        <h2>Third-party processors</h2>
        <p>
          FinSage uses Google Firebase and Google Gemini API infrastructure to provide hosting, storage,
          authentication, and assistant features.
        </p>
      </article>

      <article className="card stack">
        <h2>Your control</h2>
        <p>
          You can update or remove financial records in your account at any time. For account-level deletion
          requests, contact support from the Support page.
        </p>
      </article>
    </section>
  )
}
