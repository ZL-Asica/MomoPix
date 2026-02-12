# MomoPix Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/ZL-Asica/MomoPix/compare/v1.0.0-beta.1...HEAD)

## [1.0.0-beta.1] - 2026-02-10

### Added

- Auth-gated dashboard workflow for album/image management, including album tree navigation, usage summary, upload, search, and move/delete flows.
- Dashboard bulk and row-level image actions, including rename, move, delete, and copy-link operations.
- Client-side table features for dashboard browsing, including lazy image loading, pagination controls, and shift-range multi-select.
- Expanded home workflow with structured upload/transform/result components, upload-selected flow, and uploaded-links panel.
- Session-based login/logout routes and guards, plus Cloudflare Turnstile-backed auth checks.
- Cloudflare D1 database layer with Drizzle schema and cursor helpers, plus initial SQL migration and setup documentation.
- Public image URL helper using `R2_PUBLIC_DOMAIN` for direct R2-hosted image links.

### Changed

- **Breaking:** migrated app runtime from Next.js/OpenNext to TanStack Start (Vite + Cloudflare Workers), with route/config structure updated to the new framework.
- **Breaking:** switched metadata persistence from KV to D1; KV storage helpers were removed and D1 schema/migration is now required.
- Dashboard data flow now aggregates full query results before table sorting/pagination, improving consistent client-side ordering and page behavior.
- Home page behavior keeps anonymous compression and adds authenticated compress-and-upload workflow with selection-driven actions.
- Frontend architecture was reorganized into feature-oriented modules (`src/features/*`) with thinner route entrypoints and extracted hooks/services.
- UI primitives and action states were standardized across home/dashboard flows (loading, error, and action feedback improvements).

### Removed

- Changesets release tooling and config (`.changeset/*`, `@changesets/cli`) in favor of the current release workflow.
- Legacy Next.js app/api files and related OpenNext-only runtime paths.

### Fixed

- Image dimension detection during uploads now reads metadata more reliably.
- Dashboard menu markup no longer uses nested button patterns that caused invalid structure and interaction issues.
- Dashboard loading and empty-state behavior was corrected to avoid premature "empty" rendering during fetch transitions.

### Security

- Protected album/image mutation paths behind authenticated server-side guards.

## [0.1.0] - 2025-05-17

### Added

- Initial home page image transform flow.

### Changed

- Migrated frontend from React SPA structure to Next.js (OpenNext on Cloudflare) for the first hosted release architecture.

[0.1.0]: https://github.com/ZL-Asica/MomoPix/releases/tag/v0.1.0
[1.0.0-beta.1]: https://github.com/ZL-Asica/MomoPix/compare/v0.1.0...v1.0.0-beta.1
