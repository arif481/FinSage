# FinSage Web App

FinSage is a personal finance web app built with React + Firebase. It provides transaction tracking, budget planning, analytics dashboards, CSV import/export, and an AI assistant workflow designed for Gemini integration through Firebase Functions/AI Logic.

## Stack

- Frontend: React 19, TypeScript, React Router, Recharts
- Backend: Firebase Auth, Firestore, Cloud Functions, Hosting
- AI integration: Callable Functions using Gemini API (with safe fallback paths)
- Tooling: ESLint, Prettier, Vitest, Testing Library

## Features in this baseline

- Authentication screens (email/password and Google auth wiring)
- Dashboard with KPI cards, category pie chart, monthly trend chart
- Transaction management (add/edit/delete/search/filter)
- CSV import/export pipeline for transactions
- Budget planner by month and category with progress tracking
- Chat UI backed by Firestore chat history + callable AI endpoint
- Reports screen with trend and category insights
- Settings (theme, contrast, currency, notification preferences)
- Feature-centric folder architecture and reusable services/hooks

## Project layout

```text
src/
  app/
  components/
  constants/
  context/
  features/
  hooks/
  screens/
  services/
  types/
  utils/
functions/
firestore.rules
firestore.indexes.json
firebase.json
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template and fill Firebase values:

```bash
cp .env.example .env
```

3. Run app:

```bash
npm run dev
```

4. Optional emulator mode:

```bash
VITE_USE_EMULATORS=true npm run dev
firebase emulators:start
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Firebase deployment notes

- `firestore.rules` enforces owner/collaborator scoped access under `/users/{uid}/...`
- `firestore.indexes.json` includes budget/transaction query indexes
- `functions/src/index.ts` has Gemini-backed callable functions:
  - `classifyExpense`
  - `financeChat`

To deploy Functions with secrets:

```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting
```

Optional runtime model overrides for Functions can be set in `functions/.env`:

```bash
cp functions/.env.example functions/.env
```

## Additional checks

```bash
npm --prefix functions install
npm run typecheck:functions
npm run test:rules
```

`test:rules` uses Firebase Firestore Emulator and requires Java 21+.

## Next implementation tasks

1. Replace Gemini REST calls with Firebase AI Logic once your project is fully configured for it.
2. Add end-to-end tests for auth, transaction CRUD, and chat flow.
3. Add advanced prompt/guardrail evaluation for financial advice quality.
