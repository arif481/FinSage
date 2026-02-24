export const SupportScreen = () => {
  return (
    <section className="public-page stack">
      <header className="public-page__header">
        <h1>Support</h1>
        <p>Need help with access, data issues, or bug reports? Use the channels below.</p>
      </header>

      <article className="card stack">
        <h2>Support channels</h2>
        <ul className="public-list">
          <li>
            GitHub issues:{' '}
            <a className="inline-link" href="https://github.com/arif481/FinSage/issues" rel="noreferrer" target="_blank">
              github.com/arif481/FinSage/issues
            </a>
          </li>
          <li>Developer: Arif (GitHub: arif481)</li>
        </ul>
      </article>

      <article className="card stack">
        <h2>When reporting an issue</h2>
        <ul className="public-list">
          <li>Include date/time, browser, and steps to reproduce.</li>
          <li>Include screenshots only after masking sensitive financial details.</li>
          <li>Mention whether the issue is Auth, Firestore data, AI response, or UI behavior.</li>
        </ul>
      </article>

      <article className="card stack">
        <h2>Account and data requests</h2>
        <p>
          For account deletion or data access requests, open a private support request and include your account
          email.
        </p>
      </article>
    </section>
  )
}
