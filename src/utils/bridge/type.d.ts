import type { QtSdkType } from '#/qtSdk';

export declare namespace QtBridgeType {
  type Bridge = QtSdkType.Bridge;

  interface GetQtBridgeDataRes {
    channel: QtSdkType.QtChannel | null;
    channelObj: Record<string, Bridge> | null;
    error: boolean;
    message: string;
  }

  interface ConstructorProps {
    bridge?: Bridge | null;
  }

  interface EventMap extends Record<string, any[]> {
    RECEIVE: [string];
    BEFORE_DESTROY: [];
  }

  /** send / sendObjMsg 返回值 */
  interface SendResult {
    /** 是否已成功调用底层发送方法 */
    success: boolean;
  }
}

export declare namespace InterceptorManagerType {
  type OnFulfilled<V> = (value: V) => any | Promise<any>;
  type OnRejected = (error: any) => any | Promise<any>;

  interface InterceptorHandler<V> {
    onFulfilled?: OnFulfilled<V>;
    onRejected?: OnRejected;
  }
}

export declare namespace QtRequestManagerType {
  /** 请求配置 */
  interface RequestConfig {
    /** 请求名称（协议标识） */
    name: string;
    /** 请求参数，对应消息体的 params 字段 */
    params?: Record<string, any>;
    /** 请求业务数据，对应消息体的 data 字段 */
    data?: Record<string, any>;
    /** 超时时间（ms），不传则使用 defaultTimeout */
    timeout?: number;
    /** 是否跳过全局错误提示（拦截器读取） */
    noMessage?: boolean;
  }

  /** Qt 下发的响应载荷 */
  interface ResponsePayload {
    type: string;
    name: string;
    data: any;
    action_id: string;
    status_code: number;
    status_msg?: string;
  }

  /** pending 请求内部记录 */
  interface PendingRequest {
    actionId: string;
    name: string;
    config: RequestConfig;
    resolve: (payload: any) => void;
    reject: (error: any) => void;
    timerId: number | null;
    settled: boolean;
  }

  /** 错误码 */
  type QtRequestErrorCode =
    | 'TIMEOUT'
    | 'BRIDGE_NOT_READY'
    | 'DESTROYED'
    | 'BRIDGE_DESTROYED'
    | 'RESPONSE_ERROR'
    | 'SEND_FAILED'
    | 'PARSE_ERROR'
    | 'RESPONSE_HANDLE_ERROR';

  /** 请求错误 */
  interface QtRequestError {
    code: QtRequestErrorCode;
    message: string;
    /** 触发错误的请求名称 */
    reqName?: string;
    /** 关联的请求配置 */
    config?: RequestConfig;
  }

  /** QtRequestError 构造参数 */
  interface QtRequestErrorOptions {
    code: QtRequestErrorCode;
    message: string;
    reqName?: string;
    config?: RequestConfig;
  }

  /** parseMessage 返回值 */
  interface ParseMessageResult {
    /** 解析是否成功 */
    success: boolean;
    /** 原始消息 JSON 字符串 */
    response: string;
    /** 解析后的对象，解析失败时为 null */
    data: ResponsePayload | null;
  }

  /** fetch 方法的配置项（request 的精简版，排除 name/params/data） */
  type FetchConfig = Omit<RequestConfig, 'name' | 'params' | 'data'>;

  /** 构造器选项 */
  interface ConstructorOptions {
    timeout?: number;
  }

  /** 响应包装：拦截器 onFulfilled 接收的参数（对标 AxiosResponse） */
  interface QtResponse {
    /** 原始请求配置 */
    config: RequestConfig;
    /** Qt 下发的响应载荷 */
    data: ResponsePayload;
  }
}
