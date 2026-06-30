import fs from 'node:fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

/**
 * 规范化基础路径前缀（通常来自 VITE_PATHNAME）。
 *
 * 处理规则：
 * 1. 空值返回空字符串；
 * 2. 保证以 `/` 开头；
 * 3. 去掉末尾多余的 `/`，避免后续拼接出现双斜杠。
 */
const normalizeBasePathname = (value: string): string => {
  if (!value) return '';
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, '');
};

/**
 * 为本地开发（Vite serve）提供多子项目的 History 路由回退能力。
 *
 * 适用场景：
 * - URL 形如 `/apps/<appName>/...`（或带前缀：`<basePathname>/apps/<appName>/...`）
 * - 访问的是前端路由地址（非静态资源）
 *
 * 回退策略：
 * - 将请求重写到对应子项目入口：`/apps/<appName>/index.html`
 * - 仅在 `apps/<appName>/index.html` 实际存在时执行回退
 *
 * 说明：
 * - 该插件在本地 serve / preview 下生效，不影响生产构建产物。
 */
export const createMultiAppHistoryFallback = (basePathname = ''): Plugin => {
  const appsDir = resolve(__dirname, '../apps');
  const normalizedBase = normalizeBasePathname(basePathname || process.env.VITE_PATHNAME || '');

  const historyFallbackMiddleware = (
    req: { method?: string; url?: string },
    _res: unknown,
    next: () => void,
  ) => {
    // 仅处理 GET 请求，避免影响表单提交等非页面导航请求
    const method = (req.method || 'GET').toUpperCase();
    if (method !== 'GET') {
      return next();
    }

    // 去掉 query，仅按路径匹配
    const rawUrl = (req.url || '').split('?')[0];
    let matchedUrlPath = rawUrl;

    // 当配置了 basePathname 时，仅处理该前缀下的请求
    if (normalizedBase) {
      if (!matchedUrlPath.startsWith(`${normalizedBase}/`) && matchedUrlPath !== normalizedBase) {
        return next();
      }
      // 转为不带 base 的相对路径，统一后续匹配逻辑
      matchedUrlPath = matchedUrlPath.slice(normalizedBase.length) || '/';
    }

    // 仅匹配 /apps/<appName>/... 形式的多子项目路径
    const matchResult = matchedUrlPath.match(/^\/apps\/([^/]+)(?:\/.*)?$/);
    if (!matchResult) {
      return next();
    }

    // 带扩展名的请求视为静态资源，不做回退
    if (/\.[a-zA-Z0-9]+$/.test(matchedUrlPath)) {
      return next();
    }

    const appName = matchResult[1];
    const appIndexPath = resolve(appsDir, appName, 'index.html');
    // 子项目入口不存在则不改写，交由后续中间件处理
    if (!fs.existsSync(appIndexPath)) {
      return next();
    }

    // 回退到命中的子项目入口页，支持刷新/直达 history 路由
    req.url = `${normalizedBase}/apps/${appName}/index.html`;
    return next();
  };

  return {
    name: 'multi-app-history-fallback',
    configureServer(server) {
      server.middlewares.use(historyFallbackMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(historyFallbackMiddleware);
    },
  };
};
