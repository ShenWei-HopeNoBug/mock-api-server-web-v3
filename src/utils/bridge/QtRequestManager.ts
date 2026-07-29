import QtBridge from '@/utils/bridge/QtBridge';
import InterceptorManager from '@/utils/bridge/InterceptorManager';
import type { QtRequestManagerType } from './type';
import { generateUUID } from '@/utils';
import { isPlainObject } from 'lodash-es';

/**
 * QtBridge 请求错误。
 * 运行时 Error 类，对应 QtRequestManagerType.QtRequestError 接口。
 */
class QtRequestError extends Error implements QtRequestManagerType.QtRequestError {
  code: QtRequestManagerType.QtRequestErrorCode;
  reqName?: string;
  config?: QtRequestManagerType.RequestConfig;

  constructor(options: QtRequestManagerType.QtRequestErrorOptions) {
    super(options.message);
    this.name = 'QtRequestError';
    this.code = options.code;
    this.reqName = options.reqName;
    this.config = options.config;
  }
}

/**
 * Promise 化的 QtBridge 请求/响应管理器。
 *
 * 职责：管理 pending Promise + action_id 映射、超时、取消。
 * QtBridge 本身保持纯传输层不变。
 */
class QtRequestManager {
  /** QtBridge 实例 */
  private bridge: QtBridge;
  /** pending 请求映射（action_id -> PendingRequest） */
  private pendingMap: Map<string, QtRequestManagerType.PendingRequest> = new Map();
  /** 默认超时时间（ms） */
  private defaultTimeout: number = 0;
  /** 是否已销毁 */
  private destroyed: boolean = false;
  /** receive 订阅回调引用（确保 subscribe/unsubscribe 同一引用） */
  private readonly onReceiveHandler: (messageStr: string) => void;
  /** bridge BEFORE_DESTROY 事件回调引用 */
  private readonly onBridgeBeforeDestroyHandler: () => void;
  /** 响应拦截器管理器 */
  readonly interceptors: {
    response: InterceptorManager<QtRequestManagerType.QtResponse>;
  };

  constructor(bridge: QtBridge, options: QtRequestManagerType.ConstructorOptions = {}) {
    this.bridge = bridge;
    if (options?.timeout !== undefined) {
      this.defaultTimeout = this.resolveTimeout(options.timeout);
    }
    this.interceptors = {
      response: new InterceptorManager<QtRequestManagerType.QtResponse>(),
    };
    this.onReceiveHandler = this.handleRawReceive.bind(this);
    this.onBridgeBeforeDestroyHandler = this.handleBridgeBeforeDestroy.bind(this);
    this.bridge.subscribe(QtBridge.EVENT.RECEIVE, this.onReceiveHandler);
    this.bridge.subscribe(QtBridge.EVENT.BEFORE_DESTROY, this.onBridgeBeforeDestroyHandler);
  }

  /**
   * 将 Promise 链依次通过响应拦截器后结算 pending 请求。
   * @param pending 待结算的请求
   * @param factory 返回拦截器链入口 Promise 的工厂函数
   */
  private runInterceptorChain(
    pending: QtRequestManagerType.PendingRequest,
    factory: () => Promise<any>,
  ): void {
    let chain: Promise<any> = factory();
    this.interceptors.response.forEach(handler => {
      chain = chain.then(handler.onFulfilled, handler.onRejected);
    });
    chain.then(pending.resolve, pending.reject);
  }

  /**
   * 统一处理 timeout 值：非有限数字或负数回退到 defaultTimeout，否则保证 >= 0。
   * @param timeout 待处理的 timeout 值
   * @returns 归一化后的 timeout（ms），0 表示无超时
   */
  private resolveTimeout(timeout: number | undefined): number {
    if (timeout === undefined || !Number.isFinite(timeout) || timeout < 0) {
      return this.defaultTimeout;
    }
    return Math.max(0, timeout);
  }

  /**
   * 结算 pending 请求：标记已结算、清理超时定时器、从 pendingMap 移除。
   * @param pending 待结算的请求
   * @param actionId 请求 action_id
   */
  private settlePending(pending: QtRequestManagerType.PendingRequest, actionId: string): void {
    pending.settled = true;
    if (pending.timerId !== null) {
      clearTimeout(pending.timerId);
      pending.timerId = null;
    }
    this.pendingMap.delete(actionId);
  }

