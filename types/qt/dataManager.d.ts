/**
 * dataManager 相关 QT 桥接协议类型
 * */
export declare namespace DataManagerType {
  /**
   * 操作结果
   * id: 操作成功时返回的记录 ID（可选）
   * 注：信封 status_code 已承载成败语义，载荷只剩业务字段
   * */
  interface OperationResult {
    id?: string;
  }

  /**
   * 批量操作结果
   * affected_count: 影响的记录数
   */
  interface BatchOperationResult {
    affected_count?: number;
  }

  /**
   * api 数据类型
   * TEST_GROUP 仅出现在测试组条目数据上，列表筛选枚举不含此值
   * */
  type ApiType = 'USER' | 'MITMPROXY' | 'MCP' | 'TEST_GROUP';

  /**
   * api 请求方法
   * */
  type ApiMethod = 'GET' | 'POST';

  /**
   * 请求 content-type 枚举值
   * */
  type RequestContentType =
    'NONE' | 'APPLICATION_X_WWW_FORM_URLENCODED' | 'APPLICATION_JSON' | 'MULTIPART_FORM_DATA';

  /**
   * api 数据
   * */
  interface ApiData {
    id?: string;
    type?: ApiType;
    url?: string;
    method?: ApiMethod;
    request_content_type?: RequestContentType;
    params?: string;
    response?: string;
    timeout?: number;
    enabled?: boolean;
    response_variant_ids?: string[];
    operator?: string;
    created_at?: string;
    updated_at?: string;
    /** 所属测试组 ID，仅 type='TEST_GROUP' 的组条目有值 */
    group_id?: string;
  }

  /**
   * 获取 api 数据分页传参
   * 协议：/mock_data/list
   * */
  interface GetMockDataPageParams {
    page_num?: number;
    page_size?: number;
    type?: ApiType;
    url?: string;
    params?: string;
    response?: string;
    method?: ApiMethod;
    request_content_type?: RequestContentType;
    create_start_time?: string;
    create_end_time?: string;
    operator?: string;
  }

  /**
   * 获取 api 数据分页结果
   * 协议：/mock_data/list
   * */
  interface GetMockDataPageRes {
    list?: ApiData[];
    total?: number;
    page_num?: number;
    page_size?: number;
  }

  /**
   * 编辑 api 数据传参
   * 协议：/mock_data/update
   * */
  interface EditMockDataParams {
    id?: string;
    type?: ApiType;
    url?: string;
    method?: ApiMethod;
    request_content_type?: RequestContentType;
    params?: string;
    response?: string;
    timeout?: number;
    enabled?: boolean;
    operator?: string;
  }

  /**
   * 新增 api 数据传参
   * 协议：/mock_data/create
   * */
  interface AddMockDataParams {
    type?: ApiType;
    url?: string;
    method?: ApiMethod;
    request_content_type?: RequestContentType;
    params?: string;
    response?: string;
    timeout?: number;
    operator?: string;
  }

  /**
   * 删除 api 数据传参
   * 协议：/mock_data/delete
   * */
  interface DeleteMockDataParams {
    id?: string;
  }

  /**
   * 批量删除 api 数据传参
   * 协议：/mock_data/batch_delete
   * 筛选条件与 /mock_data/list 一致，去除分页字段
   * */
  interface BatchDeleteMockDataParams {
    type?: ApiType;
    url?: string;
    params?: string;
    response?: string;
    method?: ApiMethod;
    request_content_type?: RequestContentType;
    create_start_time?: string;
    create_end_time?: string;
    operator?: string;
  }

  /**
   * 复制 api 数据传参
   * 协议：/mock_data/copy
   * */
  interface CopyMockDataParams {
    id?: string;
  }

  /**
   * 获取 api 数据详情传参
   * 协议：/mock_data/detail
   * */
  interface GetMockDataDetailParams {
    id?: string;
  }

  /**
   * 响应变体来源类型
   * */
  type VariantType = 'USER' | 'MCP';

  /**
   * response 变体数据
   * */
  interface ApiResponseVariant {
    id?: string;
    api_data_id?: string;
    name?: string;
    response?: string;
    enabled?: boolean;
    timeout?: number;
    operator?: string;
    type?: VariantType;
    created_at?: string;
    updated_at?: string;
  }

