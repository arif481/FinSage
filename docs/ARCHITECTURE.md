# FinSage Architecture

## Overview

FinSage is a React + Firebase application with a feature-oriented frontend and serverless backend.

## Frontend

- React 19 with TypeScript and route-level lazy loading.
- Auth, theme, and feature state handled via hooks/context + Firestore subscriptions.
- Feature directories separate transaction, budget, chat, and reporting concerns.

## Backend

- Firebase Auth for user identity.
- Firestore for profile, categories, budgets, transactions, and chat history.
- Cloud Functions for Gemini-assisted categorization and chat responses.
- Firestore security rules enforce owner/collaborator access boundaries.

## Data model

Root path:
- `users/{uid}`

Subcollections:
- `transactions/{txnId}`
- `categories/{categoryId}`
- `budgets/{budgetId}`
- `chatHistory/{messageId}`
- `insights/{insightId}`

## Security controls

- Firestore rules in `firestore.rules`.
- App Check support via reCAPTCHA when configured.
- Gemini API key stored as Firebase Functions secret.
