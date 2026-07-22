import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Languages,
  Library,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  Trash2,
  User,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import './App.css'
import { demoBooks, demoDictionary } from './data/demoContent'
import { importBookFile } from './lib/bookImport'
import { getCurrentUser, hasPublicApiBase, login, register, translateWord } from './lib/apiClient'
import { lookupPublicDictionary } from './lib/publicDictionary'
import type { AuthUser } from './lib/apiClient'
import type { Book, Translation } from './types/reader'

type ActiveTab = 'library' | 'reader' | 'words'
type AuthMode = 'login' | 'register'

const LAST_BOOK_KEY = 'english-reader:last-book-id'
const PROGRESS_PREFIX = 'english-reader:progress:'
const AUTH_TOKEN_KEY = 'english-reader:auth-token'

function normalizeWord(value: string) {
  return value.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '')
}

function findContextSentence(word: string, paragraphs: string[]) {
  const normalizedWord = normalizeWord(word)
  return (
    paragraphs
      .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/))
      .find((sentence) => sentence.toLowerCase().includes(normalizedWord)) ?? ''
  )
}

function hasActiveTextSelection() {
  const selectedText = window.getSelection()?.toString().trim()
  return Boolean(selectedText)
}

function readStoredProgress(bookId: string) {
  const rawValue = window.localStorage.getItem(`${PROGRESS_PREFIX}${bookId}`)
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : 0
  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0
}

