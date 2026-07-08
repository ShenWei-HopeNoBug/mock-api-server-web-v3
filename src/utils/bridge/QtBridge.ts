import PubSub from '@/utils/PubSub';
import type { QtBridgeType } from './type';
import { isObject } from 'lodash-es';
import { isBridgeUsable } from './tools';

class QtBridge extends PubSub<QtBridgeType.EventMap> {
  // 是否已注册
  private register: boolean = false;

  // 是否已销毁
  private destroyed: boolean = false;

  // Qt 通信桥接对象
  private bridge: QtBridgeType.Bridge | null = null;

  // 缓存接收回调，确保 connect/disconnect 使用同一引用
  private readonly onReceive = this._receive.bind(this);

  /**
   * 获取 Qt WebChannel 通信对象。
   * @returns 包含 channel、channelObj、错误状态与提示信息的结果对象
   */
  static getQtBridgeData(): Promise<QtBridgeType.GetQtBridgeDataRes> {
    // 统一错误返回结构，避免调用方分支判断字段缺失
    const errorRes: QtBridgeType.GetQtBridgeDataRes = {
      channel: null,
      channelObj: null,
      error: true,
      message: '',
    };

    let finished: boolean = false;
    let timeoutId: number | null = null;
    const timeoutMs: number = 10000;

    const clearTimer = (): void => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    return new Promise(resolve => {
      const settle = (res: QtBridgeType.GetQtBridgeDataRes): void => {
        if (finished) {
          return;
        }

        finished = true;
        clearTimer();
        resolve(res);
      };

      timeoutId = window.setTimeout(() => {
        settle({
          ...errorRes,
          message: '获取 Qt 通信对象超时',
        });
      }, timeoutMs);

      const { qt, QWebChannel } = window;

      // QWebChannel 运行时依赖缺失时直接返回错误
      if (!QWebChannel || !qt || !qt.webChannelTransport) {
        settle({
          ...errorRes,
          message: 'QWebChannel 依赖加载失败',
        });
        return;
      }

      try {
        // 初始化 QWebChannel，并从回调中提取 objects 作为桥接对象
        new QWebChannel(qt.webChannelTransport, channel => {
          const hasObjects: boolean = isObject(channel?.objects);
          let channelObj: Record<string, QtBridgeType.Bridge> | null = null;
          let hasUsableBridge: boolean = false;
          if (hasObjects) {
            channelObj = channel.objects as Record<string, QtBridgeType.Bridge>;
            hasUsableBridge = Object.values(channelObj).some(bridge => isBridgeUsable(bridge));
          }

          const error: boolean = !hasObjects || !hasUsableBridge;
          let msg: string = '';
          if (!hasObjects) {
            msg = '获取 channelObj 对象失败';
          } else if (!hasUsableBridge) {
            msg = '未找到可用的 Qt bridge 对象';
          }

          settle({
            channel,
            channelObj,
            error,
            message: msg,
          });
        });
      } catch (e) {
        settle({
          ...errorRes,
          message: String(e),
        });
      }
    });
  }

  /**
   * 创建 Qt 通信桥接实例。
   * @param props 初始化参数
   */
  constructor(props: QtBridgeType.ConstructorProps = {}) {
    super();
    const { bridge = null } = props;
    this.init(bridge);
  }

  /**
   * 获取当前桥接是否已注册。
   * @returns 是否已注册成功
   */
  isRegister(): boolean {
    return this.register;
  }

  /**
   * 获取当前实例是否已销毁。
   * @returns 是否已销毁
   */
  isDestroyed(): boolean {
    return this.destroyed;
  }

  /**
   * 初始化桥接对象并绑定接收回调。
   * @param bridge Qt 提供的桥接对象
   */
  init(bridge: QtBridgeType.Bridge | null = null): void {
    if (this.destroyed) {
      return;
    }

    if (!bridge || !isBridgeUsable(bridge)) {
      this.detachBridge();
      return;
    }

    if (this.register && this.bridge === bridge) {
      return;
    }

    if (this.register && this.bridge !== bridge) {
      this.detachBridge();
    }

    this.attachBridge(bridge);
  }

  /**
   * 释放当前桥接和订阅。
   * 仅执行资源清理，不会进入销毁态，可复用调用。
   */
  dispose(): void {
    this.detachBridge();
    this.clearAllSubscriptions();
  }

  /**
   * 销毁实例。
   * 销毁后禁止继续调用 QtBridge 自身业务实例方法（不包含继承方法）。
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.dispose();
    this.destroyed = true;
  }

  /**
   * 绑定桥接对象。
   * @param bridge Qt 提供的桥接对象
   */
  private attachBridge(bridge: QtBridgeType.Bridge): void {
    this.register = true;
    this.bridge = bridge;
    bridge.qt2js_signal?.connect?.(this.onReceive);
  }

  /**
   * 解绑并清理桥接对象。
   */
  private detachBridge(): void {
    this.bridge?.qt2js_signal?.disconnect?.(this.onReceive);
    this.register = false;
    this.bridge = null;
  }

  /**
   * 发送字符串消息给 Qt 客户端。
   * @param message 消息内容
   */
  send(message: string = ''): void {
    if (this.destroyed) {
      return;
    }

    if (!this.register) {
      return;
    }

    this.bridge?.send_js2qt_msg?.(message);
  }

  /**
   * 发送对象消息给 Qt 客户端（内部会序列化为 JSON 字符串）。
   * @param data 待发送的数据对象
   */
  sendObjMsg(data: unknown = {}): void {
    if (this.destroyed) {
      return;
    }

    const sendData = isObject(data) ? data : {};
    this.send(JSON.stringify(sendData));
  }

  /**
   * 处理 Qt 下发消息并发布 receive 事件。
   * @param message Qt 客户端消息
   */
  private _receive(message: string): void {
    if (this.destroyed) {
      return;
    }

    this.publish('receive', message);
  }
}

export default QtBridge;
