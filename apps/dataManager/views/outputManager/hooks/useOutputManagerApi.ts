import { message } from 'ant-design-vue';
import { useDataManagerRequest } from '@apps/dataManager/hooks/useDataManagerRequest';
import type { DataManagerType } from '#/qt/dataManager';

/**
 * outputManager 视图的 API hook。
 *
 * 封装 5 个 Qt 协议请求，提供完整的 params/response 类型约束。
 * 内部通过 useDataManagerRequest 管理 requestManager 生命周期。
 */
interface UseOutputManagerApiOptions {
  /** requestManager 初始化成功后的回调（通常用于拉取首屏数据） */
  onReady?: () => void;
}

export const useOutputManagerApi = (options: UseOutputManagerApiOptions = {}) => {
  const { onReady } = options;
  const { requestManager, isReady } = useDataManagerRequest({
    timeout: 10000,
    onReady,
    onError: message.error,
  });

  /** 获取 Mock 接口分页数据 */
  const getMockDataPage = (
    params: DataManagerType.GetMockDataPageParams = {},
  ): Promise<DataManagerType.GetMockDataPageRes> => {
    const manager = requestManager.value;
    if (!manager) {
      return Promise.reject(new Error('requestManager 未初始化'));
    }
    return manager.fetch<DataManagerType.GetMockDataPageRes>('get_mock_data_page', params);
  };

  /** 编辑 Mock 接口数据 */
  const editMockData = (params: DataManagerType.EditMockDataParams = {}): Promise<boolean> => {
    const manager = requestManager.value;
    if (!manager) {
      return Promise.reject(new Error('requestManager 未初始化'));
    }
    return manager.fetch<boolean>('edit_mock_data', params);
  };

  /** 新增 Mock 接口数据 */
  const addMockData = (params: DataManagerType.AddMockDataParams = {}): Promise<boolean> => {
    const manager = requestManager.value;
    if (!manager) {
      return Promise.reject(new Error('requestManager 未初始化'));
    }
    return manager.fetch<boolean>('add_mock_data', params);
  };

  /** 删除 Mock 接口数据 */
  const deleteMockData = (params: DataManagerType.DeleteMockDataParams = {}): Promise<boolean> => {
    const manager = requestManager.value;
    if (!manager) {
      return Promise.reject(new Error('requestManager 未初始化'));
    }
    return manager.fetch<boolean>('delete_mock_data', params);
  };

  /** 复制 Mock 接口数据 */
  const copyMockData = (params: DataManagerType.CopyMockDataParams = {}): Promise<boolean> => {
    const manager = requestManager.value;
    if (!manager) {
      return Promise.reject(new Error('requestManager 未初始化'));
    }
    return manager.fetch<boolean>('copy_mock_data', params);
  };

  return {
    isReady,
    getMockDataPage,
    editMockData,
    addMockData,
    deleteMockData,
    copyMockData,
  };
};
