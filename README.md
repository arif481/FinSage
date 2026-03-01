# FinSage

FinSage is a production-focused personal finance platform for transaction tracking, budgeting, reporting, and secure AI-assisted insights.

## Developer

Built and maintained by **Arif**.

## Product capabilities

- Secure authentication (email/password and Google sign-in)
- Real-time transaction and budget management
- Custom category management with icons and colors
- Loan tracking with partial repayments and linked transactions
- Savings goals with progress tracking and status management
- Split expenses tracking with settlement workflow
- Recurring transaction rules (daily, weekly, monthly)
- Category-level spending analytics, monthly trends, and 14+ chart types
- CSV import/export for transaction portability
- Gemini-powered assistant for categorization and chat analysis
- Onboarding wizard for new users
- Command palette (Cmd+K) for quick navigation
- In-app notification center
- Financial health score, spending anomaly detection, and streak achievements
- Accessible, responsive UI with theme, contrast, and currency support

## Technology stack

- Frontend: React 19, TypeScript, Vite, React Router, Recharts
- Backend: Firebase Auth, Firestore, Cloud Functions
- AI: Gemini API via callable Firebase Functions
- CI/CD: GitHub Actions for CI, GitHub Pages, and Firebase deploys

## Repository structure

```text
src/
  app/            # AppProviders (auth + theme)
  components/     # charts/, common/, layout/, smart/
  constants/      # default categories
  context/        # AuthContext, ThemeContext
  features/       # budgets, chatbot, transactions
  hooks/          # useAuth, useCurrency, useFinanceCollections, useUserProfile, useTheme
  screens/        # 11 protected + 5 public screens
  services/       # ai/, csv/, firebase/, firestore/
  types/          # TypeScript domain types
  utils/          # finance calculations, formatting
functions/        # Firebase Cloud Functions (Gemini AI)
docs/             # Architecture, Deployment guides
.github/workflows/ # CI, GitHub Pages deploy, Release Please
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
- Firestore rules: manual deploy via `firebase deploy --only firestore:rules`
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
