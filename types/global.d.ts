import { QtSdkType } from '#/qtSdk';

declare module 'axios' {
  // 扩展axios配置项
  interface AxiosRequestConfig {
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
