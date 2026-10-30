export declare namespace MockRequestTesterType {
  type Method = 'GET' | 'POST';

  type ContentType =
    'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded';

  interface Option {
    /** 模块标题 */
    title?: string;
    /** 初始 URL */
    url?: string;
    /** 初始请求方法 */
    method?: Method;
    /** 初始 Content-Type */
    contentType?: ContentType;
    /** 初始请求参数（JSON 字符串） */
    params?: string;
    /** 是否默认展开 */
    defaultExpanded?: boolean;
  }

  interface ResponseMeta {
    /** HTTP 状态码 */
    statusCode?: number;
    /** 请求耗时（ms） */
    duration?: number;
    /** 错误信息 */
    errorMsg?: string;
  }
}
