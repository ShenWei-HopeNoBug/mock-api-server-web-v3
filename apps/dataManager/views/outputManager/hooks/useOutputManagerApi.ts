import { message } from 'ant-design-vue';
import { useDataManagerRequest } from '@apps/dataManager/hooks/useDataManagerRequest';
import type { DataManagerType } from '#/qt/dataManager';

const NOT_READY_MSG: string = 'requestManager 未初始化';

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

  /** 统一守卫：requestManager 未就绪时弹 toast 并 reject，否则执行 fetch */
  const guardedFetch = <T = any, P extends Record<string, any> = Record<string, any>>(
    action: string,
    params: P,
  ): Promise<T> => {
    const manager = requestManager.value;
    if (!manager) {
      message.error(NOT_READY_MSG);
      return Promise.reject(new Error(NOT_READY_MSG));
    }
    return manager.fetch<T, P>(action, params);
  };

  /** 获取 Mock 接口分页数据 */
  const getMockDataPage = (
    params: DataManagerType.GetMockDataPageParams = {},
  ): Promise<DataManagerType.GetMockDataPageRes> =>
    guardedFetch<DataManagerType.GetMockDataPageRes, DataManagerType.GetMockDataPageParams>(
      'get_mock_data_page',
      params,
    );

  /** 编辑 Mock 接口数据 */
  const editMockData = (params: DataManagerType.EditMockDataParams = {}): Promise<boolean> =>
    guardedFetch<boolean, DataManagerType.EditMockDataParams>('edit_mock_data', params);

  /** 新增 Mock 接口数据 */
  const addMockData = (params: DataManagerType.AddMockDataParams = {}): Promise<boolean> =>
    guardedFetch<boolean, DataManagerType.AddMockDataParams>('add_mock_data', params);

  /** 删除 Mock 接口数据 */
  const deleteMockData = (params: DataManagerType.DeleteMockDataParams = {}): Promise<boolean> =>
    guardedFetch<boolean, DataManagerType.DeleteMockDataParams>('delete_mock_data', params);

  /** 批量删除 Mock 接口数据（按筛选条件） */
  const batchDeleteMockData = (
    params: DataManagerType.BatchDeleteMockDataParams = {},
  ): Promise<boolean> =>
    guardedFetch<boolean, DataManagerType.BatchDeleteMockDataParams>(
      'batch_delete_mock_data',
      params,
    );

  /** 复制 Mock 接口数据 */
  const copyMockData = (params: DataManagerType.CopyMockDataParams = {}): Promise<boolean> =>
    guardedFetch<boolean, DataManagerType.CopyMockDataParams>('copy_mock_data', params);

  return {
    isReady,
    getMockDataPage,
    editMockData,
    addMockData,
    deleteMockData,
    batchDeleteMockData,
    copyMockData,
  };
};
