import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { assertConfig, config } from './config.js'
import { corsMiddleware } from './middleware/cors.js'
import { rateLimit } from './middleware/rate-limit.js'
import { filtersRoutes } from './routes/filters.js'
import { kpRoutes } from './routes/kp.js'
import { playersRoutes } from './routes/players.js'

assertConfig()

const app = new Hono()

app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('X-Frame-Options', 'DENY')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  await next()
})

app.use('/api/*', corsMiddleware)
app.use('/api/*', rateLimit)
app.use('/filters/*', corsMiddleware)
app.use('/filters/*', rateLimit)

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    service: 'movier',
    kpConfigured: Boolean(config.kpApiKey),
    apigetDomain: config.apigetDomain,
  }),
)

app.route('/api/kp', kpRoutes)
app.route('/api/players', playersRoutes)
app.route('/filters', filtersRoutes)

app.notFound((c) => c.json({ error: 'not_found' }, 404))

app.onError((err, c) => {
  console.error('[movier-server]', err)
  return c.json({ error: 'internal', message: 'Внутренняя ошибка сервера.' }, 500)
})

serve(
  {
    fetch: app.fetch,
    hostname: config.host,
    port: config.port,
  },
  (info) => {
    console.log(`[movier-server] http://${info.address}:${info.port}`)
  },
)
