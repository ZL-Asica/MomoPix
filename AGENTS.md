# AGENTS.md

## 1) Project Overview and Goals

Momopix is a TanStack Start + Cloudflare Workers app for hosting and managing personal images/albums. It stores image binaries in **R2** and canonical metadata/state in **D1 (via Drizzle)**.

Primary goals:

- Reliable, fast image browsing and management (albums, search/filter/sort, bulk actions).
- Clear separation: **routes orchestrate**, **features render**, **services execute**, **adapters talk to Cloudflare**.
- Keep metadata consistent and queryable in **D1**; keep binaries and derived assets in **R2**.
- Provide a polished, accessible UI using **shadcn/ui** and TanStack primitives (Router/Start, Table, Form).

Key concepts:

- **Original vs converted/derived assets** (e.g., WebP variants) are first-class and must be represented consistently in metadata + UI.
- **Usage/accounting** (bytes used, image counts, album counts) must be correct and resilient to partial failures.

## 2) Tech Stack and Package Rules

Primary stack:

- TanStack Start (`@tanstack/react-start`) + TanStack Router.
- React + TypeScript + Vite.
- Cloudflare Workers runtime via Wrangler (`nodejs_compat`).
- Storage:
  - **D1** for metadata/state (Drizzle schema + migrations).
  - **R2** for image objects and derivatives.
- UI:
  - shadcn/ui primitives in `src/components/ui/*`
  - TanStack Table (`@tanstack/react-table`) for data grids
  - TanStack Form (`@tanstack/react-form`) for complex forms
- Validation:
  - Prefer Zod at all server/API boundaries.
- Tooling:
  - ESLint + TypeScript checks
  - Vitest for unit tests (keep runtime assumptions explicit)

Rules:

- Use only what is needed for the change.
- Prefer existing repo patterns/helpers over new abstractions.
- Keep platform bindings (D1/R2/env) out of UI components.
- Validate inputs before any D1 writes or R2 mutations.

## 3) Development Workflow

Use the scripts in `package.json` (names may vary; follow repo truth). Common expectations:

- `pnpm dev`: local dev
- `pnpm build`: production build
- `pnpm lint` / `pnpm lint:fix`
- `pnpm test` (Vitest)
- `pnpm deploy`: Wrangler deploy
- `pnpm cf-typegen`: regenerate Cloudflare bindings/types

Compatibility/runtime notes:

- Respect pinned Node + pnpm versions if the repo provides `.node-version` and `packageManager`.
- If Wrangler local state becomes flaky (e.g., `.wrangler` permission errors), restart dev processes and clear `.wrangler/` as a last resort.
- Keep `R2_PUBLIC_DOMAIN` (or equivalent) treated as required and build public URLs via shared helpers.

## 4) UI Architecture and Code Organization Standards

File size guidance:

- Target: under ~250 LOC for normal files.
- Soft limit: ~300–350 LOC (extract helpers/components).
- Hard limit: ~450 LOC (except generated files).

Separation of concerns:

- **Route files stay thin**: routing, loader wiring, composition only.
- **Business logic lives in** `src/features/**`, `src/functions/**`, and `src/lib/**`.
- **Presentational components** should be mostly declarative.

Preferred folder layout (adapt to current structure):

```text
src/
  routes/                      # thin entrypoints + route wiring
  features/
    <feature>/
      components/
      hooks/
      libs/                    # feature-scoped orchestration
      types.ts
  lib/
    cloudflare/                # bindings, env helpers, R2 helpers, runtime errors/types
    db/                        # Drizzle schema + D1 connection + query helpers
    storage/                   # domain services: albums/images/usage; D1+R2 orchestration
    schemas/                   # boundary schemas/validators (if used)
  components/
    ui/                        # shadcn/ui primitives
    layout/                    # app shells/layout components
```

New UI component rule:

- First check `src/components/ui/*`.
- If missing, add via shadcn tooling (install only what you need).
- Don’t introduce broad UI libraries when a shadcn/Radix pattern fits.

## 5) Forms & Tables

Forms:

- Use **TanStack Form** for complex forms (settings, upload flows, album edit, bulk actions).
- Keep validation schemas close to boundary handlers/services.
- Avoid ad-hoc form state when TanStack Form fits cleanly.

Tables:

- Use **TanStack Table** for image grids/lists where sorting/filtering/pagination matters.
- Keep column definitions in hooks/modules (not in route files).
- Prefer client-side sorting/pagination over “server-page = table-page” when header sorting must operate over the full result set.

Loading vs empty-state rule:

- Track lifecycle explicitly (`idle/loading/success/error`) plus a `hasLoadedOnce` marker.
- Do not render “No items” until you know the request completed successfully.

## 6) Cloudflare Runtime, D1/R2 Access, and Boundary Patterns

Boundary pattern (server functions / handlers):

- Keep handlers minimal:
  - auth check
  - input validation
  - call service/repo function
  - map/return response

Data access rules:

- **D1 is the source of truth** for metadata/state.
- **R2 is the source of truth** for binary objects.
- Do not scatter raw D1 SQL or `bucket.get/put/delete` calls across routes/components.
- Centralize:
  - D1 connection + Drizzle in `src/lib/db/*`
  - R2 helpers (key building, public URL building, content-type helpers) in `src/lib/cloudflare/*` or equivalent
  - domain orchestration (album/image/usage) in `src/lib/storage/*`

