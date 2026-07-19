import type { Context, Next } from 'hono'
import { config } from '../config.js'

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false
  if (config.corsOrigins.includes('*')) return true
  return config.corsOrigins.includes(origin)
}

export async function corsMiddleware(c: Context, next: Next): Promise<Response | void> {
  const origin = c.req.header('origin')

  if (origin && isAllowedOrigin(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Vary', 'Origin')
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    c.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Accept, X-Requested-With',
    )
    c.header('Access-Control-Max-Age', '86400')
  }

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
}