function readInitialBookId() {
  const bookId = window.localStorage.getItem(LAST_BOOK_KEY)
  return bookId && demoBooks.some((book) => book.id === bookId) ? bookId : demoBooks[0].id
}

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('library')
  const [uploadedBooks, setUploadedBooks] = useState<Book[]>([])
  const [loadedBooks, setLoadedBooks] = useState<Record<string, Book>>({})
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null)
  const [selectedBookId, setSelectedBookId] = useState(readInitialBookId)
  const [chapterIndex, setChapterIndex] = useState(() => readStoredProgress(readInitialBookId()))
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [query, setQuery] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(22)
  const [lineHeight, setLineHeight] = useState(1.76)
  const [pageWidth, setPageWidth] = useState(820)
  const [selectedWord, setSelectedWord] = useState<Translation | null>(null)
  const [translationStatus, setTranslationStatus] = useState<
    'idle' | 'loading' | 'demo' | 'api' | 'public'
  >('idle')
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading'>('idle')
  const [authMessage, setAuthMessage] = useState('')
  const [savedWords, setSavedWords] = useState<Translation[]>([demoDictionary.curiosity])
  const books = useMemo(
    () => [...uploadedBooks, ...demoBooks].map((book) => loadedBooks[book.id] ?? book),
    [loadedBooks, uploadedBooks],
  )

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? books[0],
    [books, selectedBookId],
  )
  const selectedChapter = selectedBook.chapters[chapterIndex] ?? selectedBook.chapters[0]
  const selectedBookIsLoading = loadingBookId === selectedBook.id
  const progress = Math.round(((chapterIndex + 1) / selectedBook.chapters.length) * 100)
  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return books
    }

    return books.filter((book) =>
      [book.title, book.author, book.level, book.summary].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    )
  }, [books, query])

  const readerStyle = {
    '--reader-font-size': `${fontSize}px`,
    '--reader-line-height': lineHeight,
    '--reader-max-width': `${pageWidth}px`,
  } as CSSProperties

  const ensureBookLoaded = useCallback(
    async (book: Book) => {
      if (!book.contentUrl || loadedBooks[book.id]) {
        return
      }

      setLoadingBookId(book.id)

      try {
        const response = await fetch(book.contentUrl)
        if (!response.ok) {
          throw new Error(`Failed to load book: ${response.status}`)
        }
        const loadedBook = (await response.json()) as Book
        setLoadedBooks((current) => ({ ...current, [book.id]: loadedBook }))
      } finally {
        setLoadingBookId((current) => (current === book.id ? null : current))
      }
    },
    [loadedBooks],
  )

  useEffect(() => {
    if (chapterIndex > selectedBook.chapters.length - 1) {
      setChapterIndex(Math.max(0, selectedBook.chapters.length - 1))
    }
  }, [chapterIndex, selectedBook.chapters.length])

  useEffect(() => {
    window.localStorage.setItem(LAST_BOOK_KEY, selectedBook.id)
    window.localStorage.setItem(`${PROGRESS_PREFIX}${selectedBook.id}`, String(chapterIndex))
  }, [chapterIndex, selectedBook.id])

  useEffect(() => {
    void ensureBookLoaded(selectedBook)
  }, [ensureBookLoaded, selectedBook])

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token || !hasPublicApiBase()) {
      return
    }

    void getCurrentUser(token)
      .then((response) => setAuthUser(response.user))
      .catch(() => window.localStorage.removeItem(AUTH_TOKEN_KEY))
  }, [])

  async function selectBook(bookId: string) {
    const book = books.find((item) => item.id === bookId)
    setSelectedBookId(bookId)
    setChapterIndex(readStoredProgress(bookId))
    setSelectedWord(null)
    setTranslationStatus('idle')
    setActiveTab('reader')

    if (book) {
      await ensureBookLoaded(book)
    }
  }

  async function openTranslation(rawWord: string) {
    const word = normalizeWord(rawWord)
    if (!word) {
      return
    }

    const fallbackTranslation = getFallbackTranslation(word)

    setSelectedWord(fallbackTranslation)
    setTranslationStatus('demo')

    setTranslationStatus('loading')

    try {
      const apiTranslation = hasPublicApiBase()
        ? await translateWord({
            word,
            context: findContextSentence(word, selectedChapter.content),
            bookId: selectedBook.id,
            chapterId: selectedChapter.id,
          })
        : await lookupPublicDictionary(word)

      if (!apiTranslation) {
        throw new Error('No dictionary entry found.')
      }

      setSelectedWord({
        word: apiTranslation.word,
        phonetic: apiTranslation.phonetic ?? '',
        meaning: apiTranslation.meaning,
        example:
          apiTranslation.example ||
          findContextSentence(word, selectedChapter.content) ||
          'Keep reading to see how this word is used in context.',
        source: hasPublicApiBase() ? 'api' : 'public',
      })
      setTranslationStatus(hasPublicApiBase() ? 'api' : 'public')
    } catch {
      try {
        const publicTranslation = await lookupPublicDictionary(word)
        if (!publicTranslation) {
          throw new Error('No public dictionary entry found.')
        }
        setSelectedWord({
          word: publicTranslation.word,
          phonetic: publicTranslation.phonetic ?? '',
          meaning: publicTranslation.meaning,
          example:
            publicTranslation.example ||
            findContextSentence(word, selectedChapter.content) ||
            'Keep reading to see how this word is used in context.',
          source: 'public',
        })
        setTranslationStatus('public')
      } catch {
        setSelectedWord(fallbackTranslation)
        setTranslationStatus('demo')
      }
    }
  }

  function isWordSaved(word: string) {
    return savedWords.some((item) => item.word === word)
  }

  function toggleSavedWord(word: Translation) {
    setSavedWords((current) =>
      current.some((item) => item.word === word.word)
        ? current.filter((item) => item.word !== word.word)
        : [...current, word],
    )
  }

  function deleteSavedWord(word: string) {
    setSavedWords((current) => current.filter((item) => item.word !== word))
  }

  function getFallbackTranslation(word: string): Translation {
    return (
      demoDictionary[word] ?? {
        word,
        phonetic: '',
        meaning: '暂未收录这个词。你可以先结合上下文理解，后续词典会继续补全。',
        example:
          findContextSentence(word, selectedChapter.content) ||
          'Select another word to keep reading with quick lookup.',
        source: 'placeholder',
      }
    )
  }

  async function handleBookFileImport(file: File) {
    const book = await importBookFile(file)
    setUploadedBooks((current) => [book, ...current])
    setSelectedBookId(book.id)
    setChapterIndex(0)
    setSelectedWord(null)
    setTranslationStatus('idle')
    setActiveTab('reader')
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthStatus('loading')
    setAuthMessage('')

    try {
      const response =
        authMode === 'register'
          ? await register({ email: authEmail, password: authPassword })
          : await login({ email: authEmail, password: authPassword })
      window.localStorage.setItem(AUTH_TOKEN_KEY, response.token)
      setAuthUser(response.user)
      setAuthOpen(false)
      setAuthPassword('')
    } catch {
      setAuthMessage(
        authMode === 'register' ? '注册失败，请检查邮箱和密码。' : '登录失败，请检查邮箱和密码。',
      )
    } finally {
      setAuthStatus('idle')
    }
  }

  function logout() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    setAuthUser(null)
    setAuthPassword('')
    setAuthMessage('')
  }

  function closeWordCardOnBlankClick(event: MouseEvent<HTMLElement>) {
    if (!selectedWord) {
      return
    }

    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    const isInteractiveClick = target.closest(
      '.word, .reader-word-dock, .settings-panel, .toolbar, .page-actions, button, input, label',
    )

    if (!isInteractiveClick) {
      setSelectedWord(null)
    }
  }

  const wordCardSource =
    translationStatus === 'loading'
      ? '查词中'
      : selectedWord?.source === 'api'
        ? '英汉词典'
        : selectedWord?.source === 'public'
          ? '在线词典'
          : selectedWord?.source === 'placeholder'
            ? '暂未收录'
            : '本地词卡'
  const pageLabel = `Page ${chapterIndex + 1} of ${selectedBook.chapters.length}`

  return (
    <main className={`app-shell ${theme}`}>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">
            <BookOpen size={22} aria-hidden="true" />
          </div>
          <div>
            <p>English Reader</p>
            <span>Open source reader</span>
          </div>
        </div>

        <nav className="tab-nav" aria-label="Primary sections">
          <button
            className={activeTab === 'library' ? 'active' : ''}
            onClick={() => setActiveTab('library')}
            type="button"
          >
            <Library size={18} />
            Bookshelf
          </button>
          <button
            className={activeTab === 'reader' ? 'active' : ''}
            onClick={() => setActiveTab('reader')}
            type="button"
          >
            <BookOpen size={18} />
            Reader
          </button>
          <button
            className={activeTab === 'words' ? 'active' : ''}
            onClick={() => setActiveTab('words')}
            type="button"
          >
            <Bookmark size={18} />
            Word cards
          </button>
        </nav>

        <div className="toolbar" aria-label="Global controls">
          {authUser ? (
            <div className="account-chip">
              <User size={16} aria-hidden="true" />
              <span>{authUser.email}</span>
              <button type="button" aria-label="Log out" onClick={logout}>
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Log in or register"
              onClick={() => {
                setAuthOpen(true)
                setAuthMessage('')
              }}
            >
              <User size={19} />
            </button>
          )}
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
      </header>

      {authOpen ? (
        <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Account">
          <form className="auth-panel" onSubmit={(event) => void handleAuthSubmit(event)}>
            <div className="settings-header">
              <span>{authMode === 'register' ? 'Create account' : 'Sign in'}</span>
              <button
                type="button"
                aria-label="Close account dialog"
                onClick={() => setAuthOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="auth-switch" aria-label="Account mode">
              <button
                className={authMode === 'login' ? 'active' : ''}
                type="button"
                onClick={() => {
                  setAuthMode('login')
                  setAuthMessage('')
                }}
              >
                Login
              </button>
              <button
                className={authMode === 'register' ? 'active' : ''}
                type="button"
                onClick={() => {
                  setAuthMode('register')
                  setAuthMessage('')
                }}
              >
                Register
              </button>
            </div>
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setAuthEmail(event.target.value)}
                required
                type="email"
                value={authEmail}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                minLength={8}
                onChange={(event) => setAuthPassword(event.target.value)}
                required
                type="password"
                value={authPassword}
              />
            </label>
            {authMessage ? <p className="auth-message">{authMessage}</p> : null}
            <button className="auth-submit" disabled={authStatus === 'loading'} type="submit">
              {authStatus === 'loading'
                ? 'Please wait'
                : authMode === 'register'
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>
        </div>
      ) : null}

      {activeTab === 'library' ? (
        <section className="tab-panel library-page" aria-label="Book library">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Bookshelf</span>
              <h1>Choose a book</h1>
            </div>
            <label className="search-box">
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Search books"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search books"
                value={query}
              />
            </label>
          </div>

          <div className="book-grid">
            <label className="upload-dropzone book-upload-card">
              <FileUp size={30} aria-hidden="true" />
              <strong>Upload PDF, TXT, or Markdown</strong>
              <span>Parsed locally in this browser. Text-based PDFs work best.</span>
              <input
                accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
                aria-label="Upload book file"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void handleBookFileImport(file)
                  }
                  event.target.value = ''
                }}
                type="file"
              />
            </label>

            {filteredBooks.map((book) => (
              <button
                className={`book-card ${selectedBook.id === book.id ? 'active' : ''}`}
                key={book.id}
                onClick={() => void selectBook(book.id)}
                type="button"
              >
                <span className={`large-cover ${book.color}`} aria-hidden="true">
                  <span>{book.title.slice(0, 1)}</span>
                </span>
                <span>
                  <strong>{book.title}</strong>
                  <small>
                    {book.author} · {book.level}
                  </small>
                  <em>{book.summary}</em>
                </span>
              </button>
            ))}
            {filteredBooks.length === 0 ? (
              <div className="empty-search">
                <Search size={20} aria-hidden="true" />
                <p>No books match this search.</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab === 'reader' ? (
        <section
          className={`tab-panel reader-area ${selectedWord ? 'has-word-dock' : ''}`}
          aria-label="Reader"
          onClick={closeWordCardOnBlankClick}
          style={readerStyle}
        >
          <header className="reader-topbar">
            <div>
              <span className="eyebrow">Now reading</span>
              <h1>{selectedBook.title}</h1>
            </div>
            <div className="toolbar" aria-label="Reader controls">
              <span className="page-counter" aria-label="Current page">
                {pageLabel}
              </span>
              <button type="button" aria-label="Word cards" onClick={() => setActiveTab('words')}>
                <Languages size={19} />
              </button>
              <button
                className={settingsOpen ? 'active' : ''}
                type="button"
                aria-label="Reader settings"
                onClick={() => setSettingsOpen((current) => !current)}
              >
                <Settings size={19} />
              </button>
            </div>
          </header>

          {settingsOpen ? (
            <section className="settings-panel" aria-label="Reader settings panel">
              <div className="settings-header">
                <span>Reader settings</span>
                <button
                  type="button"
                  aria-label="Close reader settings"
                  onClick={() => setSettingsOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <label>
                <span>Font size</span>
                <input
                  max="28"
                  min="18"
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  type="range"
                  value={fontSize}
                />
              </label>
              <label>
                <span>Line height</span>
                <input
                  max="2.1"
                  min="1.45"
                  onChange={(event) => setLineHeight(Number(event.target.value))}
                  step="0.05"
                  type="range"
                  value={lineHeight}
                />
              </label>
              <label>
                <span>Page width</span>
                <input
                  max="920"
                  min="680"
                  onChange={(event) => setPageWidth(Number(event.target.value))}
                  step="20"
                  type="range"
                  value={pageWidth}
                />
              </label>
            </section>
          ) : null}

          <section className="book-context">
            <div className={`large-cover ${selectedBook.color}`} aria-hidden="true">
              <span>{selectedBook.title.slice(0, 1)}</span>
            </div>
            <div>
              <p>{selectedBook.summary}</p>
              <div className="meta-row">
                <span>{selectedBook.level}</span>
                <span>{pageLabel}</span>
                <span>{progress}% read</span>
              </div>
            </div>
          </section>

          <article className="reader-page">
            <div className="chapter-header">
              <span>{pageLabel}</span>
              <h2>{selectedChapter.title}</h2>
            </div>

            <div className="content">
              {selectedBookIsLoading ? (
                <p>Loading full book text...</p>
              ) : (
                selectedChapter.content.map((paragraph) => (
                  <p key={paragraph}>
                    {paragraph.split(/(\s+)/).map((part, index) => {
                      const word = normalizeWord(part)
                      return word ? (
                        <span
                          className="word"
                          key={`${part}-${index}`}
                          onClick={() => {
                            if (!hasActiveTextSelection()) {
                              void openTranslation(part)
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              void openTranslation(part)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          {part}
                        </span>
                      ) : (
                        <span key={`${part}-${index}`}>{part}</span>
                      )
                    })}
                  </p>
                ))
              )}
            </div>

            <div className="page-actions">
              <button
                type="button"
                disabled={chapterIndex === 0}
                onClick={() => setChapterIndex((current) => Math.max(0, current - 1))}
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <div className="progress-track" aria-label={`Reading progress ${progress}%`}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <span className="page-actions-counter">{pageLabel}</span>
              <button
                type="button"
                disabled={chapterIndex === selectedBook.chapters.length - 1}
                onClick={() =>
                  setChapterIndex((current) =>
                    Math.min(selectedBook.chapters.length - 1, current + 1),
                  )
                }
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </article>

          {selectedWord ? (
            <section className="reader-word-dock" aria-label="Selected word translation">
              <div className="word-card compact">
                <div>
                  <span>{wordCardSource}</span>
                  <h2>{selectedWord.word}</h2>
                  {selectedWord.phonetic ? <small>{selectedWord.phonetic}</small> : null}
                </div>
                <p>{selectedWord.meaning}</p>
                <blockquote>{selectedWord.example}</blockquote>
                <div className="word-card-actions">
                  <button type="button" onClick={() => toggleSavedWord(selectedWord)}>
                    <Bookmark size={17} />
                    {isWordSaved(selectedWord.word) ? 'Saved' : 'Save word'}
                  </button>
                  <button type="button" onClick={() => setSelectedWord(null)}>
                    <X size={17} />
                    Close
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'words' ? (
        <section className="tab-panel words-page" aria-label="Vocabulary">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Vocabulary</span>
              <h1>Word cards</h1>
            </div>
          </div>

          <div className="words-layout">
            {selectedWord ? (
              <div className="word-card">
                <div>
                  <span>{wordCardSource}</span>
                  <h2>{selectedWord.word}</h2>
                  {selectedWord.phonetic ? <small>{selectedWord.phonetic}</small> : null}
                </div>
                <p>{selectedWord.meaning}</p>
                <blockquote>{selectedWord.example}</blockquote>
                <button type="button" onClick={() => toggleSavedWord(selectedWord)}>
                  <Bookmark size={17} />
                  {isWordSaved(selectedWord.word) ? 'Saved' : 'Save word'}
                </button>
              </div>
            ) : (
              <div className="empty-card">
                <Languages size={28} aria-hidden="true" />
                <p>Tap any English word in the reader to preview translation behavior.</p>
              </div>
            )}

            <div className="saved-list word-list">
              <span>Saved words</span>
              {savedWords.map((word) => (
                <article className="saved-word-card" key={word.word}>
                  <button type="button" onClick={() => void openTranslation(word.word)}>
                    <strong>{word.word}</strong>
                    <small>{word.meaning}</small>
                    <em>{word.example}</em>
                  </button>
                  <button
                    aria-label={`Delete ${word.word}`}
                    className="delete-word"
                    onClick={() => deleteSavedWord(word.word)}
                    type="button"
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default App
