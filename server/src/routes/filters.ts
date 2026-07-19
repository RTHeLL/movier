import { createReadStream, existsSync, statSync } from 'node:fs'
import { dirname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { config } from '../config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ALLOWED = new Set(['movier.txt', 'movier-dnr.json'])

function resolveFiltersDir(): string {
  if (config.filtersDir) return resolve(config.filtersDir)
  return resolve(__dirname, '../../../filters')
}

function safeJoin(base: string, name: string): string | null {
  if (!ALLOWED.has(name)) return null
  const full = normalize(join(base, name))
  const baseNorm = normalize(base) + sep
  if (!full.startsWith(baseNorm) && full !== normalize(base)) return null
  return full
}

export const filtersRoutes = new Hono()

filtersRoutes.get('/:name', async (c) => {
  const name = c.req.param('name')
  const path = safeJoin(resolveFiltersDir(), name)
  if (!path || !existsSync(path)) {
    return c.json({ error: 'not_found' }, 404)
  }

  const st = statSync(path)
  const etag = `"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`
  if (c.req.header('if-none-match') === etag) return c.body(null, 304)

  c.header(
    'Content-Type',
    name.endsWith('.json')
      ? 'application/json; charset=utf-8'
      : 'text/plain; charset=utf-8',
  )
  c.header('ETag', etag)
  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
  c.header('X-Content-Type-Options', 'nosniff')

  return stream(c, async (s) => {
    await s.pipe(Readable.toWeb(createReadStream(path)) as ReadableStream<Uint8Array>)
  })
})
