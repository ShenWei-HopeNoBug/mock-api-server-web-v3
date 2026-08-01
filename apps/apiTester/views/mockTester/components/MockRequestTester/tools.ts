import { AxiosRequestConfig } from 'axios';
import qs from 'qs';
import type { MockRequestTesterType } from './type';

/**
 * 根据 method 与 content-type 构建请求数据
 */
export const buildRequestData = (config: {
  method: MockRequestTesterType.Method;
  contentType: MockRequestTesterType.ContentType;
  params: Record<string, any>;
  file?: File | null;
}): AxiosRequestConfig => {
  const { method, contentType, params, file } = config;

  if (method === 'GET') {
    return { params };
  }

  switch (contentType) {
    case 'application/json':
      return { data: params };
    case 'application/x-www-form-urlencoded':
      return {
        data: qs.stringify(params),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      };
    case 'multipart/form-data': {
      const formData = new FormData();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      if (file) {
        formData.append('file', file);
      }
      return {
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      };
    }
    default:
      return { data: params };
  }
};
