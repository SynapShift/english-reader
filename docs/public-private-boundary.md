# Public and Private Boundary

This project is the public reader experience only. Keep it safe to publish.

## Allowed in this repository

- Reader UI and responsive layout
- Demo book content
- Public API client functions
- Login and registration UI
- Public authentication API contract
- Cloudflare Pages configuration
- Documentation for deployment boundaries

## Not allowed in this repository

- Cloudflare Worker source that stores user data
- Password hashing, token signing, or account persistence code
- Admin dashboard source
- Database schema, migrations, or SQL dumps
- R2, KV, D1, Neon, Supabase, or translation provider secrets
- Private bucket names or internal service names
- Real user exports, logs, analytics dumps, or backups

## API rule

The public site may know only one public base URL:

```txt
VITE_PUBLIC_API_BASE=https://demo-api.example.com
```

The actual implementation behind that URL must be deployed separately.

## Recommended runtime split

```txt
Cloudflare Pages
  Public reader website

Cloudflare Worker
  Public API
  Authenticated user API
  Translation proxy
  Storage and database access

Cloudflare Access
  Private admin website and admin APIs
```

## Review checklist before publishing

- No `.env.local` or `*.local` files are committed
- No database URLs are present
- No API keys are present
- No Worker source code for user-data persistence is present
- No admin URLs are documented in public README copy
- `VITE_PUBLIC_API_BASE` points to demo or public-safe API behavior
