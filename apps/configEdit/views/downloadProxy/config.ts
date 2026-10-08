import type { DownloadProxyType } from '#/qt/downloadProxy';

export const protocolOptions: Array<{ label: string; value: DownloadProxyType.Protocol }> = [
  { label: 'http', value: 'http' },
  { label: 'https', value: 'https' },
];

/** 新增代理时的默认配置 */
export const getDefaultDownloadProxy = (): DownloadProxyType.ProxyConfig => ({
  protocol: 'https',
  proxy: undefined,
  includes: [],
});
