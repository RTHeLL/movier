import { Hono } from 'hono'
import { getCollection, getFilmById, searchByKeyword, UpstreamError } from '../lib/kp-client.js'

export const kpRoutes = new Hono()

kpRoutes.get('/top', async (c) => {
  const page = Number.parseInt(c.req.query('page') || '1', 10)
  if (!Number.isInteger(page) || page < 1) {
    return c.json({ error: 'bad_request', message: 'Некорректный page.' }, 400)
  }
  try {
    return c.json(await getCollection('TOP_POPULAR_ALL', page))
  } catch (e) {
    if (e instanceof UpstreamError) {
      return c.json({ error: e.code, message: e.message }, e.status)
    }
    throw e
  }
})

kpRoutes.get('/search', async (c) => {
  const keyword = (c.req.query('keyword') || '').trim()
  const page = Number.parseInt(c.req.query('page') || '1', 10)
  if (!keyword) {
    return c.json({ error: 'bad_request', message: 'Параметр keyword обязателен.' }, 400)
  }
  if (!Number.isInteger(page) || page < 1) {
    return c.json({ error: 'bad_request', message: 'Некорректный page.' }, 400)
  }
  try {
    return c.json(await searchByKeyword(keyword, page))
  } catch (e) {
    if (e instanceof UpstreamError) {
      return c.json({ error: e.code, message: e.message }, e.status)
    }
    throw e
  }
})

kpRoutes.get('/films/:id', async (c) => {
  const id = Number.parseInt(c.req.param('id'), 10)
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'bad_request', message: 'Некорректный ID.' }, 400)
  }
  try {
    return c.json(await getFilmById(id))
  } catch (e) {
    if (e instanceof UpstreamError) {
      return c.json({ error: e.code, message: e.message }, e.status)
    }
    throw e
  }
})
