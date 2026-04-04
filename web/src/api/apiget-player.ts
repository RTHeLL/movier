import { getOrCreateUid, getOrCreateUidKp, getOrCreateYandexLogin } from '../storage'

const DEFAULT_DOMAIN = 'kp.apiget.ru'

export interface ApigetPlayerResult {
  error: number
  all_player: string[]
}

export class ApigetError extends Error {
  code: 'CORS_OR_NETWORK' | 'HTTP' | 'PARSE' | 'SERVER'

  constructor(message: string, code: 'CORS_OR_NETWORK' | 'HTTP' | 'PARSE' | 'SERVER') {
    super(message)
    this.name = 'ApigetError'
    this.code = code
  }
}

function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError && String(e.message).includes('fetch')
}

/** Минимальный HTML с ID фильма — аналог страницы Кинопоиска для поля html_code */
export function buildStubKinopoiskHtml(filmId: number): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Кинопоиск</title></head><body>
<div id="root" data-film-id="${filmId}">https://www.kinopoisk.ru/film/${filmId}/</div>
</body></html>`
}

function apigetDomain(): string {
  const d = import.meta.env.VITE_APIGET_DOMAIN
  if (d && String(d).trim()) return String(d).trim()
  return DEFAULT_DOMAIN
}

export async function fetchPlayerIframes(filmId: number): Promise<ApigetPlayerResult> {
  const url = `https://${apigetDomain()}/array_player.php`
  const fd = new FormData()
  fd.append('id', String(filmId))
  fd.append('version_extension', '16.2.3')
  fd.append('Manifest_extension', '{}')
  fd.append('uid', getOrCreateUid())
  fd.append('yandex_login', getOrCreateYandexLogin())
  fd.append('UID_KP', getOrCreateUidKp())
  fd.append('html_code', buildStubKinopoiskHtml(filmId))

  let res: Response
  try {
    res = await fetch(url, { method: 'POST', body: fd })
  } catch (e) {
    if (isNetworkError(e)) {
      throw new ApigetError(
        'Запрос к серверу плееров заблокирован (CORS или сеть). Откройте фильм на kinopoisk.ru с установленным расширением из папки extension/.',
        'CORS_OR_NETWORK',
      )
    }
    throw e
  }

  const text = await res.text()
  let data: { error?: number; all_player?: string[] }
  try {
    data = JSON.parse(text) as typeof data
  } catch {
    throw new ApigetError('Некорректный ответ сервера плееров.', 'PARSE')
  }

  const err = typeof data.error === 'number' ? data.error : -1
  const players = Array.isArray(data.all_player) ? data.all_player : []

  if (!res.ok && players.length === 0) {
    throw new ApigetError(`Сервер плееров: HTTP ${res.status}`, 'HTTP')
  }

  return { error: err, all_player: players }
}
