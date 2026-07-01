import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import type { Book, Chapter } from '../types/reader'

type PdfTextItem = {
  str: string
  transform: number[]
  width?: number
}

function splitIntoParagraphs(rawContent: string) {
  return rawContent
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function createImportedTextBook(fileName: string, rawContent: string): Book {
  const title = fileName.replace(/\.(txt|md|markdown|pdf)$/i, '') || 'Uploaded book'
  const paragraphs = splitIntoParagraphs(rawContent)
  const content = paragraphs.length > 0 ? paragraphs : [rawContent.trim()].filter(Boolean)

  return {
    id: `upload-${Date.now()}`,
    title,
    author: 'Local upload',
    level: 'Custom',
    summary: 'Imported locally in this browser session.',
    color: 'slate',
    chapters: [
      {
        id: 'uploaded-chapter-1',
        title: 'Imported Text',
        content:
          content.length > 0
            ? content.slice(0, 120)
            : ['This file did not contain readable text. Try a text-based PDF, TXT, or Markdown file.'],
      },
    ],
  }
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  if (!item || typeof item !== 'object') {
    return false
  }

  const candidate = item as Partial<PdfTextItem>
  return typeof candidate.str === 'string' && Array.isArray(candidate.transform)
}

function textItemsToLines(items: PdfTextItem[]) {
  const rows: Array<{ y: number; items: PdfTextItem[] }> = []

  for (const item of items) {
    const text = item.str.trim()
    if (!text) {
      continue
    }

    const y = item.transform[5] ?? 0
    const existingRow = rows.find((row) => Math.abs(row.y - y) < 3)

    if (existingRow) {
      existingRow.items.push(item)
    } else {
      rows.push({ y, items: [item] })
    }
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) =>
      row.items
        .sort((a, b) => (a.transform[4] ?? 0) - (b.transform[4] ?? 0))
        .map((item) => item.str.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
}

function linesToParagraphs(lines: string[]) {
  const paragraphs: string[] = []
  let buffer = ''

  for (const line of lines) {
    if (/^\d+$/.test(line) && line.length <= 4) {
      continue
    }

    buffer = buffer ? `${buffer} ${line}` : line

    if (/[.!?。！？;:)"'”’]$/.test(line) || buffer.length > 520) {
      paragraphs.push(buffer)
      buffer = ''
    }
  }

  if (buffer) {
    paragraphs.push(buffer)
  }

  return paragraphs.length > 0 ? paragraphs : ['This page did not contain readable text.']
}

function createImportedPdfBook(fileName: string, chapters: Chapter[]): Book {
  const title = fileName.replace(/\.pdf$/i, '') || 'Uploaded PDF'

  return {
    id: `upload-${Date.now()}`,
    title,
    author: 'Local PDF import',
    level: 'Custom',
    summary:
      'Text extracted page by page from a PDF in this browser session only. Text-based PDFs work best.',
    color: 'slate',
    chapters:
      chapters.length > 0
        ? chapters
        : [
            {
              id: 'pdf-page-1',
              title: 'Page 1',
              content: ['This PDF did not contain readable text. Scanned PDFs need OCR.'],
            },
          ],
  }
}

async function extractPdfChapters(file: File) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const chapters: Chapter[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const items: PdfTextItem[] = []
    for (const item of textContent.items as unknown[]) {
      if (isPdfTextItem(item)) {
        items.push(item)
      }
    }
    const lines = textItemsToLines(items)

    chapters.push({
      id: `pdf-page-${pageNumber}`,
      title: `Page ${pageNumber}`,
      content: linesToParagraphs(lines),
    })
  }

  return chapters
}

export async function importBookFile(file: File) {
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
    return createImportedPdfBook(file.name, await extractPdfChapters(file))
  }

  return createImportedTextBook(file.name, await file.text())
}
