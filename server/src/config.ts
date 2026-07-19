import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadDotEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(__dirname, '../../.env'),
    resolve(__dirname, '../.env'),
  ]

  for (const path of candidates) {
    if (!existsSync(path)) continue
    const text = readFileSync(path, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = value
    }
    return
  }
}

loadDotEnv()

function env(name: string, fallback = ''): string {
  const v = process.env[name]
  return v === undefined || v === null ? fallback : String(v).trim()
}

function envInt(name: string, fallback: number): number {
  const raw = env(name)
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const config = {
  port: envInt('PORT', 8787),
  host: env('HOST', '0.0.0.0'),
  kpApiKey: env('KP_API_KEY'),
  kpApiBase: env('KP_API_BASE', 'https://kinopoiskapiunofficial.tech'),
  apigetDomain: env('APIGET_DOMAIN', 'kp.apiget.ru'),
  corsOrigins: env(
    'CORS_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080',
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  filtersDir: env('FILTERS_DIR', ''),
  rateLimitWindowMs: envInt('RATE_LIMIT_WINDOW_MS', 60_000),
  rateLimitMax: envInt('RATE_LIMIT_MAX', 120),
  trustProxy: env('TRUST_PROXY', '1') === '1',
}

export function assertConfig(): void {
  if (!config.kpApiKey) {
    console.warn('[movier-server] KP_API_KEY не задан')
  }
}
