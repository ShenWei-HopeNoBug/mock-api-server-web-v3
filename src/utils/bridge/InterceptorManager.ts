import type { InterceptorManagerType } from './type';

/**
 * 通用拦截器管理器（仿 axios AxiosInterceptorManager）。
 * use 返回 id，eject 按 id 注销（置 null 保持索引稳定）。
 */
class InterceptorManager<V> {
  /** 拦截器队列（eject 置 null 保持索引稳定） */
  private handlers: (InterceptorManagerType.InterceptorHandler<V> | null)[] = [];

  /** 注册拦截器，返回 id 用于 eject */
  use(
    onFulfilled?: InterceptorManagerType.OnFulfilled<V>,
    onRejected?: InterceptorManagerType.OnRejected,
  ): number {
    this.handlers.push({ onFulfilled, onRejected });
    return this.handlers.length - 1;
  }

  /** 按 id 注销拦截器 */
  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /** 遍历有效拦截器 */
  forEach(fn: (handler: InterceptorManagerType.InterceptorHandler<V>) => void): void {
    this.handlers.forEach(h => {
      if (h !== null) {
        fn(h);
      }
    });
  }

  /** 清空所有拦截器 */
  clear(): void {
    this.handlers = [];
  }
}

export default InterceptorManager;
