function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE
  if (raw && String(raw).trim()) {
    return String(raw).trim().replace(/\/$/, '')
  }
  return ''
}

function apiUrl(path: string): string {
  const base = apiBase()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
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

async function request(path: string, init?: RequestInit): Promise<unknown> {
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
  const q = new URLSearchParams({
    keyword: keyword.trim(),
    page: String(page),
  })
  const data = (await request(`/api/kp/search?${q}`)) as SearchResult
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
  return (await request(`/api/kp/films/${id}`)) as FilmDetail
}

export async function fetchTop(page = 1): Promise<SearchResult> {
  const q = new URLSearchParams({ page: String(page) })
  const data = (await request(`/api/kp/top?${q}`)) as SearchResult
  return {
    films: Array.isArray(data.films) ? data.films : [],
    pagesCount: typeof data.pagesCount === 'number' ? data.pagesCount : 1,
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

export async function fetchPlayerIframes(
  filmId: number,
  ids: { uid: string; yandexLogin: string; uidKp: string },
): Promise<ApigetPlayerResult> {
  const data = (await request('/api/players', {
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

export function filterListSubscribeUrl(): string {
  const origin =
    apiBase() ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${origin.replace(/\/$/, '')}/filters/movier.txt`
}
