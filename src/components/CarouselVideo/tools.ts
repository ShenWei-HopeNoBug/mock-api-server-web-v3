import { createMd5 } from '@/utils';
import type { CarouselVideoType } from './type';
import BaseNormalize from '@/utils/BaseNormalize';

/**
 * 把原始视频配置数组转换成 CarouselVideo 列表，过滤无 video_url 的项。
 */
const buildCarouselVideos = (
  rawVideos: CarouselVideoType.RawVideoItem[] = [],
): CarouselVideoType.VideoItem[] => {
  if (!Array.isArray(rawVideos)) {
    return [];
  }

  const videos: CarouselVideoType.VideoItem[] = [];

  rawVideos.forEach((v, i) => {
    const video_url: string = BaseNormalize.normalizeString(v?.video_url);
    const poster_url: string = BaseNormalize.normalizeString(v?.poster_url);

    if (!video_url) {
      return;
    }

    videos.push({
      key: createMd5(`${i}-${video_url}`),
      video_url,
      poster_url,
    });
  });

  return videos;
};

export { buildCarouselVideos };
