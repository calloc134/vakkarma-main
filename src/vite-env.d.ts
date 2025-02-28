/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTGRES_USER: string;
  readonly VITE_POSTGRES_PASSWORD: string;
  readonly VITE_POSTGRES_DB: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
