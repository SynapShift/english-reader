import type { Book } from '../types/reader'

export const prideAndPrejudice: Book = {
  id: 'pride-and-prejudice',
  title: 'Pride and Prejudice',
  author: 'Jane Austen',
  level: 'B2',
  summary: 'Jane Austen’s classic novel, prepared as page-by-page reading text from the provided PDF.',
  color: 'rose',
  contentUrl: '/books/pride-and-prejudice.v1.json',
  chapters: [
    {
      id: 'pride-loading',
      title: 'Loading book',
      content: ['Open this book to load the full text.'],
    },
  ],
}
