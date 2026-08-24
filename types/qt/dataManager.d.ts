/**
 * dataManager 相关 QT 桥接协议类型
 * */
export declare namespace DataManagerType {
  /**
   * 操作结果
   * success: 操作是否成功
   * id: 操作成功时返回的记录 ID（可选）
   * */
  interface OperationResult {
    success: boolean;
    status_code: number;
    status_msg: string;
    id?: string;
  }

  /**
   * 批量操作结果
   */
  interface BatchOperationResult {
    success: boolean;
    status_code: number;
    status_msg: string;
    affected_count?: number;
  }

  /**
   * api 数据类型
   * */
  type ApiType = 'USER' | 'MITMPROXY';

  /**
   * api 请求方法
   * */
  type ApiMethod = 'GET' | 'POST';

  /**
   * 请求 content-type 枚举值
   * */
  type RequestContentType =
    | 'NONE'
    | 'APPLICATION_X_WWW_FORM_URLENCODED'
    | 'APPLICATION_JSON'
    | 'MULTIPART_FORM_DATA';

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
    created_at?: string;
    updated_at?: string;
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
   * response 变体数据
   * */
  interface ApiResponseVariant {
    id?: string;
    api_data_id?: string;
    name?: string;
    response?: string;
    enabled?: boolean;
    timeout?: number;
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
   * api 数据详情（含变体列表）
   * 协议：/mock_data/detail 返回数据
   * */
  interface ApiDataDetail extends ApiData {
    response_variants?: ApiResponseVariant[];
  }
}
