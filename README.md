# FinSage

FinSage is a production-focused personal finance platform for transaction tracking, budgeting, reporting, and secure AI-assisted insights.

## Developer

Built and maintained by **Arif**.

## Product capabilities

- Secure authentication (email/password and Google sign-in)
- Real-time transaction and budget management
- Category-level spending analytics and monthly trends
- CSV import/export for transaction portability
- Gemini-powered assistant for categorization and chat analysis
- Accessible, responsive UI with theme and contrast support

## Technology stack

- Frontend: React 19, TypeScript, Vite, React Router, Recharts
- Backend: Firebase Auth, Firestore, Cloud Functions
- AI: Gemini API via callable Firebase Functions
- CI/CD: GitHub Actions for CI, GitHub Pages, and Firebase deploys

## Repository structure

```text
src/
  components/
  context/
  features/
  hooks/
  screens/
  services/
functions/
docs/
.github/workflows/
```

## Local setup

```bash
npm install
npm --prefix functions install
cp .env.example .env
cp functions/.env.example functions/.env
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm run typecheck:functions
npm run lint
npm run test
npm run build
```

Firestore rules tests (requires Java 21+):

```bash
npm run test:rules
```

## Deployment

- Frontend deployment: GitHub Pages workflow (`deploy-pages.yml`)
- Backend deployment: Firebase workflow (`deploy-firebase-functions.yml`)
- Release automation: Release Please workflow (`release-please.yml`)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full required secrets and operational steps.

## Security

- API secrets are stored only in GitHub/Firebase secrets, never client source.
- Firestore access is enforced by rules in [firestore.rules](firestore.rules).
- Vulnerability reporting policy: [SECURITY.md](SECURITY.md)

## Governance

- Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Change history: [CHANGELOG.md](CHANGELOG.md)
- License: [LICENSE](LICENSE)
