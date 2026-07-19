import {
  getOrCreateUid,
  getOrCreateUidKp,
  getOrCreateYandexLogin,
} from '../storage'

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE
  if (raw && String(raw).trim()) {
    return String(raw).trim().replace(/\/$/, '')
  }
  return ''
}

function kpApiKey(): string {
  const k = import.meta.env.VITE_KP_API_KEY
  return k ? String(k).trim() : ''
}

/** BFF: VITE_API_BASE, либо local/VPS same-origin. На Pages — прямой KP API. */
function useBff(): boolean {
  if (apiBase()) return true
  if (import.meta.env.DEV) return true
  if (kpApiKey()) return false
  return true
}

function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiBase()}${p}`
}

function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError && String(e.message).includes('fetch')
}

export class ApiError extends Error {
  code: string
  status?: number

  constructor(message: string, code: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    throw new ApiError('Некорректный ответ API.', 'PARSE', res.status)
  }
}

async function requestBff(path: string, init?: RequestInit): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(apiUrl(path), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    })
  } catch (e) {
    if (isNetworkError(e)) {
      throw new ApiError('Не удалось связаться с API.', 'NETWORK')
    }
    throw e
  }

  const data = await parseJson(res)
  if (!res.ok) {
    const msg =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `API: HTTP ${res.status}`
    const code =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : 'HTTP'
    throw new ApiError(msg, code, res.status)
  }
  return data
}

const KP_BASE = 'https://kinopoiskapiunofficial.tech'

async function requestKp(path: string, search?: URLSearchParams): Promise<unknown> {
  const key = kpApiKey()
  if (!key) {
    throw new ApiError(
      'На GitHub Pages задайте секрет VITE_KP_API_KEY или VITE_API_BASE.',
      'NO_KEY',
    )
  }
  const url = new URL(path, KP_BASE)
  if (search) search.forEach((v, k) => url.searchParams.set(k, v))

  let res: Response
  try {
    res = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'X-API-KEY': key },
    })
  } catch (e) {
    if (isNetworkError(e)) {
      throw new ApiError('Не удалось связаться с Kinopoisk API.', 'NETWORK')
    }
    throw e
  }

  if (res.status === 404) {
    throw new ApiError('Не найдено.', 'HTTP', 404)
  }
  if (!res.ok) {
    throw new ApiError(`Kinopoisk API: ${res.status}`, 'HTTP', res.status)
  }
  return parseJson(res)
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

function mapCollectionItems(items: Record<string, unknown>[]): SearchFilmItem[] {
  return items
    .map((raw) => {
      const id = Number(raw.kinopoiskId) || Number(raw.filmId) || 0
      const rating =
        typeof raw.ratingKinopoisk === 'number'
          ? String(raw.ratingKinopoisk)
          : typeof raw.rating === 'string'
            ? raw.rating
            : undefined
      const year =
        typeof raw.year === 'number'
          ? String(raw.year)
          : typeof raw.year === 'string'
            ? raw.year
            : null
      return {
        filmId: id,
        nameRu: (raw.nameRu as string) ?? null,
        nameEn: (raw.nameEn as string) ?? (raw.nameOriginal as string) ?? null,
        year,
        type: String(raw.type ?? 'FILM'),
        posterUrlPreview:
          (raw.posterUrlPreview as string) ||
          (raw.posterUrl as string) ||
          undefined,
        rating,
      }
    })
    .filter((f) => f.filmId > 0)
}

export async function searchByKeyword(
  keyword: string,
  page = 1,
): Promise<SearchResult> {
  if (useBff()) {
    const q = new URLSearchParams({
      keyword: keyword.trim(),
      page: String(page),
    })
    const data = (await requestBff(`/api/kp/search?${q}`)) as SearchResult
    return {
      films: Array.isArray(data.films) ? data.films : [],
      pagesCount: typeof data.pagesCount === 'number' ? data.pagesCount : 1,
    }
  }

  const data = (await requestKp(
    '/api/v2.1/films/search-by-keyword',
    new URLSearchParams({ keyword: keyword.trim(), page: String(page) }),
  )) as { films?: SearchFilmItem[]; pagesCount?: number }

  return {
    films: Array.isArray(data.films) ? data.films : [],
    pagesCount: typeof data.pagesCount === 'number' ? data.pagesCount : 1,
  }
}

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
  if (useBff()) {
    return (await requestBff(`/api/kp/films/${id}`)) as FilmDetail
  }

  const raw = (await requestKp(`/api/v2.2/films/${id}`)) as Record<string, unknown>
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

export async function fetchTop(page = 1): Promise<SearchResult> {
  if (useBff()) {
    const q = new URLSearchParams({ page: String(page) })
    const data = (await requestBff(`/api/kp/top?${q}`)) as SearchResult
    return {
      films: Array.isArray(data.films) ? data.films : [],
      pagesCount: typeof data.pagesCount === 'number' ? data.pagesCount : 1,
    }
  }

  const data = (await requestKp(
    '/api/v2.2/films/collections',
    new URLSearchParams({ type: 'TOP_POPULAR_ALL', page: String(page) }),
  )) as {
    items?: Record<string, unknown>[]
    totalPages?: number
  }

  return {
    films: mapCollectionItems(Array.isArray(data.items) ? data.items : []),
    pagesCount: typeof data.totalPages === 'number' ? data.totalPages : 1,
  }
}

export function withoutLastPlayer(players: string[]): string[] {
  if (players.length <= 1) return players.slice()
  return players.slice(0, -1)
}

export interface ApigetPlayerResult {
  error: number
  all_player: string[]
}

function buildStubHtml(filmId: number): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>KP</title></head><body><div data-film-id="${filmId}">https://www.kinopoisk.ru/film/${filmId}/</div></body></html>`
}

