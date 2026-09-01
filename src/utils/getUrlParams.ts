import type { CommonType } from '#/common';

// 获取 url 参数
const getUrlParams = (url: string = ''): CommonType.UrlQueryMap => {
  if (!url) {
    return {};
  }

  try {
    const list: string[] = url.split('?');
    list.shift();

    const paramStr: string = list.join('?');

    const query: CommonType.UrlQueryMap = {};
    const params = new URLSearchParams(paramStr);
    // 把所有参数放到 map 表
    for (const key of params.keys()) {
      query[key] = params.get(key);
    }

    return query;
  } catch (e) {
    console.error('@@getUrlParams error', e);
    return {};
  }
};

export default getUrlParams;
