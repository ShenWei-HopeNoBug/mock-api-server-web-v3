/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 多子项目部署路径前缀（如 /foo），供 history 回退与路由 base 使用 */
  readonly VITE_PATHNAME: string;
  /** 后端 API 服务地址，axios baseURL / 路由 base */
  readonly VITE_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