export async function fetchPlayerIframes(
  filmId: number,
  ids: { uid: string; yandexLogin: string; uidKp: string },
): Promise<ApigetPlayerResult> {
  if (useBff()) {
    const data = (await requestBff('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filmId,
        uid: ids.uid,
        yandexLogin: ids.yandexLogin,
        uidKp: ids.uidKp,
      }),
    })) as ApigetPlayerResult

    return {
      error: typeof data.error === 'number' ? data.error : -1,
      all_player: Array.isArray(data.all_player) ? data.all_player : [],
    }
  }

  const domain =
    (import.meta.env.VITE_APIGET_DOMAIN &&
      String(import.meta.env.VITE_APIGET_DOMAIN).trim()) ||
    'kp.apiget.ru'
  const fd = new FormData()
  fd.append('id', String(filmId))
  fd.append('version_extension', '16.2.3')
  fd.append('Manifest_extension', '{}')
  fd.append('uid', ids.uid || getOrCreateUid())
  fd.append('yandex_login', ids.yandexLogin || getOrCreateYandexLogin())
  fd.append('UID_KP', ids.uidKp || getOrCreateUidKp())
  fd.append('html_code', buildStubHtml(filmId))

  let res: Response
  try {
    res = await fetch(`https://${domain}/array_player.php`, {
      method: 'POST',
      body: fd,
    })
  } catch (e) {
    if (isNetworkError(e)) {
      throw new ApiError(
        'Плееры с GitHub Pages заблокированы (CORS). Нужен VITE_API_BASE или расширение.',
        'CORS',
      )
    }
    throw e
  }

  const data = (await parseJson(res)) as ApigetPlayerResult
  return {
    error: typeof data.error === 'number' ? data.error : -1,
    all_player: Array.isArray(data.all_player) ? data.all_player : [],
  }
}

export function filterListSubscribeUrl(): string {
  if (typeof window !== 'undefined') {
    const base = import.meta.env.BASE_URL || '/'
    return new URL('filters/movier.txt', window.location.origin + base).href
  }
  return '/filters/movier.txt'
}
