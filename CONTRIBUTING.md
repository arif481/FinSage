# Contributing

Thanks for contributing to FinSage.

## Development workflow

1. Create a feature branch from `main`.
2. Keep changes focused and atomic.
3. Add or update tests for behavior changes.
4. Run local checks before opening a PR.

## Local checks

```bash
npm install
npm --prefix functions install
npm run typecheck
npm run typecheck:functions
npm run lint
npm run test
npm run build
```

Rules tests require Java 21+:

```bash
npm run test:rules
```

## Pull request requirements

- Clear title and summary of what changed.
- Risk and rollback notes for backend/security changes.
- Screenshots for UI changes.
- Linked issue when applicable.
- Conventional commit style for release automation (`feat:`, `fix:`, `chore:`, etc.).

## Code standards

- Prefer explicit types and small composable modules.
- Keep UI components presentation-focused; move logic to hooks/services.
- Never commit secrets or `.env` files.
- Preserve accessibility behaviors (keyboard navigation and semantic labels).
