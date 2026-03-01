# Deployment Guide

## GitHub Pages (frontend)

Workflow: `.github/workflows/deploy-pages.yml`

Required repository secrets:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- `VITE_RECAPTCHA_SITE_KEY` (optional)

## Firebase deploy (rules + functions)

Firestore rules and Cloud Functions are deployed manually via the Firebase CLI.
The automated `deploy-firebase-functions.yml` workflow has been removed.

Required Firebase CLI setup:
- Logged in via `firebase login` with the project owner account
- Project ID: `finsage-89a1c`

### Deploy Firestore rules only

```bash
firebase deploy --only firestore:rules --project finsage-89a1c
```

### Deploy rules + indexes + functions

```bash
npm --prefix functions install
npm run typecheck:functions
firebase deploy --only firestore:rules,firestore:indexes,functions --project finsage-89a1c
```

Gemini API key must be set as a Firebase Functions secret:

```bash
firebase functions:secrets:set GEMINI_API_KEY --project finsage-89a1c
```

## Automated versioned releases

Workflow: `.github/workflows/release-please.yml`

- Runs on `main` pushes.
- Opens/updates a release PR based on conventional commits.
- After merge, creates version tag and GitHub Release.
