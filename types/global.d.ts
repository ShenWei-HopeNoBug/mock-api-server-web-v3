import { QtSdkType } from '#/qtSdk';

// 扩展 axios 配置项
declare module 'axios' {
  interface AxiosRequestConfig {
    /** 置为 true 时拦截器不再弹出全局错误提示 */
    noMessage?: boolean;
  }
}

declare global {
  interface Window {
    qt?: QtSdkType.Qt;
    QWebChannel?: QtSdkType.QWebChannel;
  }
}

export {};
