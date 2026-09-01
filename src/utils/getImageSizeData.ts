import getUrlParams from '@/utils/getUrlParams';

export interface ImageSizeData {
  width: number;
  height: number;
  ratio: number;
  url: string;
  error: boolean;
}

interface Options {
  defaultWidth?: number; // 报错时默认返回宽度
  defaultHeight?: number; // 报错时默认返回高度
  timeoutMs?: number; // 超时兜底时长（ms）
}

const isValidSize = (size: number): boolean => {
  return Number.isFinite(size) && size > 0;
};

/**
 * @description 获取图片尺寸数据
 * */
const getImageSizeData = (imageUrl: string = '', options: Options = {}): Promise<ImageSizeData> =>
  new Promise(resolve => {
    const { defaultWidth = 0, defaultHeight = 0, timeoutMs = 60 * 1000 } = options || {};
    const defaultRadio = defaultHeight > 0 ? defaultWidth / defaultHeight : 0;
    const errorRes = {
      width: defaultWidth,
      height: defaultHeight,
      ratio: defaultRadio,
      url: imageUrl,
      error: true,
    };

    if (!imageUrl.trim()) {
      resolve(errorRes);
      return;
    }

    const urlParams = getUrlParams(imageUrl);
    const w = Number(urlParams['w']);
    const h = Number(urlParams['h']);

    // 链接上直接有图片尺寸参数，直接返回
    if (isValidSize(w) && isValidSize(h)) {
      return resolve({
        width: w,
        height: h,
        ratio: w / h,
        url: imageUrl,
        error: false,
      });
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';

    let isSettled: boolean = false;
    let timeoutTimer: number | null = null;

    const cleanup = () => {
      image.onload = null;
      image.onerror = null;

      if (timeoutTimer !== null) {
        window.clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }

      image.src = '';
    };

    const finalize = (res: ImageSizeData) => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      cleanup();
      resolve(res);
    };

    const safeTimeoutMs = Number.isFinite(timeoutMs) ? Math.max(timeoutMs, 0) : 60 * 1000;

    // 加载图片返回参数
    image.onload = () => {
      const { width, height } = image;

      if (!isValidSize(width) || !isValidSize(height)) {
        finalize(errorRes);
        return;
      }

      const ratio = width / height;
      finalize({ width, height, ratio, url: imageUrl, error: false });
    };

    image.onerror = () => {
      finalize(errorRes);
    };

    timeoutTimer = window.setTimeout(() => {
      finalize(errorRes);
    }, safeTimeoutMs);

    image.src = imageUrl;
  });

export default getImageSizeData;
