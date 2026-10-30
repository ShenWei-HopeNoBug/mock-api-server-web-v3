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
      '/mock_data/list',
      params,
    );

  /** 编辑 Mock 接口数据 */
  const editMockData = (
    params: DataManagerType.EditMockDataParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.EditMockDataParams>(
      '/mock_data/update',
      params,
    );

  /** 新增 Mock 接口数据 */
  const addMockData = (
    params: DataManagerType.AddMockDataParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.AddMockDataParams>(
      '/mock_data/create',
      params,
    );

  /** 删除 Mock 接口数据 */
  const deleteMockData = (
    params: DataManagerType.DeleteMockDataParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.DeleteMockDataParams>(
      '/mock_data/delete',
      params,
    );

  /** 批量删除 Mock 接口数据（按筛选条件） */
  const batchDeleteMockData = (
    params: DataManagerType.BatchDeleteMockDataParams = {},
  ): Promise<DataManagerType.BatchOperationResult> =>
    guardedFetch<DataManagerType.BatchOperationResult, DataManagerType.BatchDeleteMockDataParams>(
      '/mock_data/batch_delete',
      params,
    );

  /** 复制 Mock 接口数据 */
  const copyMockData = (
    params: DataManagerType.CopyMockDataParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.CopyMockDataParams>(
      '/mock_data/copy',
      params,
    );

  /** 获取 Mock 接口详情数据 */
  const getMockDataDetail = (
    params: DataManagerType.GetMockDataDetailParams,
  ): Promise<DataManagerType.ApiDataDetail> =>
    guardedFetch<DataManagerType.ApiDataDetail, DataManagerType.GetMockDataDetailParams>(
      '/mock_data/detail',
      params,
    );

  /** 新增响应变体 */
  const addVariant = (
    params: DataManagerType.AddVariantParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.AddVariantParams>(
      '/variant/create',
      params,
    );

  /** 更新响应变体 */
  const updateVariant = (
    params: DataManagerType.UpdateVariantParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.UpdateVariantParams>(
      '/variant/update',
      params,
    );

  /** 删除响应变体 */
  const deleteVariant = (
    params: DataManagerType.DeleteVariantParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.DeleteVariantParams>(
      '/variant/delete',
      params,
    );

  /** 变体排序 */
  const reorderVariants = (
    params: DataManagerType.ReorderVariantParams,
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.ReorderVariantParams>(
      '/variant/reorder',
      params,
    );

  /** 复制响应变体 */
  const copyVariant = (
    params: DataManagerType.CopyVariantParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.CopyVariantParams>(
      '/variant/copy',
      params,
    );

  /** 设为唯一启用（禁用同 api_data_id 下的其他所有变体） */
  const setVariantExclusiveEnabled = (
    params: DataManagerType.SetVariantExclusiveEnabledParams,
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.SetVariantExclusiveEnabledParams>(
      '/variant/set_exclusive_enabled',
      params,
    );

  return {
    isReady,
    getMockDataPage,
    editMockData,
    addMockData,
    deleteMockData,
    batchDeleteMockData,
    copyMockData,
    getMockDataDetail,
    addVariant,
    updateVariant,
    deleteVariant,
    reorderVariants,
    copyVariant,
    setVariantExclusiveEnabled,
  };
};
