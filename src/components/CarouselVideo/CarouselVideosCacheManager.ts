import hashSum from 'hash-sum';
import type { CarouselVideoType } from './type';

export class CarouselVideosCacheManager {
  /** 上次进入屏保页时的轮播视频配置快照，默认空数组 */
  private static _videos: CarouselVideoType.VideoItem[] = [];
  /** 快照的 hashSum，用于快速对比配置是否变化 */
  private static _videosHash: string = hashSum([]);
  /** 是否已通过 set 初始化过缓存 */
  private static _initialized: boolean = false;

  /**
   * 保存当前轮播视频配置快照
   * @param videos - 本次构建的 VideoItem 列表
   */
  static set(videos: CarouselVideoType.VideoItem[]): void {
    this._videos = videos;
    this._videosHash = hashSum(videos);
    this._initialized = true;
  }

  /**
   * 读取缓存的配置快照
   * @returns VideoItem[]（无缓存时返回空数组）
   */
  static get(): CarouselVideoType.VideoItem[] {
    return this._videos;
  }

  /**
   * 判断传入的视频列表与缓存是否一致
   * @param videos - 当前本次构建的 VideoItem 列表
   * @returns true 表示配置已变化
   */
  static isChanged(videos: CarouselVideoType.VideoItem[]): boolean {
    return this._videosHash !== hashSum(videos);
  }

  /** 是否已通过 set 初始化过缓存 */
  static isInitialized(): boolean {
    return this._initialized;
  }

  /** 重置为默认空数组 */
  static clear(): void {
    this._videos = [];
    this._videosHash = hashSum([]);
    this._initialized = false;
  }
}
