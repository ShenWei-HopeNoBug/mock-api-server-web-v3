export declare namespace QtSdkType {
  type Receive = (message: string) => void;

  type Send = (message: string) => void;

  interface QtSignal {
    connect?: (callback: Receive) => void;
    disconnect?: (callback: Receive) => void;
  }

  interface Bridge {
    qt2js_signal?: QtSignal;
    send_js2qt_msg?: Send;
  }

  interface QtChannel {
    objects?: Record<string, Bridge>;
  }

  interface Qt {
    webChannelTransport?: unknown;
  }

  type QWebChannel = new (
    transport: unknown,
    callback: (channel: QtSdkType.QtChannel) => void,
  ) => unknown;
}
