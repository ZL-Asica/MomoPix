# Database Setup (Cloudflare D1 + Drizzle)

This project stores image metadata in Cloudflare D1 and image bytes in R2.

## 1. Configure Wrangler bindings

Add D1 bindings in `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "momopix",
      "database_id": "<PROD_DB_ID>",
      "migrations_dir": "migrations",
      "remote": true
    }
  ]
}
```

## 2. Login to Wrangler CLI

```bash
pnpm exec wrangler login
```

## 3. Create/apply migrations

Create migration files:

```bash
pnpm exec wrangler d1 migrations create DB init
```

Apply migrations locally:

```bash
pnpm exec wrangler d1 migrations apply DB --local
```

Apply migrations to remote production:

```bash
pnpm exec wrangler d1 migrations apply DB --remote
```

## 4. Refresh generated Cloudflare binding types

```bash
pnpm run cf-typegen
```

## 5. Local dev workflow

Start app:

```bash
pnpm dev
```

The app bootstraps the default album (`alb_root`, name `Default`) automatically when DB is empty.

Reset local DB metadata:

```bash
pnpm exec wrangler d1 execute DB --local --command "DELETE FROM images; DELETE FROM albums;"
```

## 6. Troubleshooting

- `Required Cloudflare binding "DB" is not configured`:
  - Ensure `d1_databases` binding is present in `wrangler.jsonc` for the active env.
- `no such table: ...`:
  - Migration has not been applied in that environment (`--local` vs `--remote` / `-e dev`).
- URLs are null or URL generation fails:
  - Ensure `R2_PUBLIC_DOMAIN` is configured and absolute.
- Runtime type mismatch after binding updates:
  - Run `pnpm run cf-typegen` again.
