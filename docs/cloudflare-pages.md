# Cloudflare Pages Deployment

English Reader is a Vite app, so it can be deployed to Cloudflare Pages or any static hosting provider.

## Recommended Settings

```txt
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Production branch: main
```

Optional environment variable:

```txt
VITE_PUBLIC_API_BASE=https://api.example.com
```

Leave `VITE_PUBLIC_API_BASE` unset if you only want the local-reading experience.

## Deploy From GitHub

1. Push the repository to GitHub.
2. Create a Cloudflare Pages project.
3. Connect the repository.
4. Use the Vite settings above.
5. Deploy.

## Response Headers

The `public/_headers` file adds basic browser-side hardening when deployed on Cloudflare Pages:

- Blocks framing
- Disables unused browser permissions
- Keeps scripts and assets scoped to expected origins
- Allows HTTPS API calls

If you connect a custom API or asset host later, update the Content Security Policy deliberately rather than using a broad wildcard.

## Preflight Check

Before publishing changes, run:

```bash
npm run check
```
