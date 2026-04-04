/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KP_API_KEY: string
  /** Необязательно: хост плеера (по умолчанию kp.apiget.ru) */
  readonly VITE_APIGET_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
