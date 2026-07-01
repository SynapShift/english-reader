# English Reader

English Reader is a responsive web reader for reading English books page by page, looking up words inline, and collecting vocabulary cards.

The repository contains the public web app only. User accounts, password storage, uploaded books, reading progress sync, vocabulary sync, dictionary provider keys, and admin tools must live in a separate private API service.

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

```txt
Browser
  -> Public web app
  -> Optional public API gateway
  -> Private services for auth, storage, sync, dictionaries, and admin tools
```

This repository may include:

- Reader UI and client-side interactions
- Public-domain sample book files
- API client functions and public API contracts
- Deployment documentation for the public web app

This repository must not include:

- Password hashing or token signing implementation
- User database schema, migrations, dumps, or backups
- Cloudflare Worker source for user-data storage
- R2, KV, D1, database URLs, provider keys, or secrets
- Admin dashboard source or private admin routes
- Real user uploads, logs, exports, or analytics dumps

## Public Book Files

Public-domain or sample books can be published as versioned static JSON files under `public/books`.

Current sample book artifact:

- `public/books/pride-and-prejudice.v1.json`

Keep `book.id` stable across versions so reading progress remains attached to the same book. When text is corrected or regenerated, publish a new file such as `pride-and-prejudice.v2.json` and update only the public metadata pointer.

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

Login, registration, sync, and upload flows are intentionally frontend-only in this repository. The public app can call a backend, but the backend implementation must be kept in a separate private repository or private deployment.

See:

- [Public/private boundary](docs/public-private-boundary.md)
- [Public API contract](docs/public-api-contract.md)
- [Cloudflare Pages deployment](docs/cloudflare-pages.md)

## License

MIT