  /**
   * 发起一个请求，返回 Promise。
   * @param config 请求配置
   * @returns 响应载荷 Promise
   */
  request<T = any>(config: QtRequestManagerType.RequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.destroyed) {
        reject(new QtRequestError({ code: 'DESTROYED', message: 'QtRequestManager 已销毁' }));
        return;
      }

      if (!this.bridge.isRegister()) {
        reject(new QtRequestError({ code: 'BRIDGE_NOT_READY', message: 'QtBridge 未注册' }));
        return;
      }

      const { name, params = {}, data = {}, timeout } = config;
      const actionId: string = generateUUID();
      const timeoutMs: number = this.resolveTimeout(timeout);

      const pending: QtRequestManagerType.PendingRequest = {
        actionId,
        name,
        config,
        resolve,
        reject,
        timerId: null,
        settled: false,
      };

      this.pendingMap.set(actionId, pending);

      // 超时定时器
      if (timeoutMs > 0) {
        pending.timerId = window.setTimeout(() => {
          if (pending.settled) {
            return;
          }

          this.settlePending(pending, actionId);
          this.runInterceptorChain(pending, () =>
            Promise.reject(
              new QtRequestError({
                code: 'TIMEOUT',
                message: `请求 ${name} 超时 (${timeoutMs}ms)`,
                reqName: name,
                config,
              }),
            ),
          );
        }, timeoutMs);
      }

