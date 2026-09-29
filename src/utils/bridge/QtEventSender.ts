import { generateUUID } from '@/utils';
import type { QtSdkType } from '#/qtSdk';
import type { QtEventSenderType } from './type';
import type QtBridge from './QtBridge';

export const createQtEventSender = (
  getBridge: () => QtBridge | null,
  onError: (message: string) => void,
): QtEventSenderType.SendEvent => {
  return (name, { actionId = generateUUID(), params, data, errorMessage } = {}) => {
    const message: QtSdkType.EventMessage = {
      type: 'event',
      name,
      action_id: actionId,
      ...(params !== undefined ? { params } : {}),
      ...(data !== undefined ? { data } : {}),
    };

    let success = false;
    try {
      success = getBridge()?.sendObjMsg(message).success === true;
    } catch {
      success = false;
    }

    if (!success) {
      onError(errorMessage ?? `事件发送失败：${name}`);
    }
    return { success, actionId };
  };
};
