import { onBeforeUnmount, ref, watch } from 'vue';
import { isObject } from 'lodash-es';
import { useQtBridgeStore } from '@apps/configEdit/store/useQtBridge';
import QtBridge from '@/utils/bridge/QtBridge';
import QtRequestManager from '@/utils/bridge/QtRequestManager';
import { setupDefaultInterceptors } from '@/utils/bridge/defaultInterceptors';
import { isBridgeUsable } from '@/utils/bridge/tools';
import { createQtEventSender } from '@/utils/bridge/QtEventSender';

interface UseDownloadProxyBridgeOptions {
  /** 请求超时时间（ms），默认 10000 */
  timeout?: number;
  /** requestManager 初始化成功后的回调（通常用于拉取首屏数据） */
  onReady?: () => void;
  /** 通信对象获取失败时的错误回调，默认 console.error */
  onError?: (msg: string) => void;
}

/**
 * 管理 downloadProxy 通道的 QtBridge + QtRequestManager 生命周期。
 *
 * - 监听 qtBridgeStore.register，注册完成后自动初始化 bridge + requestManager
 * - 组件卸载时自动销毁 bridge + requestManager
 * - 初始化成功后通过 onReady 回调通知调用方
 */
export const useDownloadProxyBridge = (options: UseDownloadProxyBridgeOptions = {}) => {
  const { timeout = 10000, onReady, onError = console.error } = options;

  /** Qt 桥接 store，提供 channelObj 和 register 状态 */
  const qtBridgeStore = useQtBridgeStore();
  /** QtRequestManager 实例引用，未初始化时为 null */
  const requestManager = ref<QtRequestManager | null>(null);
  /** requestManager 是否已初始化就绪 */
  const isReady = ref<boolean>(false);
  /** QtBridge 实例引用（非响应式，无需触发视图更新） */
  let bridge: QtBridge | null = null;

  const sendEvent = createQtEventSender(() => bridge, onError);

  /**
   * 销毁 bridge + requestManager，重置就绪状态。
   * 先销毁 requestManager（清理 pending 请求），再销毁 bridge（解绑底层订阅）。
   */
  const destroy = (): void => {
    requestManager.value?.destroy();
    requestManager.value = null;
    bridge?.destroy();
    bridge = null;
    isReady.value = false;
  };

  /**
   * 从 store 获取 downloadProxy 通信对象，创建 bridge + requestManager 并注册拦截器。
   * 初始化成功后标记 isReady 并触发 onReady 回调。
   */
  const init = (): void => {
    if (isReady.value) {
      return;
    }

    const { downloadProxy = null } = qtBridgeStore.channelObj || {};
    if (!isObject(downloadProxy) || !isBridgeUsable(downloadProxy)) {
      onError('downloadProxy 通信对象获取失败！');
      return;
    }

    destroy();

    bridge = new QtBridge({ bridge: downloadProxy });
    const manager = new QtRequestManager(bridge, { timeout });
    setupDefaultInterceptors(manager, onError);
    requestManager.value = manager;
    isReady.value = true;

    if (typeof onReady === 'function') {
      onReady();
    }
  };

  /** 组件卸载时自动销毁，防止 pending Promise 永久挂起 */
  onBeforeUnmount(() => {
    destroy();
  });

  const closeDialog = (): void => {
    sendEvent('download_proxy.close_requested', { errorMessage: '关闭窗口通知发送失败' });
  };

  /** 监听 Qt 注册状态，注册完成后自动初始化 */
  watch(
    () => qtBridgeStore.register,
    bool => {
      if (bool) {
        init();
      }
    },
    { immediate: true },
  );

  return { requestManager, isReady, closeDialog };
};
