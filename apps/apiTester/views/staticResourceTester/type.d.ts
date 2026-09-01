export declare namespace StaticResourceTesterType {
  interface VideoItem {
    key: string | number;
    video_url: string;
    poster_url: string;
  }

  interface VideoUrlItem {
    id: string;
    url: string;
  }

  interface LoadingTimeoutPayload {
    video?: VideoItem;
    duration: number;
  }
}
