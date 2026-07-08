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
    receive: [string];
  }
}
