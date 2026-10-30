// 获取 url 参数
const getUrlParams = (url: string = ''): Record<string, string> => {
  if (!url) {
    return {};
  }

  try {
    const list = url.split('?');
    list.shift();

    const paramStr = list.join('?');

    const query: Record<string, string> = {};
    const params = new URLSearchParams(paramStr);
    // 把所有参数放到 map 表
    for (const key of params.keys()) {
      query[key] = params.get(key) || '';
    }

    return query;
  } catch (e) {
    console.error('@@getUrlParams error', e);
    return {};
  }
};

export default getUrlParams;