  /**
   * 新增变体传参
   * 协议：/variant/create
   * */
  interface AddVariantParams {
    api_data_id?: string;
    name?: string;
    response?: string;
    enabled?: boolean;
    timeout?: number;
    operator?: string;
    type?: VariantType;
  }

  /**
   * 更新变体传参
   * 协议：/variant/update
   * */
  interface UpdateVariantParams {
    id?: string;
    name?: string;
    response?: string;
    enabled?: boolean;
    timeout?: number;
    operator?: string;
    // type 创建后不可变更，update 时忽略（保留该字段用于协议兼容，但不应主动传入）
    type?: VariantType;
  }

  /**
   * 删除变体传参
   * 协议：/variant/delete
   * */
  interface DeleteVariantParams {
    id?: string;
  }

  /**
   * 变体排序传参
   * 协议：/variant/reorder
   * */
  interface ReorderVariantParams {
    api_data_id?: string;
    variant_ids?: string[];
  }

  /**
   * 复制变体传参
   * 协议：/variant/copy
   * */
  interface CopyVariantParams {
    id?: string;
    api_data_id?: string;
  }

  /**
   * 设为唯一启用传参
   * 协议：/variant/set_exclusive_enabled
   * */
  interface SetVariantExclusiveEnabledParams {
    id?: string;
  }

  /**
   * api 数据详情（含变体列表）
   * 协议：/mock_data/detail 返回数据
   * */
  interface ApiDataDetail extends ApiData {
    response_variants?: ApiResponseVariant[];
  }

  /**
   * 测试组记录
   * enabled 全局至多一个组为 true（单组启用，原子顶替）
   * */
  interface TestGroup {
    id?: string;
    name?: string;
    enabled?: boolean;
    operator?: string;
    created_at?: string;
    updated_at?: string;
  }

  /**
   * 测试组列表行（含组内条目计数）
   * */
  interface TestGroupSummary extends TestGroup {
    item_count?: number;
  }

  /**
   * 测试组详情（组字段 + 组内接口条目列表）
   * 协议：/test_group/detail 返回数据
   * */
  interface TestGroupDetail extends TestGroup {
    items?: ApiData[];
  }

  /**
   * 获取测试组列表结果
   * 协议：/test_group/list
   * */
  interface TestGroupListResult {
    list?: TestGroupSummary[];
  }

  /**
   * 获取测试组分页传参
   * 协议：/test_group/page
   * name 组名称模糊查询；enabled 启用状态精确查询（仅 bool 生效）
   * */
  interface GetTestGroupPageParams {
    page_num?: number;
    page_size?: number;
    name?: string;
    enabled?: boolean;
  }

  /**
   * 获取测试组分页结果
   * 协议：/test_group/page
   * */
  interface TestGroupPageResult {
    list?: TestGroupSummary[];
    total?: number;
    page_num?: number;
    page_size?: number;
  }

  /**
   * 获取测试组详情传参
   * 协议：/test_group/detail
   * */
  interface GetTestGroupDetailParams {
    id?: string;
  }

  /**
   * 新建测试组传参
   * 协议：/test_group/create
   * */
  interface CreateTestGroupParams {
    name?: string;
  }

  /**
   * 更新测试组传参
   * 协议：/test_group/update
   * enabled 不可经此接口修改（由 enable/disable 原子管理）
   * */
  interface UpdateTestGroupParams {
    id?: string;
    name?: string;
  }

  /**
   * 删除测试组传参（级联删除组内条目与变体）
   * 协议：/test_group/delete
   * */
  interface DeleteTestGroupParams {
    id?: string;
  }

  /**
   * 启用测试组传参（单组启用，原子顶替其余组）
   * 协议：/test_group/enable
   * */
  interface EnableTestGroupParams {
    id?: string;
  }

  /**
   * 拷入接口到测试组传参
   * 协议：/test_group/copy_into
   * enabled 按入口语义传值：outputManager 推入 false / 组详情拉取 true
   * */
  interface CopyIntoTestGroupParams {
    api_id?: string;
    group_id?: string;
    copy_variants?: boolean;
    enabled?: boolean;
  }
}
