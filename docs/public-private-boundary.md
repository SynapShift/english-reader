# Project Boundary

English Reader is built as a public web app first. It can run locally with the bundled sample content, and it can optionally connect to an API for account features, reading sync, uploaded books, and dictionary enrichment.

The main idea is simple:

```txt
English Reader web app
  -> optional API
  -> your own account, sync, storage, and dictionary services
```

For contributors, that means frontend work belongs here: reading UI, bookshelf interactions, local import behavior, word-card UX, public API client code, and documentation.

Backend choices are intentionally left open. A hosted app might use Cloudflare, Supabase, Firebase, a custom server, or something else entirely. Keep credentials, user content, provider keys, and operational data in whichever backend environment you control, not in the frontend repository.

Before publishing a fork, run:

```bash
npm run check
```

That command includes a lightweight boundary scan, linting, and a production build.