Pagination invariants:

- Use stable, deterministic ordering for listings (keyset pagination preferred).
- Keep cursor semantics consistent across endpoints (document the ordering key and tie-break).

Image URL invariants:

- Build public URLs through shared helpers (single source of truth).
- Never hardcode public domains in components.

## 7) Comments, TSDoc, and Readability

TSDoc requirements:

- Add TSDoc for exported functions/types in `src/lib/**` and domain services.
- Document:
  - inputs/outputs
  - invariants/assumptions
  - error cases / partial-failure behavior (especially for D1+R2 multi-step ops)

Comment requirements:

- Add concise “why” comments for tricky logic, especially:
  - multi-step writes (D1 insert + R2 put + derived generation)
  - retry/backoff or idempotency keys
  - usage recount / reconciliation logic
  - cursor pagination ordering and tie-break rules

Readability:

- Prefer small helpers over long inline branches.
- Keep boundary validation at the edges; keep internals strongly typed.

## 8) Testing Guidance (Critical)

Testing priorities:

- Unit test pure logic in `src/lib/**` (validators, key builders, reducers, cursor helpers).
- Keep tests deterministic and fast.
- Prefer structural assertions over brittle snapshots.

Cloudflare + Vitest constraints:

- Default to `node` environment unless the repo explicitly sets up a Workers test runtime.
- Mock boundaries:
  - D1/Drizzle calls (or wrap them behind repo interfaces and mock those)
  - R2 operations
  - Auth/session boundaries

- Avoid tests that require live Wrangler runtime, real D1, real R2, or network calls.

## 9) Tooling and MCP Usage Rules

TanStack:

- If unsure about TanStack Start/Router/Form/Table patterns, consult official TanStack docs first.
- Follow existing route/layout patterns in `src/routes/**`.

shadcn:

- Use shadcn tooling to add missing primitives.
- Install only what is required for the current change.

Sources:

- Prefer primary sources (official docs) and existing in-repo patterns.
- Don’t introduce patterns that conflict with TanStack Start + Cloudflare constraints.

## 10) Planning and Change Management

Planning rule for non-trivial work:

- Create a plan doc first under `/docs/`.
- Keep `/docs/` out of git-tracked user docs (prefer it in `.gitignore`).

Commit hygiene:

- Prefer phased, logically scoped commits (one logical change per commit).
- Use Conventional Commits only (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `style:`, `perf:`, `chore:`).
- Keep the commit subject short, direct, and descriptive:
  - Imperative mood ("add", "fix", "remove", "refactor").
  - Aim for ≤ 72 characters so GitHub doesn’t collapse/truncate it.
  - Avoid "misc", "wip", "update stuff", or vague summaries.
- Don’t include boilerplate like "tests green / all checks passed" in commits or PR text (that’s a prerequisite).
  - If there’s _non-obvious_ verification (manual steps), add a single `Verify:` line in the commit body.
- File mentions:
  - Wrap filenames/paths in backticks.
  - Prefer filenames only; allow at most two directory level when needed for disambiguation
    (e.g., `HomeFeature.tsx` or `home/components/HomeFeature.tsx`), not full repo paths.
- Commit body:
  - Use it for a small rationale snapshot (Why/What), and migration notes when relevant.
  - For D1 (Drizzle) schema/persistence contract changes, include migration notes in commit body and/or PR description.
- Don’t reference untracked plan docs. Keep commits self-contained; put a short rationale in the body or link a tracked ADR/PR.

AGENTS.md updates:

- Update this file when you change:
  - required env vars / bindings
  - storage schema/indexes/migrations
  - route contracts that affect contributors
  - core UI architecture conventions

PR snippet (copy into PR/description when relevant):

```md
### AGENTS.md Update

- Updated: <guideline / contract>
- Breaking: Yes/No
- Migration: <required steps, if any>
- New env var/binding: <name or N/A>
- Deprecated pattern: <old> -> <new>
```

## 11) Key Invariants and Do-Not-Break Rules

Auth + tenancy:

- All reads/writes must be scoped to the authenticated user.
- Never leak cross-user objects through D1 queries, R2 keys, or public URLs.

D1/R2 consistency:

- Multi-step operations must be resilient:
  - If D1 write succeeds but R2 fails (or vice versa), the system must recover (cleanup, retry, or mark for reconciliation).

- Avoid “best-effort silently wrong” states; prefer explicit error surfaces + repair paths.

Metadata correctness:

- Width/height, mime/type, and derived/original relationships must be accurate.
- If migrating legacy fields or backfilling dimensions, prefer idempotent jobs and safe re-runs.

Usage/accounting:

- `totalBytesUsed`, `totalImageCount`, and related counters must be consistent with canonical data.
- If using cached counters, provide a recount/reconcile path and document when it runs.
- `storage_quota` is maintained only by D1 triggers. Reserve capacity before
  uploading to R2, and retain that reservation until metadata is committed or
  the orphaned object has been deleted; never update the counter directly.

UI invariants:

- Keep routes thin; don’t embed D1/R2 calls in components.
- Keep tables/forms using TanStack Table/Form patterns (no parallel state systems for the same feature).
- Don’t show empty states until you have an explicit “loaded” marker.
