/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MANIFEST_API_KEY: string;
  readonly VITE_MANIFEST_API_BASE: string;
  readonly VITE_EPIC_GRAPHQL_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
