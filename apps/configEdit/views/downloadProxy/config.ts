import type { DownloadProxyType } from '#/qt/downloadProxy';

export const protocolOptions: Array<{ label: string; value: DownloadProxyType.Protocol }> = [
  { label: 'http', value: 'http' },
  { label: 'https', value: 'https' },
];

export const defaultDownloadProxy: DownloadProxyType.NormalizedProxyConfig = {
  protocol: 'https',
  proxy: '',
  includes: [],
};
