import { isNonEmptyString } from '@/utils';
import BaseNormalize from '@/utils/BaseNormalize';
import { cloneDeep, isPlainObject } from 'lodash-es';
import type { DownloadProxyType } from '#/qt/downloadProxy';
import { protocolOptions } from './config';

// 校验单条代理配置：协议合法、proxy 非空白、includes 为数组
export const isDownloadProxyValid = (proxyConfig: DownloadProxyType.ProxyConfig): boolean => {
  if (!isPlainObject(proxyConfig)) {
    return false;
  }

  const { protocol, proxy, includes } = proxyConfig;
  const protocolValid: boolean = protocolOptions.some(item => item.value === protocol);
  const proxyValid: boolean = isNonEmptyString(proxy);
  return protocolValid && proxyValid && Array.isArray(includes);
};

// 校验代理列表，全部条目有效才返回 true
export const isDownloadProxyListValid = (proxyList: DownloadProxyType.ProxyConfig[]): boolean =>
  Array.isArray(proxyList) && proxyList.every(isDownloadProxyValid);

// 过滤无效配置并归一化：includes 提取字符串项后去重、剔除空白项
export const processDownloadProxyList = (
  proxyList: DownloadProxyType.ProxyConfig[],
): DownloadProxyType.ProxyConfig[] => {
  const list: DownloadProxyType.ProxyConfig[] = [];

  proxyList.forEach(item => {
    if (!isDownloadProxyValid(item)) {
      return;
    }

    const config = cloneDeep(item);
    const includes: string[] = BaseNormalize.normalizeStringArray(config.includes);
    list.push({
      protocol: config.protocol,
      proxy: config.proxy,
      includes: [...new Set(includes)].filter(isNonEmptyString),
    });
  });

  return list;
};
