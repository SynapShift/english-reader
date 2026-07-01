# Cloudflare Pages Deployment

Use Cloudflare Pages for the public reader website.

## Recommended setup

```txt
Project type: Pages
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Production branch: main
```

Environment variable:

```txt
VITE_PUBLIC_API_BASE=https://demo-api.example.com
```

Only use public-safe values in Pages environment variables. Never add database URLs, R2 credentials, API provider secrets, JWT secrets, or admin hostnames.

## Public repository flow

1. Create a public repository for this project.
2. Push only the public reader source.
3. Connect the repository to Cloudflare Pages.
4. Configure the build settings above.
5. Add `VITE_PUBLIC_API_BASE` only if a public-safe API exists.
6. Deploy.
7. Put the public site URL in the README.

## API split

For a public deployment, prefer a public-safe API gateway:

```txt
reader.example.com
  -> demo-api.example.com
  -> public books, rate-limited translation, account entry points
```

Keep sensitive implementation details private:

```txt
reader.example.com
  -> api.example.com
  -> authenticated user data, real persistence
```

## Headers

Cloudflare Pages will publish `public/_headers` as response headers.

Current goals:

- Block framing
- Disable unused browser permissions
- Restrict script and asset origins
- Keep API calls HTTPS-only

If a future feature needs another origin, add it deliberately to the Content Security Policy instead of using a broad wildcard.

## Before each public deploy

Run:

```bash
npm run check
```

Then review:

```txt
No .env.local committed
No storage implementation committed
No admin source committed
No Worker source committed
No real user data committed
No secrets in Pages environment variables
```
