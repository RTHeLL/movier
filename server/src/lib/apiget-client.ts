import { config } from '../config.js'
import { UpstreamError } from './kp-client.js'

export interface ApigetPlayerResult {
  error: number
  all_player: string[]
}

function buildStubKinopoiskHtml(filmId: number): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Кинопоиск</title></head><body>
<div id="root" data-film-id="${filmId}">https://www.kinopoisk.ru/film/${filmId}/</div>
</body></html>`
}

function randomFromChars(length: number, chars: string): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export interface PlayerRequestIds {
  uid?: string
  yandexLogin?: string
  uidKp?: string
}

export async function fetchPlayerIframes(
  filmId: number,
  ids: PlayerRequestIds = {},
): Promise<ApigetPlayerResult> {
  if (!Number.isInteger(filmId) || filmId <= 0) {
    throw new UpstreamError('Некорректный ID фильма.', 'UPSTREAM', 400)
  }

  const url = `https://${config.apigetDomain}/array_player.php`
  const fd = new FormData()
  fd.append('id', String(filmId))
  fd.append('version_extension', '16.2.3')
  fd.append('Manifest_extension', '{}')
  fd.append(
    'uid',
    ids.uid || randomFromChars(16, 'abcdefghijklmnopqrstuvwxyz0123456789'),
  )
  fd.append(
    'yandex_login',
    ids.yandexLogin ||
      randomFromChars(12, 'abcdefghijklmnopqrstuvwxyz0123456789'),
  )
  fd.append(
    'UID_KP',
    ids.uidKp ||
      randomFromChars(
        32,
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      ),
  )
  fd.append('html_code', buildStubKinopoiskHtml(filmId))

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      body: fd,
      signal: AbortSignal.timeout(25_000),
      headers: { 'User-Agent': 'Movier/1.2' },
    })
  } catch {
    throw new UpstreamError(
      'Не удалось связаться с сервером плееров.',
      'NETWORK',
      502,
    )
  }

  const text = await res.text()
  let data: { error?: number; all_player?: string[] }
  try {
    data = JSON.parse(text) as typeof data
  } catch {
    throw new UpstreamError('Некорректный ответ сервера плееров.', 'PARSE', 502)
  }

  const players = Array.isArray(data.all_player) ? data.all_player : []
  const err = typeof data.error === 'number' ? data.error : -1

  if (!res.ok && players.length === 0) {
    throw new UpstreamError(
      `Сервер плееров: HTTP ${res.status}`,
      'UPSTREAM',
      502,
    )
  }

  return { error: err, all_player: players }
}

export async function fetchApigetStatus(): Promise<{ ok: boolean; raw: string }> {
  try {
    const res = await fetch(`https://${config.apigetDomain}/status.php`, {
      signal: AbortSignal.timeout(8_000),
      headers: { 'User-Agent': 'Movier/1.2' },
    })
    return { ok: res.ok, raw: (await res.text()).slice(0, 500) }
  } catch {
    return { ok: false, raw: '' }
  }
}

