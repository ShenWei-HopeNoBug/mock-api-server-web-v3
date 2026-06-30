type EventMap = Record<string, any[]>;

interface Subscribe<Payload extends any[] = any[]> {
  callback: (...payload: Payload) => void;
}

type SubscribeMap = Record<string, { name: string; subscribes: Subscribe<any>[] }>;

class PubSub<Events extends EventMap = EventMap> {
  private _subscribeMap: SubscribeMap = {}; // 订阅消息

  /**
   * @description 发布
   * */
  publish<K extends keyof Events>(name: K, ...payload: Events[K]): void {
    const message = this._subscribeMap[name as string];
    if (!message) {
      return;
    }

    message.subscribes.forEach(sub => {
      try {
        sub.callback(...payload);
      } catch (e) {
        console.warn(`[PubSub] subscriber error in ${String(name)}`, e);
      }
    });
  }

  /**
   * @description 订阅
   * */
  subscribe<K extends keyof Events>(name: K, callback: (...payload: Events[K]) => void): void {
    const key = name as string;
    const message = this._subscribeMap[key];
    if (message) {
      message.subscribes.push({ callback });
    } else {
      this._subscribeMap[key] = {
        name: key,
        subscribes: [{ callback }],
      };
    }
  }

  /**
   * @description 取消订阅
   * */
  unsubscribe<K extends keyof Events>(name: K, callback: (...payload: Events[K]) => void): void {
    const key = name as string;
    const message = this._subscribeMap[key];
    if (!message) {
      return;
    }

    // 清除对于应的订阅
    message.subscribes = message.subscribes.filter(o => o.callback !== callback);

    // 如果订阅事件回调全部被清除，删除该订阅
    if (message.subscribes.length === 0) {
      this.clearSubscription(name);
    }
  }

  /**
   * @description 清除制定订阅配置
   * */
  clearSubscription<K extends keyof Events>(name: K) {
    const key = name as string;
    const message = this._subscribeMap[key];
    if (!message) {
      return;
    }

    const map: SubscribeMap = {};
    Object.keys(this._subscribeMap).forEach(key => {
      if (key === (name as string)) {
        return;
      }

      map[key] = this._subscribeMap[key];
    });

    this._subscribeMap = map;
  }

  /**
   * @description 清除所有订阅配置
   * */
  clearAllSubscriptions(): void {
    this._subscribeMap = {};
  }
}

export default PubSub;
