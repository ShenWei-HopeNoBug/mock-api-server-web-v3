import { createI18n } from 'vue-i18n';
import enUS from './en-US';
import zhCN from './zh-CN';

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'en-US': enUS,
    'zh-CN': zhCN,
  },
});

// 组件外部翻译（如 axios 拦截器）
export const $t = (key: string, params?: Record<string, unknown>): string =>
  params ? i18n.global.t(key, params) : i18n.global.t(key);

// 组件外部读取当前语言（如请求头 lang 透传给服务端）
export const getLocale = (): string => i18n.global.locale.value as string;

export default i18n;
