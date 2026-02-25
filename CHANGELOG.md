# Changelog

All notable changes to this project will be documented in this file.

## [0.9.1](https://github.com/arif481/FinSage/compare/finsage-web-v0.9.0...finsage-web-v0.9.1) (2026-02-25)


### Bug Fixes

* resolve firebase payload crash on loans creation and deploy missing firestore rules ([11dbb40](https://github.com/arif481/FinSage/commit/11dbb40e1e270ee3a21f53e88738c114a9da9070))

## [0.9.0](https://github.com/arif481/FinSage/compare/finsage-web-v0.8.0...finsage-web-v0.9.0) (2026-02-25)


### Features

* smart visuals pack 3 — treemap, speedometer, scatter, projection ([29a7b92](https://github.com/arif481/FinSage/commit/29a7b928438e8fb691b5bba06d816fba6a93f384))


### Bug Fixes

* resolve eslint type warnings in recharts tooltips ([0152251](https://github.com/arif481/FinSage/commit/0152251289399745c3f478f7f527e60e24ee06f5))

## [0.8.0](https://github.com/arif481/FinSage/compare/finsage-web-v0.7.0...finsage-web-v0.8.0) (2026-02-25)


### Features

* phase 3 — loan tracking, smarter AI, enhanced dashboard ([9695258](https://github.com/arif481/FinSage/commit/96952586af3796465ae42fff7bb0987959be2dd9))


### Bug Fixes

* add Firestore rules for loans subcollection ([e7559a4](https://github.com/arif481/FinSage/commit/e7559a42eee9e4f70378ad65ff902406387ff75e))
* remove fake fallback scores from Financial Health Score ([0fc88b9](https://github.com/arif481/FinSage/commit/0fc88b94f41fd202fa3899ef04c0d67f2f693c8e))

## [0.7.0](https://github.com/arif481/FinSage/compare/finsage-web-v0.6.0...finsage-web-v0.7.0) (2026-02-25)


### Features

* phase 2 smart features — health score, anomalies, achievements ([accc247](https://github.com/arif481/FinSage/commit/accc247889a3a40f827d3c05f059e4264f365070))

## [0.6.0](https://github.com/arif481/FinSage/compare/finsage-web-v0.5.1...finsage-web-v0.6.0) (2026-02-25)


### Features

* modern UI overhaul + smart charts & analytics ([cd0c5f6](https://github.com/arif481/FinSage/commit/cd0c5f655d6efd914911824b18070b710e0b514f))
* **ui:** implement futuristic ui overhaul, glowing glassmorphism, cmd+k palette, and ai forecast ([74608cb](https://github.com/arif481/FinSage/commit/74608cb132550470cc1cc35b0ca5d949381eeabe))


### Bug Fixes

* resolve eslint errors in chart formatters and finance utils ([ea25c83](https://github.com/arif481/FinSage/commit/ea25c832fdaac6e1ae597c138578ddd19263b5ff))

## [0.5.1](https://github.com/arif481/FinSage/compare/finsage-web-v0.5.0...finsage-web-v0.5.1) (2026-02-24)


### Bug Fixes

* **auth:** use signInWithPopup instead of redirect for google auth ([53e32eb](https://github.com/arif481/FinSage/commit/53e32eb3a058c56f9fa5306f0cb0520a3e0b71f9))

## [0.5.0](https://github.com/arif481/FinSage/compare/finsage-web-v0.4.0...finsage-web-v0.5.0) (2026-02-24)


### Features

* Deploy FinSage to GitHub Pages ([#6](https://github.com/arif481/FinSage/issues/6)) ([e4198cc](https://github.com/arif481/FinSage/commit/e4198cce2abe56af5a5202fb11d9401a7942b9ac))

## [0.4.0](https://github.com/arif481/FinSage/compare/finsage-web-v0.3.1...finsage-web-v0.4.0) (2026-02-24)


### Features

* harden firestore rules and elevate product UI ([#4](https://github.com/arif481/FinSage/issues/4)) ([a15c66f](https://github.com/arif481/FinSage/commit/a15c66fe7b405ab7a290aaa2ab27c7bb903835f3))

## [0.3.1](https://github.com/arif481/FinSage/compare/finsage-web-v0.3.0...finsage-web-v0.3.1) (2026-02-24)


### Bug Fixes

* harden auth and firestore listeners for production errors ([facc425](https://github.com/arif481/FinSage/commit/facc42510bac55acc207757e88baabb1d3872980))

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
