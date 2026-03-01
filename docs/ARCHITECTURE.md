# FinSage Architecture

## Overview

FinSage is a React + Firebase application with a feature-oriented frontend and serverless backend.

## Frontend

- React 19 with TypeScript and route-level lazy loading.
- Auth, theme, and feature state handled via hooks/context + Firestore subscriptions.
- Feature directories separate transaction, budget, chat, and reporting concerns.
- 11 protected screens and 5 public screens with code-split lazy loading.
- 14+ Recharts-based visualization components on the dashboard.
- Smart components: financial health score, spending anomaly detection, streak achievements.
- Onboarding wizard, command palette (Cmd+K), and notification center.

## Backend

- Firebase Auth for user identity.
- Firestore for profile, categories, budgets, transactions, loans, savings goals, split expenses, recurring rules, and chat history.
- Cloud Functions for Gemini-assisted categorization and chat responses.
- Firestore security rules enforce owner/collaborator access boundaries with field-level validation.

## Data model

Root path:
- `users/{uid}`

Subcollections:
- `transactions/{txnId}`
- `categories/{categoryId}`
- `budgets/{budgetId}`
- `loans/{loanId}`
- `savingsGoals/{goalId}`
- `splitExpenses/{splitId}`
- `recurringRules/{ruleId}`
- `chatHistory/{messageId}`
- `insights/{insightId}`

## Security controls

- Firestore rules in `firestore.rules` with comprehensive field-level validation for all collections.
- Owner and collaborator access model with per-collection granularity.
- App Check support via reCAPTCHA when configured.
- Gemini API key stored as Firebase Functions secret.
