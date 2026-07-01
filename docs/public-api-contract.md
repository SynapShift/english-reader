# Public API Contract

English Reader can work without an API for local reading. If you want account login, synced progress, uploaded books, or a stronger dictionary, point the app at an API with:

```txt
VITE_PUBLIC_API_BASE=https://api.example.com
```

The API can be implemented with any stack. The shapes below describe what the frontend expects.

## Books

### GET /public/books

Returns book summaries for the bookshelf.

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

### GET /public/books/:bookId

Returns display-ready reading content.

```json
{
  "id": "secret-garden",
  "title": "The Secret Garden",
  "author": "Frances Hodgson Burnett",
  "level": "B1",
  "summary": "A quiet classic for building vocabulary around nature.",
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Chapter 1",
      "content": ["When Mary Lennox was sent to Misselthwaite Manor..."]
    }
  ]
}
```

## Dictionary

### POST /translate

Looks up a selected word.

```json
{
  "word": "curiosity",
  "context": "For the first time, curiosity warmed her more than anger.",
  "bookId": "secret-garden",
  "chapterId": "chapter-2"
}
```

```json
{
  "word": "curiosity",
  "phonetic": "/kyoo-ree-os-i-tee/",
  "meaning": "好奇心",
  "example": "Curiosity made her open the old box."
}
```

## Account

### POST /auth/register

Creates an account and returns a session token.

```json
{
  "email": "reader@example.com",
  "password": "at-least-8-characters"
}
```

```json
{
  "token": "session-token",
  "user": {
    "id": "user-id",
    "email": "reader@example.com"
  }
}
```

### POST /auth/login

Signs in an existing account. The response shape matches registration.

### GET /auth/me

Returns the signed-in user.

```txt
Authorization: Bearer session-token
```

```json
{
  "user": {
    "id": "user-id",
    "email": "reader@example.com"
  }
}
```

## Future Sync Endpoints

These endpoints are natural next steps for a hosted version:

```txt
GET /me/progress
PUT /me/progress
GET /me/vocabulary
POST /me/vocabulary
DELETE /me/vocabulary/:word
POST /me/books/import
```

Keep responses focused on data the reader UI needs: book status, page progress, saved words, and safe display metadata.
