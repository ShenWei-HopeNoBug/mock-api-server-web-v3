import type { CommonType } from '#/common';

export declare namespace MultiUploadModuleType {
  interface FileNameInfo {
    key: string;
    name: string;
    nameKey: string;
    fileName: string;
    ext: string;
    error: boolean;
  }

  type UploadStatus = 'READY' | 'DOING' | 'SUCCESS' | 'FAILURE';

  interface UploadConfig {
    staticDir?: string;
    stayOriginFileName?: boolean;
  }

  interface UploadFileData {
    key?: string;
    file?: File;
    ext?: string;
    url?: string;
    fileName?: string;
    uploadStatus?: UploadStatus;
    cancelTokenSource?: CommonType.RequestCancelToken;
  }

  type UploadApi = (
    options: UploadFileData,
    cancelTokenSource: CommonType.RequestCancelToken,
  ) => Promise<string>;

  type BeforeUpload = (list: UploadFileData[]) => UploadFileData[] | Promise<UploadFileData[]>;

  type AfterUpload = (list: UploadFileData[]) => UploadFileData[] | Promise<UploadFileData[]>;

  type UpdateMap = Record<string, Partial<UploadFileData>>;

  interface UpdateFileDataOptions {
    fileDataList?: UploadFileData[];
    updateMap?: UpdateMap;
  }

  interface GetUploadPromiseDataConfig {
    splitList?: UploadFileData[];
    uploadConfig?: UploadConfig;
    uploadApi?: UploadApi;
  }

  interface UploadPromiseData {
    promiseList: Promise<string>[];
    updateDataMap: UpdateMap;
  }
}