      /** 发送（明确构建消息体，避免不可预测的展开） */
      try {
        const sendResult = this.bridge.sendObjMsg({
          type: 'request',
          name,
          action_id: actionId,
          params,
          data,
        });
        if (!sendResult.success) {
          this.settlePending(pending, actionId);
          this.runInterceptorChain(pending, () =>
            Promise.reject(
              new QtRequestError({
                code: 'SEND_FAILED',
                message: `请求 ${name} 发送失败: bridge 不可用`,
                reqName: name,
                config,
              }),
            ),
          );
        }
      } catch (e) {
        this.settlePending(pending, actionId);
        this.runInterceptorChain(pending, () =>
          Promise.reject(
            new QtRequestError({
              code: 'SEND_FAILED',
              message: `请求 ${name} 发送失败: ${String(e)}`,
              reqName: name,
              config,
            }),
          ),
        );
      }
    });
  }

  /**
   * 发起请求（axios 风格签名），内部调用 request。
   * @param name 请求名称（协议标识）
   * @param params 请求参数，对应消息体的 params 字段
   * @param config 额外配置（timeout / noMessage）
   * @returns 响应载荷 Promise
   */
  fetch<T = any, P extends Record<string, any> = Record<string, any>>(
    name: string,
    params?: P,
    config?: QtRequestManagerType.FetchConfig,
  ): Promise<T> {
    return this.request<T>({
      name,
      params,
      ...config,
    });
  }

  /**
   * 统一销毁流程：清理所有 pending 请求、解绑订阅、标记销毁。
   * @param errorCode 拒绝 pending 请求时使用的错误码
   * @param errorMessage 拒绝 pending 请求时使用的错误消息
   */
  private performDestroy(
    errorCode: QtRequestManagerType.QtRequestErrorCode,
    errorMessage: string,
  ): void {
    this.destroyed = true;
    this.pendingMap.forEach((pending, actionId) => {
      if (pending.settled) {
        return;
      }

      this.settlePending(pending, actionId);
      this.runInterceptorChain(pending, () =>
        Promise.reject(
          new QtRequestError({
            code: errorCode,
            message: errorMessage,
            reqName: pending.name,
            config: pending.config,
          }),
        ),
      );
    });
    this.pendingMap.clear();
    this.bridge.unsubscribe(QtBridge.EVENT.RECEIVE, this.onReceiveHandler);
    this.bridge.unsubscribe(QtBridge.EVENT.BEFORE_DESTROY, this.onBridgeBeforeDestroyHandler);
  }

  /**
   * 销毁：取消所有 pending 请求，解绑订阅。
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.performDestroy('DESTROYED', 'QtRequestManager 已销毁');
  }

  /**
   * bridge BEFORE_DESTROY 事件处理：清理所有 pending 请求，防止 Promise 永久挂起。
   */
  private handleBridgeBeforeDestroy(): void {
    if (this.destroyed) {
      return;
    }

    this.performDestroy('BRIDGE_DESTROYED', 'QtBridge 已销毁');
  }

  /**
   * 解析 Qt 下发的 JSON 字符串。
   *
   * 解析成功时返回 { success: true, response, data }；
   * 解析失败时遍历 pendingMap，通过原始消息字符串模糊匹配 action_id，
   * 将匹配到的 pending 请求以 PARSE_ERROR 拒绝，并返回 { success: false, response, data: null }。
   *
   * @param messageStr Qt 下发的 JSON 字符串
   * @returns 解析结果对象（ParseMessageResult）
   */
  private parseMessage(messageStr: string): QtRequestManagerType.ParseMessageResult {
    const errorRes: QtRequestManagerType.ParseMessageResult = {
      success: false,
      response: messageStr,
      data: null,
    };

    /** 入口类型守卫：非 string 类型直接返回失败，避免 catch 分支二次报错 */
    if (typeof messageStr !== 'string') {
      console.error('[QtRequestManager] messageStr 非字符串类型:', typeof messageStr);
      return errorRes;
    }

    try {
      const data = JSON.parse(messageStr) as QtRequestManagerType.ResponsePayload;
      if (!isPlainObject(data)) {
        throw new Error('JSON.parse 结果非 plain object');
      }
      return { success: true, response: messageStr, data };
    } catch (e) {
      console.error('[QtRequestManager] JSON.parse 异常:', e, '原始消息:', messageStr);

      /**
       * 解析失败时无法从消息体中提取 action_id，
       * 只能通过正则精确匹配 "action_id":"<value>" 字段对来定位 pending 请求，
       * 避免裸 includes 子串匹配导致的误伤。
       */
      for (const [actionId, pending] of this.pendingMap) {
        const actionIdRegex = new RegExp(`"action_id"\\s*:\\s*"${actionId}"`);
        if (pending.settled || !actionIdRegex.test(messageStr)) {
          continue;
        }

        this.settlePending(pending, actionId);
        this.runInterceptorChain(pending, () =>
          Promise.reject(
            new QtRequestError({
              code: 'PARSE_ERROR',
              message: `请求 ${pending.name} 响应解析失败`,
              reqName: pending.name,
              config: pending.config,
            }),
          ),
        );
        break;
      }
      return errorRes;
    }
  }

  /**
   * 处理 Qt 下发的原始消息，匹配 pending 请求并 resolve。
   * @param messageStr Qt 下发的 JSON 字符串
   */
  private handleRawReceive(messageStr: string): void {
    if (this.destroyed) {
      return;
    }

    const { success, response, data: eventData } = this.parseMessage(messageStr);
    if (!success || !eventData || !isPlainObject(eventData)) {
      return;
    }

    let pending: QtRequestManagerType.PendingRequest | undefined;

    try {
      const { type = '', action_id = '' } = eventData;
      if (type !== 'response') {
        return;
      }

      pending = this.pendingMap.get(action_id);
      if (!pending) {
        return;
      }

      if (pending.settled) {
        return;
      }
      this.settlePending(pending, action_id);

      /** 响应错误检查：Qt 协议中 status_code !== 0 表示操作失败 */
      if (eventData.status_code !== 0) {
        const errMsg = eventData.status_msg || `请求 ${pending.name} 响应失败`;
        this.runInterceptorChain(pending, () =>
          Promise.reject(
            new QtRequestError({
              code: 'RESPONSE_ERROR',
              message: errMsg,
              reqName: pending?.name,
              config: pending?.config,
            }),
          ),
        );
        return;
      }

      const qtResponse: QtRequestManagerType.QtResponse = {
        config: pending.config,
        data: eventData,
      };
      this.runInterceptorChain(pending, () => Promise.resolve(qtResponse));
    } catch (e) {
      console.error('[QtRequestManager] handleRawReceive 异常:', e, '原始消息:', response);

      if (!pending) {
        return;
      }

      this.settlePending(pending, pending.actionId);
      this.runInterceptorChain(pending, () =>
        Promise.reject(
          new QtRequestError({
            code: 'RESPONSE_HANDLE_ERROR',
            message: `请求 ${pending?.name} 响应处理异常: ${String(e)}`,
            reqName: pending?.name,
            config: pending?.config,
          }),
        ),
      );
    }
  }
}

export { QtRequestError };
export default QtRequestManager;
