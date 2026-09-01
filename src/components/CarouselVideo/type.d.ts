export declare namespace CarouselVideoType {
  interface RawVideoItem {
    video_url?: string;
    poster_url?: string;
  }

  /** 单个视频配置项 */
  interface VideoItem {
    key: string | number;
    video_url: string;
    poster_url: string;
  }

  /** 视频事件映射 */
  interface VideoEventMap {
    [k: string]: (event: Event) => void;
  }
}

export declare namespace CarouselVideoManagerType {
  /** Manager 存储的数据结构 */
  interface SnapshotData {
    /** 当前播放视频的 key */
    key: string;
    /** 激活视频列表快照 */
    videos: CarouselVideoType.VideoItem[];
  }

  /** get 方法返回值（无数据时为 null） */
  type SnapshotResult = SnapshotData | null;

  /** set 方法的入参 */
  interface SetParams {
    /** 当前播放视频的 key */
    key: string;
    /** 激活视频列表快照（调用方负责 cloneDeep） */
    videos: CarouselVideoType.VideoItem[];
  }
}
