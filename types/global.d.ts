import { AxiosRequestConfig } from 'axios';

declare module 'axios' {
  // 扩展axios配置项
  interface AxiosRequestConfig {
    noMessage?: boolean;
  }
}
