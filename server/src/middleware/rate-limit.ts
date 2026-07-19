import type { Context, Next } from 'hono'
import { config } from '../config.js'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

function clientIp(c: Context): string {
  if (config.trustProxy) {
    const xf = c.req.header('x-forwarded-for')
    if (xf) {
      const first = xf.split(',')[0]?.trim()
      if (first) return first
    }
    const real = c.req.header('x-real-ip')
    if (real) return real.trim()
  }
  return c.req.header('cf-connecting-ip')?.trim() || 'unknown'
}

export async function rateLimit(c: Context, next: Next): Promise<Response | void> {
  const ip = clientIp(c)
  const now = Date.now()
  let bucket = buckets.get(ip)

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + config.rateLimitWindowMs }
    buckets.set(ip, bucket)
  }

  bucket.count += 1
  c.header('X-RateLimit-Limit', String(config.rateLimitMax))
  c.header(
    'X-RateLimit-Remaining',
    String(Math.max(0, config.rateLimitMax - bucket.count)),
  )
  c.header('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)))

  if (bucket.count > config.rateLimitMax) {
    return c.json({ error: 'rate_limited', message: 'Слишком много запросов.' }, 429)
  }

  await next()
}

setInterval(() => {
  const now = Date.now()
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key)
  }
}, 5 * 60_000).unref?.()
