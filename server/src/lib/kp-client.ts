import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { config } from '../config.js'

export class UpstreamError extends Error {
  status: ContentfulStatusCode
  code: 'NO_KEY' | 'UPSTREAM' | 'PARSE' | 'NETWORK'

  constructor(
    message: string,
    code: 'NO_KEY' | 'UPSTREAM' | 'PARSE' | 'NETWORK',
    status: ContentfulStatusCode = 502,
  ) {
    super(message)
    this.name = 'UpstreamError'
    this.code = code
    this.status = status
  }
}

function requireKey(): string {
  if (!config.kpApiKey) {
    throw new UpstreamError(
      'KP_API_KEY не настроен на сервере.',
      'NO_KEY',
      503,
    )
  }
  return config.kpApiKey
}

async function kpFetch(path: string, search?: URLSearchParams): Promise<unknown> {
  const key = requireKey()
  const url = new URL(path, config.kpApiBase)
  if (search) {
    search.forEach((v, k) => url.searchParams.set(k, v))
  }

  let res: Response
  try {
    res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-API-KEY': key,
        'User-Agent': 'Movier/1.2',
      },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new UpstreamError(
      'Не удалось связаться с Kinopoisk API.',
      'NETWORK',
      502,
    )
  }

  if (res.status === 404) {
    throw new UpstreamError('Не найдено.', 'UPSTREAM', 404)
  }

  if (!res.ok) {
    const mapped: ContentfulStatusCode =
      res.status === 401 || res.status === 403 || res.status === 429
        ? (res.status as ContentfulStatusCode)
        : 502
    throw new UpstreamError(`Kinopoisk API: ${res.status}`, 'UPSTREAM', mapped)
  }

  try {
    return await res.json()
  } catch {
    throw new UpstreamError('Некорректный ответ Kinopoisk API.', 'PARSE', 502)
  }
}

export async function searchByKeyword(keyword: string, page: number) {
  const params = new URLSearchParams({
    keyword: keyword.trim(),
    page: String(page),
  })
  const data = (await kpFetch(
    '/api/v2.1/films/search-by-keyword',
    params,
  )) as {
    films?: unknown[]
    pagesCount?: number
  }

  return {
    films: Array.isArray(data.films) ? data.films : [],
    pagesCount: typeof data.pagesCount === 'number' ? data.pagesCount : 1,
  }
}

export async function getFilmById(id: number) {
  const raw = (await kpFetch(`/api/v2.2/films/${id}`)) as Record<string, unknown>

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

export interface CollectionFilmItem {
  filmId: number
  nameRu: string | null
  nameEn: string | null
  year: string | null
  type: string
  posterUrlPreview?: string
  rating?: string
}

export async function getCollection(
  type: string,
  page: number,
): Promise<{ films: CollectionFilmItem[]; pagesCount: number; total: number }> {
  const params = new URLSearchParams({ type, page: String(page) })
  const data = (await kpFetch('/api/v2.2/films/collections', params)) as {
    items?: Record<string, unknown>[]
    totalPages?: number
    total?: number
  }

  const items = Array.isArray(data.items) ? data.items : []
  const films: CollectionFilmItem[] = items
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

  return {
    films,
    pagesCount: typeof data.totalPages === 'number' ? data.totalPages : 1,
    total: typeof data.total === 'number' ? data.total : films.length,
  }
}

