interface ImportMetaEnv {
  readonly VITE_PATHNAME: string;
  readonly VITE_BASE_URL: string;
  readonly [key: string]: string | boolean | number | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'json-editor-vue3' {
  import type { DefineComponent } from 'vue';

  const JsonEditorVue: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;

  export default JsonEditorVue;
}
