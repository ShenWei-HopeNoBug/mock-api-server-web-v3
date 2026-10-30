import type { AxiosRequestConfig } from 'axios';
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
  deviceId?: string;
}): AxiosRequestConfig => {
  const { method, contentType, params, file, deviceId = '' } = config;

  let requestConfig: AxiosRequestConfig = {};

  if (method === 'GET') {
    requestConfig = { params };
  } else {
    switch (contentType) {
      case 'application/json':
        requestConfig = { data: params };
        break;
      case 'application/x-www-form-urlencoded':
        requestConfig = {
          data: qs.stringify(params),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        };
        break;
      case 'multipart/form-data': {
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        if (file) {
          formData.append('file', file);
        }
        requestConfig = {
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
        break;
      }
      default:
        requestConfig = { data: params };
    }
  }

  if (deviceId) {
    requestConfig = {
      ...requestConfig,
      headers: {
        ...(requestConfig.headers || {}),
        'Mock-Server-Device-Id': deviceId,
      },
    };
  }

  return requestConfig;
};
