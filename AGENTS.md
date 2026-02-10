# AGENTS.md

## 1. Project Principles

This repo runs on Cloudflare (Workers runtime + D1/R2) with TanStack Start and shadcn/ui.

- Do:
  - Keep route files thin. Put UI, hooks, and domain logic in feature/lib modules.
  - Build from composition: small components, focused hooks, explicit boundaries.
  - Prefer existing repo patterns over one-off abstractions.
  - Keep Cloudflare adapters generic and domain services explicit.
- Don't:
  - Put storage details directly into route components.
  - Mix UI state management with persistence logic in the same module.
  - Create parallel patterns when existing helpers/components already fit.

Short target: routes orchestrate, features render, services execute, adapters talk to platform.

## 2. Code Organization

Use feature-oriented folders plus clear library boundaries.

- Do:
  - Keep cross-feature/platform utilities in `src/lib/*`.
  - Keep feature behavior in dedicated domain services (currently `src/lib/storage/*`).
  - Keep shadcn/ui primitives in `src/components/ui/*`.
  - Keep shared app-level shells in `src/components/layout/*`.
  - Keep route modules as entrypoints only (`src/routes/*`).
- Don't:
  - Use `src/lib` or `src/features` as a dumping ground.
  - Hide domain writes/reads in random component files.
  - Add broad "utils" files with unrelated helpers.

Preferred layout (adapt to existing structure):

```text
src/
  routes/
    *.tsx                     # thin route orchestration
  features/
    <feature>/
      components/
      hooks/
      services/               # feature-scoped domain orchestration
      types.ts
  lib/
    cloudflare/               # runtime-generic adapters (D1/R2/bindings/errors/types)
    storage/                  # domain services for storage orchestration (albums/images/usage) and related types/validators
    db/                       # Drizzle schema + D1 connection + cursor helpers
  components/
    ui/                       # shadcn/ui primitives
    layout/
```

## 3. React & UI Conventions

Use React composition and shadcn/ui first.

- Do:
  - Prefer shadcn/ui components from `src/components/ui/*` before creating new primitives.
  - Keep container logic in hooks/services and keep presentational components mostly declarative.
  - Co-locate feature hooks with their feature (`src/features/<feature>/hooks/*`).
  - Include accessible labels/roles and keyboard-friendly interactions.
- Don't:
  - Rebuild button/input/table/dialog primitives without a clear gap.
  - Keep long imperative workflows inside JSX-heavy files.
  - Couple component rendering directly to Cloudflare bindings.

### Loading vs Empty States

- Do:
  - Track list request lifecycle explicitly (`idle`, `loading`, `success`, `error`) instead of inferring from array length.
  - Keep a loaded marker (`hasLoadedOnce` per view or album) and render empty states only after that marker is true.
  - Use `useTransition` for user-triggered view changes (album/page/search/page-size), while still using explicit fetch lifecycle flags for data readiness.
- Don't:
  - Render “No items” just because `items.length === 0` before a fetch has completed.
  - Treat `useTransition` pending state as the only source of truth for async fetch completion.

Example:

```tsx
const showInitialSkeleton = !hasLoadedOnce && (status === 'idle' || status === 'loading')
if (showInitialSkeleton) return <TableSkeleton />
if (status === 'error') return <ErrorState />
if (hasLoadedOnce && items.length === 0) return <EmptyState />
return <ItemsTable rows={items} />
```

### Dashboard Data Semantics

- Do:
  - For `/dashboard` image browsing, aggregate the full album/query metadata set before table rendering, then apply TanStack client-side sorting and pagination slices.
  - Keep server cursor pagination as a transport mechanism for aggregation loops, not as table page semantics.
  - Reset page index on query/sort/page-size changes so displayed slices stay consistent with user intent.
- Don't:
  - Pre-slice server results and pass only one page into the table when header sorting must operate across the full result set.
  - Couple empty-state rendering to `items.length` without explicit fetch lifecycle state (`hasLoadedOnce`, `isFetching`, `status`).

Example (thin route):

```tsx
export const Route = createFileRoute('/example')({
  component: ExampleRoute,
})

function ExampleRoute() {
  return <ExampleFeature />
}
```

## 4. Forms & Tables

TanStack Form for forms, TanStack Table for tabular data.

