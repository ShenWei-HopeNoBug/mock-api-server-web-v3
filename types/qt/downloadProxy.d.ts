/**
 * downloadProxy 相关 QT 桥接协议类型
 * */
export declare namespace DownloadProxyType {
  type Protocol = 'http' | 'https';

  interface ProxyConfig {
    protocol?: Protocol;
    proxy?: string;
    includes?: string[];
  }

  interface GetDownloadProxyListRes {
    list?: ProxyConfig[];
  }

  interface UpdateDownloadProxyListParams {
    download_proxy_list: ProxyConfig[];
  }
}
