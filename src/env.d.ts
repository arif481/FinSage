/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
  readonly VITE_FUNCTIONS_REGION?: string
  readonly VITE_RECAPTCHA_SITE_KEY?: string
  readonly VITE_BASE_PATH?: string
  readonly VITE_ROUTER_MODE?: 'browser' | 'hash'
  readonly VITE_USE_EMULATORS?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
