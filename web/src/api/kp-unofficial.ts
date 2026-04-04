const API_BASE = 'https://kinopoiskapiunofficial.tech'

export function getApiKey(): string {
  const k = import.meta.env.VITE_KP_API_KEY
  if (k === undefined || k === null) return ''
  return String(k).trim()
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Accept: 'application/json',
    'X-API-KEY': apiKey,
  }
}

export class KpApiError extends Error {
  code: 'NO_KEY' | 'HTTP' | 'CORS_OR_NETWORK' | 'PARSE'
  status?: number

  constructor(
    message: string,
    code: 'NO_KEY' | 'HTTP' | 'CORS_OR_NETWORK' | 'PARSE',
    status?: number,
  ) {
    super(message)
    this.name = 'KpApiError'
    this.code = code
    this.status = status
  }
}

function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError && String(e.message).includes('fetch')
}

export interface SearchFilmItem {
  filmId: number
  nameRu: string | null
  nameEn: string | null
  year: string | null
  type: string
  posterUrlPreview?: string
  rating?: string
}

export interface SearchResult {
  films: SearchFilmItem[]
  pagesCount: number
}

export async function searchByKeyword(
  keyword: string,
  page = 1,
): Promise<SearchResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new KpApiError('Укажите VITE_KP_API_KEY в .env и пересоберите проект.', 'NO_KEY')
  }
  const url = new URL(`${API_BASE}/api/v2.1/films/search-by-keyword`)
  url.searchParams.set('keyword', keyword.trim())
  url.searchParams.set('page', String(page))

  let res: Response
  try {
    res = await fetch(url.toString(), { headers: authHeaders(apiKey) })
  } catch (e) {
    if (isNetworkError(e)) {
      throw new KpApiError(
        'Не удалось связаться с Kinopoisk API (сеть или блокировка CORS в браузере).',
        'CORS_OR_NETWORK',
      )
    }
    throw e
  }

  if (!res.ok) {
    throw new KpApiError(
      `Kinopoisk API: ${res.status} ${res.statusText}`,
      'HTTP',
      res.status,
    )
  }

  let data: {
    films?: SearchFilmItem[]
    pagesCount?: number
  }
  try {
    data = (await res.json()) as typeof data
  } catch {
    throw new KpApiError('Не удалось разобрать ответ API.', 'PARSE')
  }

  return {
    films: Array.isArray(data.films) ? data.films : [],
    pagesCount: typeof data.pagesCount === 'number' ? data.pagesCount : 1,
  }
}

/** Упрощённая модель карточки фильма v2.2 */
export interface FilmDetail {
  kinopoiskId: number
  nameRu: string | null
  nameEn: string | null
  nameOriginal: string | null
  posterUrl: string | null
  posterUrlPreview: string | null
  year: number | null
  filmLength: number | null
  description: string | null
  shortDescription: string | null
  ratingKinopoisk: number | null
  webUrl: string | null
  type: string
}

export async function getFilmById(id: number): Promise<FilmDetail> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new KpApiError('Укажите VITE_KP_API_KEY в .env и пересоберите проект.', 'NO_KEY')
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/v2.2/films/${id}`, {
      headers: authHeaders(apiKey),
    })
  } catch (e) {
    if (isNetworkError(e)) {
      throw new KpApiError(
        'Не удалось связаться с Kinopoisk API (сеть или блокировка CORS в браузере).',
        'CORS_OR_NETWORK',
      )
    }
    throw e
  }

  if (res.status === 404) {
    throw new KpApiError('Фильм с таким ID не найден.', 'HTTP', 404)
  }
  if (!res.ok) {
    throw new KpApiError(
      `Kinopoisk API: ${res.status} ${res.statusText}`,
      'HTTP',
      res.status,
    )
  }

  let raw: Record<string, unknown>
  try {
    raw = (await res.json()) as Record<string, unknown>
  } catch {
    throw new KpApiError('Не удалось разобрать ответ API.', 'PARSE')
  }

  return {
    kinopoiskId: Number(raw.kinopoiskId) || id,
    nameRu: (raw.nameRu as string) ?? null,
    nameEn: (raw.nameEn as string) ?? null,
    nameOriginal: (raw.nameOriginal as string) ?? null,
    posterUrl: (raw.posterUrl as string) ?? null,
    posterUrlPreview: (raw.posterUrlPreview as string) ?? null,
    year: typeof raw.year === 'number' ? raw.year : null,
    filmLength: typeof raw.filmLength === 'number' ? raw.filmLength : null,
    description: (raw.description as string) ?? null,
    shortDescription: (raw.shortDescription as string) ?? null,
    ratingKinopoisk:
      typeof raw.ratingKinopoisk === 'number' ? raw.ratingKinopoisk : null,
    webUrl: (raw.webUrl as string) ?? null,
    type: String(raw.type ?? 'FILM'),
  }
}
