# Public API Contract

This contract describes the HTTPS API surface that the public reader may call.

The implementation must live outside this repository, usually in separately deployed Cloudflare Workers. Do not add Worker source, storage code, database schema, migrations, or secrets to this public site.

## Base URL

The public site reads the base URL from:

```txt
VITE_PUBLIC_API_BASE=https://demo-api.example.com
```

The value should point to a public-safe API gateway. It must not reveal internal hostnames, admin routes, private bucket names, or database details.

## GET /public/books

Returns public book summaries for the bookshelf.

Response:

```json
[
  {
    "id": "secret-garden",
    "title": "The Secret Garden",
    "author": "Frances Hodgson Burnett",
    "level": "B1",
    "summary": "A quiet classic for building vocabulary around nature.",
    "coverUrl": "https://assets.example.com/covers/secret-garden.jpg"
  }
]
```

Rules:

- Return only public, listed books
- Do not include storage bucket names
- Do not include original source file paths
- Do not include unpublished admin metadata

## GET /public/books/:bookId

Returns public reading content for one book.

Response:

```json
{
  "id": "secret-garden",
  "title": "The Secret Garden",
  "author": "Frances Hodgson Burnett",
  "level": "B1",
  "summary": "A quiet classic for building vocabulary around nature.",
  "coverUrl": "https://assets.example.com/covers/secret-garden.jpg",
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Chapter 1",
      "order": 1,
      "content": [
        "When Mary Lennox was sent to Misselthwaite Manor..."
      ]
    }
  ]
}
```

Rules:

- Return display-ready content only
- Keep source files and import metadata private
- Apply any copyright or licensing restrictions before returning content

## POST /translate

Returns a word translation.

Request:

```json
{
  "word": "curiosity",
  "context": "For the first time, curiosity warmed her more than anger.",
  "bookId": "secret-garden",
  "chapterId": "chapter-2"
}
```

Response:

```json
{
  "word": "curiosity",
  "phonetic": "/kyoo-ree-os-i-tee/",
  "meaning": "好奇心",
  "example": "Curiosity made her open the old box."
}
```

Rules:

- Rate limit by IP, user, or session
- Cache common results in the private API layer
- Do not expose provider keys to the browser
- Do not return internal provider logs
- Dictionary providers, caching, and bilingual enrichment belong in the private API layer

## POST /auth/register

Creates an account.

Request:

```json
{
  "email": "reader@example.com",
  "password": "at-least-8-characters"
}
```

Response:

```json
{
  "token": "session-token",
  "user": {
    "id": "user-id",
    "email": "reader@example.com"
  }
}
```

Rules:

- Do not implement password storage in this public repository
- Do not expose password hashes, salts, database bindings, or token signing logic
- Return only user-safe account fields

## POST /auth/login

Signs in an existing account.

Request:

```json
{
  "email": "reader@example.com",
  "password": "at-least-8-characters"
}
```

Response:

```json
{
  "token": "session-token",
  "user": {
    "id": "user-id",
    "email": "reader@example.com"
  }
}
```

## GET /auth/me

Returns the current signed-in user.

Headers:

```txt
Authorization: Bearer session-token
```

Response:

```json
{
  "user": {
    "id": "user-id",
    "email": "reader@example.com"
  }
}
```

## Authenticated endpoints

Authenticated user endpoints can exist behind the same API gateway, but they must still be implemented outside this repository.

Examples:

```txt
GET /me/progress
PUT /me/progress
GET /me/vocabulary
POST /me/vocabulary
DELETE /me/vocabulary/:word
POST /me/books/import
```

Rules:

- Require authentication
- Use CORS allowlists
- Never trust client-provided user IDs
- Keep persistence, authorization, and schema details private

## POST /me/books/import

Uploads a user-owned book file or text payload. This endpoint must be implemented in a private Cloudflare Worker or another private backend, not in this public repository.

Request options:

```txt
multipart/form-data with file
application/json with title and text
```

Response:

```json
{
  "bookId": "user-book-123",
  "status": "processing"
}
```

Rules:

- Require authentication
- Enforce file size limits
- Accept only supported formats such as PDF, TXT, Markdown, and later EPUB
- Store original files in private object storage
- Run parsing, OCR when needed, moderation, and copyright checks outside the public frontend
- Return only user-safe status data to the browser

## Admin endpoints

Do not expose admin endpoint names in this repository. Admin behavior should live behind a separate private hostname protected by Cloudflare Access.
