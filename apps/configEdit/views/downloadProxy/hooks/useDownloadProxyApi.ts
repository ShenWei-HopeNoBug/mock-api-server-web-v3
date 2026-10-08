import { message } from 'ant-design-vue';
import { useDownloadProxyBridge } from '@apps/configEdit/hooks/useDownloadProxyBridge';
import type { DownloadProxyType } from '#/qt/downloadProxy';

/** requestManager 未就绪时的统一报错文案 */
const NOT_READY_MSG = 'requestManager 未初始化';

interface UseDownloadProxyApiOptions {
  /** requestManager 初始化成功后的回调（通常用于拉取首屏数据） */
  onReady?: () => void;
}

/**
 * 封装 downloadProxy 相关的 QT 请求接口。
 *
 * - 基于 useDownloadProxyBridge 管理 bridge + requestManager 生命周期
 * - 每个接口调用前都会校验 requestManager 是否就绪，未就绪时提示报错并返回 rejected Promise
 */
export const useDownloadProxyApi = (options: UseDownloadProxyApiOptions = {}) => {
  const { requestManager, isReady, closeDialog } = useDownloadProxyBridge({
    onReady: options.onReady,
    onError: message.error,
  });

  /**
   * 获取下载代理配置列表。
   * requestManager 未就绪时提示报错并返回 rejected Promise。
   */
  const getDownloadProxyList = (): Promise<DownloadProxyType.GetDownloadProxyListRes> => {
    const manager = requestManager.value;
    if (!manager) {
      message.error(NOT_READY_MSG);
      return Promise.reject(new Error(NOT_READY_MSG));
    }
    return manager.fetch<DownloadProxyType.GetDownloadProxyListRes>('/download_proxy/list', {});
  };

  /**
   * 更新下载代理配置列表（全量覆盖）。
   * requestManager 未就绪时提示报错并返回 rejected Promise。
   */
  const updateDownloadProxyList = (
    params: DownloadProxyType.UpdateDownloadProxyListParams,
  ): Promise<void> => {
    const manager = requestManager.value;
    if (!manager) {
      message.error(NOT_READY_MSG);
      return Promise.reject(new Error(NOT_READY_MSG));
    }
    return manager.fetch<void, DownloadProxyType.UpdateDownloadProxyListParams>(
      '/download_proxy/update',
      params,
    );
  };

  return { isReady, getDownloadProxyList, updateDownloadProxyList, closeDialog };
};
