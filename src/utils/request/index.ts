import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { ContentTypeEnum, ResponseCodeEnum } from '@/enums';
import axios from 'axios';
import { message } from 'ant-design-vue';
import i18n from '@/locales';

// 要过滤的 axios 请求失败消息
const filterErrorCodeSet: Set<string> = new Set([
  'ERR_CANCELED', // 取消请求
]);

const BASE_URL: string = import.meta.env.VITE_BASE_URL || '';

const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': ContentTypeEnum.JSON,
  },
});

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    if (!error.config?.noMessage) {
      message.error(error.message || i18n.global.t('global.toast.sendError'));
    }
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { config, data: res } = response;
    const { status_code, status_msg = '' } = res;
    if (status_code === ResponseCodeEnum.SUCCESS_CODE) {
      return res.data;
    }

    if (!config.noMessage) {
      message.error(status_msg || i18n.global.t('global.toast.retryError'));
    }

    return Promise.reject(res);
  },
  (error: AxiosError) => {
    if (!error.config?.noMessage && !filterErrorCodeSet.has(error.code ?? '')) {
      message.error(error.message || i18n.global.t('global.toast.responseError'));
    }
    return Promise.reject(error);
  },
);

export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config);
  },

  post<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config);
  },

  put<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config);
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config);
  },
};

export default service;
