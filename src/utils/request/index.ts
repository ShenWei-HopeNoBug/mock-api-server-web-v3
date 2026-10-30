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
import { $t } from '@/locales';

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
      message.error(error.message || $t('global.toast.sendError'));
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
      message.error(status_msg || $t('global.toast.retryError'));
    }

    return Promise.reject(res);
  },
  (error: AxiosError) => {
    if (!error.config?.noMessage && !filterErrorCodeSet.has(error.code ?? '')) {
      message.error(error.message || $t('global.toast.responseError'));
    }
    return Promise.reject(error);
  },
);

// 注意：响应拦截器已将返回值改写为业务数据 data，因此这里显式指定 R = T
// axios 1.19 的 AxiosResponseResult 条件类型在泛型未实例化时不会塌缩，需要断言收口
export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get<T, T>(url, config) as Promise<T>;
  },

  post<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    return service.post<T, T>(url, data, config) as Promise<T>;
  },

  put<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    return service.put<T, T>(url, data, config) as Promise<T>;
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete<T, T>(url, config) as Promise<T>;
  },
};

export default service;
