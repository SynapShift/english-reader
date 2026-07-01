# English Reader

English Reader is a responsive web reader for reading English books page by page, looking up words inline, and collecting vocabulary cards.

## Features

- Mobile and desktop reading layout
- Bookshelf, reader, and vocabulary tabs
- Page-by-page reading progress
- Tap a word to show a bottom-sheet style definition card
- Select longer text normally for copy and sharing
- Browser-local PDF, TXT, and Markdown import
- Vocabulary cards with examples and deletion
- Optional login and registration UI wired through a public API contract

## Live Demo

[Live Demo](https://english-reader-public-demo.pages.dev/)

## Architecture

The app is designed as a lightweight frontend that can work on its own for local reading, while leaving room for a separate API when you want account sync, uploaded-book storage, or richer dictionary services.

```txt
Browser
  -> English Reader web app
  -> Optional API for accounts, sync, uploads, and dictionaries
```

## Local Development

```bash
npm install
npm run dev
```

Optional API configuration:

```bash
cp .env.example .env.local
```

`VITE_PUBLIC_API_BASE` should point to a public-safe API endpoint. Never put database URLs, API keys, bucket names, admin hostnames, or secret values in frontend environment variables.

Run the full check before publishing:

```bash
npm run check
```

This runs the public-boundary scanner, linter, and production build.

## Deployment

The app can be deployed to any static hosting provider. Cloudflare Pages settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Optional environment variable: `VITE_PUBLIC_API_BASE`

The repository includes `public/_headers`, which Cloudflare Pages can publish as response headers for basic browser-side hardening.

## Privacy Boundary

This project keeps the public reader app separate from backend account and storage services. The frontend can call an API, but credentials, user content, provider keys, and operational data should stay in your own backend environment.

See:

- [Public/private boundary](docs/public-private-boundary.md)
- [Public API contract](docs/public-api-contract.md)
- [Cloudflare Pages deployment](docs/cloudflare-pages.md)

## License

MIT
