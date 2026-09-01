import hashSum from 'hash-sum';
import type { CarouselVideoType, CarouselVideoManagerType } from './type';

export class CarouselVideoManager {
  /** 离开时保存的播放数据 */
  private static _data: CarouselVideoManagerType.SnapshotData | null = null;
  /** 快照中 videos 列表的 hashSum，用于快速对比列表是否一致 */
  private static _videosHash: string | null = null;

  /**
   * 保存当前播放 key 和视频列表快照
   * @param params - 包含 key 和 videos 的对象
   */
  static set(params: CarouselVideoManagerType.SetParams): void {
    this._data = {
      key: params.key,
      videos: params.videos,
    };
    this._videosHash = hashSum(params.videos);
  }

  /**
   * 读取保存的数据
   * @returns SnapshotData 或 null（无数据时）
   */
  static get(): CarouselVideoManagerType.SnapshotResult {
    return this._data;
  }

  /**
   * 校验传入的视频列表与快照中的 videos 列表是否一致（基于 hashSum）
   * @param videos 当前 props.videos
   * @returns true 表示列表未变化，可安全恢复
   */
  static matchVideosHash(videos: CarouselVideoType.VideoItem[]): boolean {
    if (this._videosHash === null) {
      return false;
    }
    return this._videosHash === hashSum(videos);
  }

  /** 清空所有保存的数据 */
  static clear(): void {
    this._data = null;
    this._videosHash = null;
  }
}
