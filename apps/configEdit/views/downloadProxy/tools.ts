import { cloneDeep, isPlainObject } from 'lodash-es';
import type { DownloadProxyType } from '#/qt/downloadProxy';
import { protocolOptions } from './config';

export const isDownloadProxyValid = (
  proxyConfig: unknown,
): proxyConfig is DownloadProxyType.ProxyConfig => {
  if (!isPlainObject(proxyConfig)) {
    return false;
  }

  const { protocol, proxy, includes } = proxyConfig as Record<string, unknown>;
  const protocolValid = protocolOptions.some(item => item.value === protocol);
  const proxyValid = typeof proxy === 'string' && Boolean(proxy.trim());
  return protocolValid && proxyValid && Array.isArray(includes);
};

export const isDownloadProxyListValid = (
  proxyList: unknown,
): proxyList is DownloadProxyType.ProxyConfig[] =>
  Array.isArray(proxyList) && proxyList.every(isDownloadProxyValid);

export const processDownloadProxyList = (
  proxyList: DownloadProxyType.ProxyConfig[],
): DownloadProxyType.NormalizedProxyConfig[] => {
  const list: DownloadProxyType.NormalizedProxyConfig[] = [];

  proxyList.forEach(item => {
    if (!isDownloadProxyValid(item)) {
      return;
    }

    const config = cloneDeep(item);
    const includes = Array.isArray(config.includes) ? config.includes : [];
    list.push({
      protocol: config.protocol as DownloadProxyType.Protocol,
      proxy: (config.proxy as string).trim(),
      includes: [...new Set(includes)].filter(
        (value): value is string => typeof value === 'string' && Boolean(value.trim()),
      ),
    });
  });

  return list;
};
