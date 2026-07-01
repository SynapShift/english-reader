const apiBase = import.meta.env.VITE_PUBLIC_API_BASE
const REQUEST_TIMEOUT_MS = 4000

export type PublicBookSummary = {
  id: string
  title: string
  author: string
  level: string
  summary: string
  coverUrl?: string
}

export type PublicTranslation = {
  word: string
  phonetic?: string
  meaning: string
  example?: string
}

export type TranslateWordInput = {
  word: string
  context?: string
  bookId?: string
  chapterId?: string
}

export type AuthUser = {
  id: string
  email: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

export type AuthInput = {
  email: string
  password: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBase) {
    throw new Error('VITE_PUBLIC_API_BASE is not configured.')
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    signal: controller.signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  }).finally(() => window.clearTimeout(timeoutId))

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

function authedRequest<T>(path: string, token: string) {
  return request<T>(path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function hasPublicApiBase() {
  return Boolean(apiBase)
}

export function listPublicBooks() {
  return request<PublicBookSummary[]>('/public/books')
}

export function translateWord(input: TranslateWordInput) {
  return request<PublicTranslation>('/translate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function register(input: AuthInput) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function login(input: AuthInput) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getCurrentUser(token: string) {
  return authedRequest<{ user: AuthUser }>('/auth/me', token)
}
