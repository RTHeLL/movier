import { Hono } from 'hono'
import { fetchApigetStatus, fetchPlayerIframes } from '../lib/apiget-client.js'
import { UpstreamError } from '../lib/kp-client.js'

export const playersRoutes = new Hono()

playersRoutes.get('/status', async (c) => {
  const status = await fetchApigetStatus()
  return c.json({
    upstream: status.ok ? 'ok' : 'down',
    detail: status.raw || null,
  })
})

playersRoutes.post('/', async (c) => {
  let body: {
    filmId?: unknown
    uid?: unknown
    yandexLogin?: unknown
    uidKp?: unknown
  }

  try {
    body = (await c.req.json()) as typeof body
  } catch {
    return c.json({ error: 'bad_request', message: 'Ожидается JSON.' }, 400)
  }

  const filmId = Number(body.filmId)
  if (!Number.isInteger(filmId) || filmId <= 0) {
    return c.json({ error: 'bad_request', message: 'Некорректный filmId.' }, 400)
  }

  try {
    const result = await fetchPlayerIframes(filmId, {
      uid: typeof body.uid === 'string' ? body.uid.slice(0, 64) : undefined,
      yandexLogin:
        typeof body.yandexLogin === 'string'
          ? body.yandexLogin.slice(0, 64)
          : undefined,
      uidKp: typeof body.uidKp === 'string' ? body.uidKp.slice(0, 64) : undefined,
    })
    return c.json(result)
  } catch (e) {
    if (e instanceof UpstreamError) {
      return c.json({ error: e.code, message: e.message }, e.status)
    }
    throw e
  }
})
