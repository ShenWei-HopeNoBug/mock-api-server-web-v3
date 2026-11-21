import { message } from 'ant-design-vue';
import { useDataManagerRequest } from '@apps/dataManager/hooks/useDataManagerRequest';
import type { DataManagerType } from '#/qt/dataManager';

const NOT_READY_MSG: string = 'requestManager 未初始化';

interface UseTestGroupApiOptions {
  /** requestManager 初始化成功后的回调（通常用于拉取首屏数据） */
  onReady?: () => void;
}

/**
 * testGroupManager 视图的 API hook。
 *
 * 封装 /test_group/* 协议请求，同时复用 /mock_data/* 协议操作组内接口条目
 * （组条目即 api_data 行，type='TEST_GROUP'，update/delete/detail 协议通用）。
 */
export const useTestGroupApi = (options: UseTestGroupApiOptions = {}) => {
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

  /** 获取测试组列表（含 item_count） */
  const getTestGroupList = (): Promise<DataManagerType.TestGroupListResult> =>
    guardedFetch<DataManagerType.TestGroupListResult, Record<string, any>>('/test_group/list', {});

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

  /** 启用测试组（单组启用，原子顶替其余组，切组立即生效） */
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

  /** 拷入 base 接口到测试组 */
  const copyIntoTestGroup = (
    params: DataManagerType.CopyIntoTestGroupParams,
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.CopyIntoTestGroupParams>(
      '/test_group/copy_into',
      params,
    );

  /** 获取 base 接口分页（拉取拷入入口喂数据，走白名单协议） */
  const getMockDataPage = (
    params: DataManagerType.GetMockDataPageParams = {},
  ): Promise<DataManagerType.GetMockDataPageRes> =>
    guardedFetch<DataManagerType.GetMockDataPageRes, DataManagerType.GetMockDataPageParams>(
      '/mock_data/list',
      params,
    );

  /** 更新接口数据（组条目编辑复用；type/group_id 后端不可变更） */
  const editMockData = (
    params: DataManagerType.EditMockDataParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.EditMockDataParams>(
      '/mock_data/update',
      params,
    );

  /** 删除接口数据（组条目删除复用） */
  const deleteMockData = (
    params: DataManagerType.DeleteMockDataParams = {},
  ): Promise<DataManagerType.OperationResult> =>
    guardedFetch<DataManagerType.OperationResult, DataManagerType.DeleteMockDataParams>(
      '/mock_data/delete',
      params,
    );

  return {
    isReady,
    getTestGroupList,
    getTestGroupDetail,
    createTestGroup,
    updateTestGroup,
    deleteTestGroup,
    enableTestGroup,
    disableTestGroup,
    copyIntoTestGroup,
    getMockDataPage,
    editMockData,
    deleteMockData,
  };
};
