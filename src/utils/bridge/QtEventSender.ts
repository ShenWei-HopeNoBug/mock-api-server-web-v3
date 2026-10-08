import { generateUUID, isNonEmptyString } from '@/utils';
import { isPlainObject } from 'lodash-es';
import type { QtSdkType } from '#/qtSdk';
import type { QtEventSenderType } from './type';
import type QtBridge from './QtBridge';

export const createQtEventSender = (
  getBridge: () => QtBridge | null,
  onError: (message: string) => void,
): QtEventSenderType.SendEvent => {
  return (name, options = {}) => {
    const {
      actionId: requestedActionId,
      params,
      data,
      errorMessage,
      noMessage = false,
    } = options ?? {};

    // 无效 actionId 回退为新 UUID，保证消息标识可用。
    const actionId: string =
      requestedActionId && isNonEmptyString(requestedActionId) ? requestedActionId : generateUUID();

    // 非普通对象的 params 仅省略字段，不阻止事件发送。
    const message: QtSdkType.EventMessage = {
      type: 'event',
      name,
      action_id: actionId,
      ...(isPlainObject(params) ? { params } : {}),
      ...(data !== undefined ? { data } : {}),
    };

    let success = false;
    try {
      success = getBridge()?.sendObjMsg(message).success === true;
    } catch {
      success = false;
    }

    // noMessage 只关闭失败提示，不改变发送结果。
    if (!success && !noMessage) {
      onError(errorMessage ?? `事件发送失败：${name}`);
    }
    return { success, actionId };
  };
};
