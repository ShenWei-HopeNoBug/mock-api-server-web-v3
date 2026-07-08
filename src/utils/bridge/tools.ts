import { isObject } from 'lodash-es';
import type { QtBridgeType } from './type';

export const isBridgeUsable = (bridge: QtBridgeType.Bridge | null): boolean => {
  if (!isObject(bridge)) {
    return false;
  }

  const hasSend: boolean = typeof bridge.send_js2qt_msg === 'function';
  const hasReceive: boolean = typeof bridge.qt2js_signal?.connect === 'function';

  return hasSend && hasReceive;
};
