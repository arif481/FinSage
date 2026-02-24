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

## Firebase deploy (functions + rules)

Workflow: `.github/workflows/deploy-firebase-functions.yml`

Required repository secrets:
- `FIREBASE_TOKEN`
- `GEMINI_API_KEY`

Project target is set in `.firebaserc`.

## Manual deploy commands

```bash
npm --prefix functions install
npm run typecheck:functions
firebase deploy --only firestore:rules,firestore:indexes,functions --project finsage-89a1c
```