- Do:
  - Build forms with `@tanstack/react-form` for state, validation flow, and submission wiring.
  - Build data grids/lists with `@tanstack/react-table` and keep column definitions in hooks/modules.
  - Keep form schemas and validators close to server/domain boundaries.
- Don't:
  - Introduce ad-hoc form state patterns for complex forms where TanStack Form fits.
  - Put table column/business logic directly in route files.

Example (table setup in hook):

```tsx
export function useItemsTable(data: ItemRow[]) {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
}
```

## 5. Documentation (TSDoc) Standards

Add TSDoc/JSDoc for important exported APIs.

- Do:
  - Document exported/public functions, types, and constants that are reused or non-trivial.
  - Cover purpose, key params, return shape, and side effects when relevant.
  - Keep comments concise and behavior-focused.
- Don't:
  - Add noisy comments for obvious code.
  - Leave critical exported logic undocumented.

Example:

```ts
/**
 * Persists image metadata row in D1.
 *
 * @param db D1 database binding.
 * @param image Canonical image record.
 */
export async function putImageRecords(...) {}
```

## 6. Cloudflare Runtime & Data Access

Separate platform adapters from Momopix domain logic.

- Do:
  - Keep Cloudflare-generic helpers in `src/lib/cloudflare/*` (bindings, R2 helpers, runtime errors/types).
  - Keep D1/Drizzle helpers in `src/lib/db/*` and domain orchestration in `src/lib/storage/*`.
  - Keep Momopix repositories/services in domain modules (`src/lib/storage/*` today; `src/lib/momopix/*` if introduced).
  - Keep `createServerFn` handlers minimal: auth check, validation, call service/repo functions, map response.
  - Validate inputs before mutations.
  - Treat `R2_PUBLIC_DOMAIN` as required for all runtimes (dev/prod) and build image URLs through shared helpers.
  - Keep image listing cursor semantics keyset-based `(created_at DESC, id DESC)` for stable pagination.
- Don't:
  - Scatter raw D1 SQL and `bucket.get/put/delete` calls across UI/routes.
  - Encode domain naming/index rules in UI components.
  - Mix Cloudflare binding lookup and complex business logic in large route files.

Example (minimal server function):

```ts
export const updateThingFn = createServerFn({ method: 'POST' })
  .inputValidator(updateThingSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()
    return updateThing(db, data)
  })
```

## 7. Change Management & AGENTS.md Auto-Updates

Policy: if you introduce breaking changes to architecture/contract patterns, update this file in the same PR/commit.

Breaking changes (must update `AGENTS.md`):

- Route or route-group renames that change navigation contracts for contributors.
- Storage schema/key/index shape changes (D1/R2 metadata, record contracts, migration requirements).
- New/renamed required environment variables or Cloudflare bindings.
- Required UI architecture pattern shifts (for example replacing shadcn/TanStack Form/Table conventions).
- Major folder boundary changes (for example moving domain layer from `src/lib/storage` to `src/lib/momopix`).

Non-breaking changes (usually no `AGENTS.md` update):

- Internal refactors with unchanged external contracts.
- Styling/layout polish without changing architectural conventions.
- Bug fixes within existing module boundaries.
- Additive UI components following current patterns.

Template snippet for updates (paste into PR description and update this file as needed):

```md
### AGENTS.md Update

- Updated: <architecture/storage/runtime guideline>
- Breaking: Yes/No
- Migration: <required steps, if any>
- New env var/binding: <name or N/A>
- Deprecated pattern: <old pattern> -> <new pattern>
```

## 8. Pre-merge Checklist

Before merging, all items below should pass.

- Do:
  - Run gates: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
  - Keep route files thin and move reusable logic into feature/lib modules.
  - Check file-size guardrails:
    - Preferred: keep files under ~250 lines, no mix of UI + domain logic.
    - Hard warning: if a file grows past ~400 lines, split by responsibility.
  - Enforce folder hygiene:
    - If a folder exceeds ~10-15 files, create subfolders by role (`components`, `hooks`, `services`, `types`).
  - Extract duplicated logic when similar logic appears 2+ times.
  - Ensure important exported APIs include TSDoc.
- Don't:
  - Merge when any gate fails.
  - Add new storage/platform access paths without shared helpers.
  - Leave mixed concerns (UI + storage + runtime bindings) in one large file.
