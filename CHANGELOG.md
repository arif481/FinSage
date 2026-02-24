# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0](https://github.com/arif481/FinSage/compare/finsage-web-v0.2.0...finsage-web-v0.3.0) (2026-02-24)


### Features

* bootstrap FinSage web app with Firebase, Gemini functions, and rules tests ([0112bbd](https://github.com/arif481/FinSage/commit/0112bbd9d14cce61754e8bea71fb19ed88485ddb))
* elevate product UX and repository governance ([d5f5daa](https://github.com/arif481/FinSage/commit/d5f5daad0619916112734357add4e87dcc56b765))

## [0.2.0] - 2026-02-24

### Added
- Public product pages: About, Privacy, Terms, Support, and custom Not Found route.
- GitHub Pages deployment workflow with environment-driven frontend build settings.
- Firebase deployment workflow for Firestore rules/indexes and Cloud Functions.
- Firestore security rules test harness and CI automation.
- Repository governance docs: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.

### Changed
- Upgraded visual design system for stronger product identity and mobile polish.
- Improved authenticated shell with support links and developer attribution.
- Updated AI service behavior to avoid demo-style local category heuristics.
- Hardened Firebase environment requirements to avoid runtime placeholder config.

### Removed
- Tracked generated artifacts under `functions/lib`.

## [0.1.0] - 2026-02-24

### Added
- Initial FinSage app architecture and production baseline.
