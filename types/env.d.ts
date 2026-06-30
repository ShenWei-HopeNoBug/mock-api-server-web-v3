interface ImportMetaEnv {
  readonly VITE_PATHNAME: string;
  readonly VITE_BASE_URL: string;
  readonly [key: string]: string | boolean | number | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
