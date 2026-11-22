import { message } from 'ant-design-vue';
import { useDataManagerRequest } from '@apps/dataManager/hooks/useDataManagerRequest';
import type { DataManagerType } from '#/qt/dataManager';

const NOT_READY_MSG: string = 'requestManager 未初始化';

interface UseDataManagerApiOptions {
  /** requestManager 初始化成功后的回调（通常用于拉取首屏数据） */
  onReady?: () => void;
}

/**
 * dataManager 子应用统一 API hook。
 *
 * 承载 /mock_data/* + /variant/* + /test_group/* 协议方法全集（Qt 侧契约为准）。
 * 每调用点独立 useDataManagerRequest 生命周期：bridge/manager 随调用组件销毁而销毁。
 */
export const useDataManagerApi = (options: UseDataManagerApiOptions = {}) => {
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

  // ---------- /mock_data/* ----------

  /** 获取 Mock 接口分页数据 */
  const getMockDataPage = (
    params: DataManagerType.GetMockDataPageParams = {},
  ): Promise<DataManagerType.GetMockDataPageRes> =>
    guardedFetch<DataManagerType.GetMockDataPageRes, DataManagerType.GetMockDataPageParams>(
      '/mock_data/list',
      params,
    );

  /** 编辑 Mock 接口数据（组条目复用；type/group_id 后端不可变更） */
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

  // ---------- /variant/* ----------

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

  // ---------- /test_group/* ----------

  /** 获取测试组列表（含 item_count） */
  const getTestGroupList = (): Promise<DataManagerType.TestGroupListResult> =>
    guardedFetch<DataManagerType.TestGroupListResult, Record<string, any>>('/test_group/list', {});

  /** 获取测试组分页数据（name 模糊 / enabled 精确） */
  const getTestGroupPage = (
    params: DataManagerType.GetTestGroupPageParams = {},
  ): Promise<DataManagerType.TestGroupPageResult> =>
    guardedFetch<DataManagerType.TestGroupPageResult, DataManagerType.GetTestGroupPageParams>(
      '/test_group/page',
      params,
    );

  /** 获取当前启用测试组摘要（无启用组返回 null） */
  const getEnabledTestGroup = (): Promise<DataManagerType.TestGroupSummary | null> =>
    guardedFetch<DataManagerType.TestGroupSummary | null, Record<string, any>>(
      '/test_group/enabled',
      {},
    );

  /** 获取测试组详情（组字段 + 组内条目） */
  const getTestGroupDetail = (
    params: DataManagerType.GetTestGroupDetailParams,
  ): Promise<DataManagerType.TestGroupDetail> =>
    guardedFetch<DataManagerType.TestGroupDetail, DataManagerType.GetTestGroupDetailParams>(
      '/test_group/detail',
      params,
    );

  /** 新建测试组 */
  const createTestGroup = (
    params: DataManagerType.CreateTestGroupParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.CreateTestGroupParams>(
      '/test_group/create',
      params,
    );

  /** 更新测试组（字段级合并，不改 enabled） */
  const updateTestGroup = (
    params: DataManagerType.UpdateTestGroupParams,
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.UpdateTestGroupParams>(
      '/test_group/update',
      params,
    );

  /** 删除测试组（级联组内条目与变体） */
  const deleteTestGroup = (
    params: DataManagerType.DeleteTestGroupParams,
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.DeleteTestGroupParams>(
      '/test_group/delete',
      params,
    );

  /** 启用测试组（原子顶替其余组；启动即冻结，重启 mock 服务生效） */
  const enableTestGroup = (
    params: DataManagerType.EnableTestGroupParams,
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.EnableTestGroupParams>(
      '/test_group/enable',
      params,
    );

  /** 停用全部测试组 */
  const disableTestGroup = (): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, Record<string, any>>('/test_group/disable', {});

  /** 拷入接口到测试组（enabled 由调用方按入口语义传值） */
  const copyIntoTestGroup = (
    params: DataManagerType.CopyIntoTestGroupParams,
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.CopyIntoTestGroupParams>(
      '/test_group/copy_into',
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
    getTestGroupList,
    getTestGroupPage,
    getEnabledTestGroup,
    getTestGroupDetail,
    createTestGroup,
    updateTestGroup,
    deleteTestGroup,
    enableTestGroup,
    disableTestGroup,
    copyIntoTestGroup,
  };
};
