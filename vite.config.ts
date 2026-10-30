import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import { resolve } from 'path';
import svgLoader from 'vite-svg-loader';
import legacy from '@vitejs/plugin-legacy';
import { getAppEntryConfig } from './scripts/package';
import { createMultiAppHistoryFallback } from './scripts/createMultiAppHistoryFallback';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

const ROOT: string = resolve(__dirname);
const TYPES: string = `${ROOT}/types`;
const APPS: string = `${ROOT}/apps`;
const SRC: string = `${ROOT}/src`;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 打包要忽略的应用
  const ignoreApps = mode === 'production' ? ['apiTester'] : [];
  const appEntryConfig = getAppEntryConfig(ignoreApps);

  return {
    base: env.VITE_PATHNAME || './',
    plugins: [
      vue(),
      viteCommonjs(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: 'css',
          }),
        ],
      }),
      svgLoader({
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false,
                },
              },
            },
            'removeEditorsNSData',
            'removeEmptyContainers',
            'removeUnusedNS',
            'mergePaths',
            {
              name: 'inlineStyles',
              params: {
                onlyMatchedOnce: false,
                removeMatchedSelectors: true,
              },
            },
            'mergeStyles',
            'removeHiddenElems',
            'removeEmptyText',
            'removeEmptyAttrs',
            'cleanupNumericValues',
            'convertColors',
            {
              name: 'cleanupIds',
              params: {
                minify: true,
              },
            },
            'sortAttrs',
          ],
        },
      }),
      legacy({
        targets: [
          'Chrome >= 64',
          'Edge >= 79',
          'Firefox >= 67',
          'Safari >= 12',
          'iOS >= 12',
          'Android >= 8',
        ],
        modernPolyfills: true,
      }),
      // 多子项目 History 路由回退插件
      createMultiAppHistoryFallback(env.VITE_PATHNAME || ''),
    ],
    resolve: {
      alias: [
        {
          find: '@/',
          replacement: `${SRC}/`,
        },
        {
          find: '#/',
          replacement: `${TYPES}/`,
        },
        {
          find: '@apps/',
          replacement: `${APPS}/`,
        },
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 使用现代编译器 API
          api: 'modern-compiler',
          // 抑制来自第三方库（NutUI）的 @import 弃用警告
          silenceDeprecations: ['import'],
          javascriptEnabled: true,
          additionalData: `@use "@/styles/variables.scss" as *;`,
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/slow_network': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/static': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: mode === 'test',
      outDir: 'web-v3',
      assetsDir: 'assets',
      // 小于此阈值的资源将内联为 base64
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          // 生产环境移除 console
          drop_console: false,
          drop_debugger: false,
        },
      },
      rollupOptions: {
        input: appEntryConfig,
        output: {
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: assetInfo => {
            // 图片文件放到 images 目录下
            if (
              /\.(png|jpe?g|svg|gif|webp|avif|bmp|ico|tiff?|svgz?)$/i.test(assetInfo.name || '')
            ) {
              return 'images/[name]-[hash].[ext]';
            }

            // 字体文件放到 fonts 目录下
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
              return 'fonts/[name]-[hash].[ext]';
            }

            // 其他资源保持原样
            return '[ext]/[name]-[hash].[ext]';
          },
          // 代码拆分
          manualChunks: id => {
            if (!id.includes('node_modules')) return;

            // scope 包（@scope/name）需要取两段路径才能得到真实包名
            const parts = id.split('node_modules/')[1].split('/');
            const moduleName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

            // 核心框架库单独打包，便于长缓存
            if (['vue', 'vue-router', 'pinia', 'vue-i18n'].includes(moduleName)) {
              return 'vue-vendor';
            }
            if (['ant-design-vue', '@ant-design/icons-vue'].includes(moduleName)) {
              return 'antd-vendor';
            }
          },
        },
      },
    },
  };
});
