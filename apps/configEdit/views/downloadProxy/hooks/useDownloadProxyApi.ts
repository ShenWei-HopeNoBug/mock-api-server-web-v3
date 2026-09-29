import { message } from 'ant-design-vue';
import { useDownloadProxyBridge } from '@apps/configEdit/hooks/useDownloadProxyBridge';
import type { DownloadProxyType } from '#/qt/downloadProxy';

const NOT_READY_MSG = 'requestManager 未初始化';

interface UseDownloadProxyApiOptions {
  onReady?: () => void;
}

export const useDownloadProxyApi = (options: UseDownloadProxyApiOptions = {}) => {
  const { requestManager, isReady, closeDialog } = useDownloadProxyBridge({
    onReady: options.onReady,
    onError: message.error,
  });

  const getDownloadProxyList = (): Promise<DownloadProxyType.GetDownloadProxyListRes> => {
    const manager = requestManager.value;
    if (!manager) {
      message.error(NOT_READY_MSG);
      return Promise.reject(new Error(NOT_READY_MSG));
    }
    return manager.fetch<DownloadProxyType.GetDownloadProxyListRes>('/download_proxy/list', {});
  };

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
