/**
 * downloadProxy 相关 QT 桥接协议类型
 * */
export declare namespace DownloadProxyType {
  /**
   * 操作结果
   * success: 操作是否成功
   * id: 操作成功时返回的记录 ID（可选）
   * */
  interface OperationResult {
    success: boolean;
    status_code: number;
    status_msg: string;
    id?: string;
  }

  type Protocol = 'http' | 'https';

  interface ProxyConfig {
    protocol?: string;
    proxy?: string;
    includes?: unknown;
  }

  interface NormalizedProxyConfig {
    protocol: Protocol;
    proxy: string;
    includes: string[];
  }

  interface GetDownloadProxyListRes {
    list?: ProxyConfig[];
  }

  interface UpdateDownloadProxyListParams {
    download_proxy_list: NormalizedProxyConfig[];
  }
}
