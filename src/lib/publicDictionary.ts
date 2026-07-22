import type { PublicTranslation } from './apiClient'

type DictionaryEntry = {
  word?: string
  phonetic?: string
  phonetics?: Array<{ text?: string }>
  meanings?: Array<{
    partOfSpeech?: string
    definitions?: Array<{
      definition?: string
      example?: string
    }>
  }>
}

type TranslationResponse = {
  responseData?: {
    translatedText?: string
    match?: number
  }
  responseStatus?: number
}

const DICTIONARY_TIMEOUT_MS = 4500
const TRANSLATION_TIMEOUT_MS = 2500

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  return fetch(url, {
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeoutId))
}

async function lookupEnglishEntry(word: string) {
  const response = await fetchWithTimeout(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    DICTIONARY_TIMEOUT_MS,
  )

  if (!response.ok) {
    return null
  }

  const entries = (await response.json().catch(() => null)) as DictionaryEntry[] | null
  const entry = entries?.[0]
  const firstMeaning = entry?.meanings?.find((meaning) => meaning.definitions?.length)
  const firstDefinition = firstMeaning?.definitions?.[0]

  if (!firstDefinition?.definition) {
    return null
  }

  return {
    word: entry?.word ?? word,
    phonetic:
      entry?.phonetic ??
      entry?.phonetics?.find((phonetic) => phonetic.text)?.text ??
      '',
    partOfSpeech: firstMeaning?.partOfSpeech ?? '',
    definition: firstDefinition.definition,
    example:
      firstMeaning?.definitions?.find((definition) => definition.example)?.example ??
      firstDefinition.example ??
      '',
  }
}

async function translateWordToChinese(word: string) {
  const url = new URL('https://api.mymemory.translated.net/get')
  url.searchParams.set('q', word)
  url.searchParams.set('langpair', 'en|zh-CN')

  const response = await fetchWithTimeout(url.toString(), TRANSLATION_TIMEOUT_MS)
  if (!response.ok) {
    return ''
  }

  const body = (await response.json().catch(() => null)) as TranslationResponse | null
  const translatedText = body?.responseData?.translatedText?.trim() ?? ''

  if (!translatedText || translatedText.toLowerCase() === word.toLowerCase()) {
    return ''
  }

  return translatedText
}

export async function lookupPublicDictionary(word: string): Promise<PublicTranslation | null> {
  const entry = await lookupEnglishEntry(word).catch(() => null)
  if (!entry) {
    return null
  }

  const chineseMeaning = await translateWordToChinese(word).catch(() => '')
  const englishMeaning = `${entry.partOfSpeech ? `${entry.partOfSpeech}: ` : ''}${entry.definition}`

  return {
    word: entry.word,
    phonetic: entry.phonetic,
    meaning: chineseMeaning ? `${chineseMeaning}。英文释义：${englishMeaning}` : `英文释义：${englishMeaning}`,
    example: entry.example || `Keep reading to see how "${entry.word}" is used in context.`,
  }
}
