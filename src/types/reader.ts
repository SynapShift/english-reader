export type Chapter = {
  id: string
  title: string
  content: string[]
}

export type Book = {
  id: string
  title: string
  author: string
  level: string
  summary: string
  color: 'teal' | 'amber' | 'indigo' | 'slate' | 'rose'
  contentUrl?: string
  chapters: Chapter[]
}

export type Translation = {
  word: string
  phonetic: string
  meaning: string
  example: string
  source?: 'demo' | 'api' | 'public' | 'placeholder'
}
