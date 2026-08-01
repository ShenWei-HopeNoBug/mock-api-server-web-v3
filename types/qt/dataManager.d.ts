/**
 * dataManager 相关 QT 桥接协议类型
 * */
export declare namespace DataManagerType {
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
    created_at?: string;
    updated_at?: string;
  }

  /**
   * 获取 api 数据分页传参
   * 协议：get_mock_data_page
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
   * 协议：get_mock_data_page
   * */
  interface GetMockDataPageRes {
    list?: ApiData[];
    total?: number;
    page_num?: number;
    page_size?: number;
  }

  /**
   * 编辑 api 数据传参
   * 协议：edit_mock_data
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
  }

  /**
   * 新增 api 数据传参
   * 协议：add_mock_data
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
   * 协议：delete_mock_data
   * */
  interface DeleteMockDataParams {
    id?: string;
  }

  /**
   * 批量删除 api 数据传参
   * 协议：batch_delete_mock_data
   * 筛选条件与 get_mock_data_page 一致，去除分页字段
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
   * 协议：copy_mock_data
   * */
  interface CopyMockDataParams {
    id?: string;
  }
}
