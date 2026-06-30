import { createI18n } from 'vue-i18n';
import enUS from './en-US';
import zhCN from './zh-CN';

const i18n = createI18n({
  legacy: false, // 必须设置为 false 以使用 Composition API 模式
  locale: 'zh-CN', // 设置默认语言
  fallbackLocale: 'zh-CN', // 设置回退语言
  messages: {
    'en-US': enUS,
    'zh-CN': zhCN,
  },
});

export default i18n;
