/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_BASE?: string
  readonly VITE_KP_API_KEY?: string
  readonly VITE_APIGET_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
