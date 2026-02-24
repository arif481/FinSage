# FinSage Web App

FinSage is a production-focused personal finance app built with React + Firebase. It includes transaction tracking, budget planning, reports, and Gemini-powered assistant features through Firebase Cloud Functions.

## Stack

- Frontend: React 19, TypeScript, Vite, React Router, Recharts
- Backend: Firebase Auth, Firestore, Cloud Functions
- AI: Gemini API (server-side through callable Functions)
- CI/CD: GitHub Actions (GitHub Pages + Firebase deployment workflow)

## Core features

- Email/password and Google authentication
- Dashboard KPIs + charts
- Budget planning by category/month
- Transaction CRUD with CSV import/export
- AI category suggestion for transaction descriptions
- AI chat assistant with Firestore chat history
- Settings for theme/currency/notifications

## Local development

1. Install dependencies:

```bash
npm install
npm --prefix functions install
```

2. Create local env files:

```bash
cp .env.example .env
cp functions/.env.example functions/.env
```

3. Run frontend:

```bash
npm run dev
```

4. Optional emulator mode:

```bash
VITE_USE_EMULATORS=true npm run dev
firebase emulators:start
```

## Validation commands

```bash
npm run typecheck
npm run typecheck:functions
npm run lint
npm run test
npm run build
```

Rules tests:

```bash
npm run test:rules
```

`test:rules` uses Firestore Emulator and requires Java 21+.

## GitHub Secrets required

For `.github/workflows/deploy-pages.yml`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional but recommended)
- `VITE_RECAPTCHA_SITE_KEY` (optional unless App Check enabled on web)

For `.github/workflows/deploy-firebase-functions.yml`:

- `FIREBASE_TOKEN`
- `GEMINI_API_KEY`

## Deployment

- Frontend deploys to GitHub Pages from `main` via `.github/workflows/deploy-pages.yml`.
- Firebase Functions + Firestore rules/indexes deploy via `.github/workflows/deploy-firebase-functions.yml`.
- Firebase project is configured as `finsage-89a1c` in `.firebaserc`.

## Notes

- Gemini API key is never stored in frontend code; it is set as a Firebase Functions secret.
- AI category suggestion and assistant responses use real Gemini calls, with non-demo fallback behavior when service is unavailable.
