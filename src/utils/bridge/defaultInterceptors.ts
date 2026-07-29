import type QtRequestManager from './QtRequestManager';
import type { QtRequestManagerType } from './type';

/** 默认响应拦截器：解包 QtResponse → ResponsePayload.data（业务数据） */
export const defaultResponseOnFulfilled = (qtResponse: QtRequestManagerType.QtResponse) =>
  qtResponse.data.data;

/** 默认错误拦截器：noMessage 检查 + 全局 toast */
export const defaultResponseOnRejected = (
  error: QtRequestManagerType.QtRequestError,
  messageFn: (msg: string) => void,
) => {
  if (!error.config?.noMessage) {
    messageFn(error.message || '响应错误！');
  }
  return Promise.reject(error);
};

/**
 * 为 QtRequestManager 注册默认响应拦截器。
 * @param manager QtRequestManager 实例
 * @param messageFn 全局消息提示函数（如 ant-design-vue 的 message.error）
 */
export const setupDefaultInterceptors = (
  manager: QtRequestManager,
  messageFn: (msg: string) => void,
): void => {
  manager.interceptors.response.use(
    defaultResponseOnFulfilled,
    (error: QtRequestManagerType.QtRequestError) => defaultResponseOnRejected(error, messageFn),
  );
};
