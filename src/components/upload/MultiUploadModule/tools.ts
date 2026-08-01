import axios from 'axios';
import { generateUUID, isArrayValid, isEmptyObject, createMd5 } from '@/utils';
import type { MultiUploadModuleType } from './type';
import type { CommonType } from '#/common';

// 占位函数，后续根据需求实现上传逻辑
const uploadFile = (
  _options: MultiUploadModuleType.UploadFileData,
  _cancelTokenSource: CommonType.RequestCancelToken = null,
) => Promise.reject();

// 获取文件名信息（解析扩展名、生成唯一 key）
export const getFileNameInfo = (file: File): MultiUploadModuleType.FileNameInfo => {
  if (!file) {
    // 无文件时返回空结构
    return {
      key: '',
      name: '',
      nameKey: '',
      fileName: '',
      ext: '',
      error: true,
    };
  }

  // 拆分文件名与扩展名
  const nameList: string[] = file.name.split('.');

  // 取最后一段作为扩展名
  let ext: string = '';
  if (nameList.length > 1) {
    ext = nameList[nameList.length - 1];
    nameList.pop();
  }

  // 去除扩展名后的文件名
  const fileName: string = nameList.join('.');

  return {
    key: generateUUID(),
    name: file.name,
    nameKey: createMd5(fileName),
    fileName,
    ext,
    error: false,
  };
};

// 根据更新映射批量更新文件列表
export const updateFileData = (
  options: MultiUploadModuleType.UpdateFileDataOptions = {},
): MultiUploadModuleType.UploadFileData[] => {
  const { fileDataList = [], updateMap = {} } = options || {};

  if (isEmptyObject(updateMap) || !isArrayValid(fileDataList)) {
    // 无有效更新时直接返回原列表
    return fileDataList;
  }

  return fileDataList.map(item => {
    const { key = '' } = item;
    const updateData = updateMap[key];
    if (updateData) {
      // 命中更新项则合并
      return { ...item, ...updateData };
    }
    return item;
  });
};

// 顺序串行执行 Promise 函数列表，最后回调
export const linkExePromiseFnList = (
  promiseFnList: Array<() => Promise<unknown>> = [],
  callback: (() => void) | null = null,
) => {
  if (!isArrayValid(promiseFnList)) {
    return;
  }

  let exePromise: Promise<unknown> | undefined;
  promiseFnList.forEach((fn, i) => {
    if (!exePromise) {
      // 首次执行
      exePromise = fn();
    } else {
      // 依赖上一次完成后继续
      exePromise = exePromise.then(() => fn());
    }

    if (i === promiseFnList.length - 1) {
      // 最后一个完成后触发回调
      exePromise.then(() => {
        if (typeof callback === 'function') {
          callback();
        }
      });
    }
  });
};

// 将新选择的文件插入到上传列表末尾
export const insertUploadFileList = (
  fileList: File[] = [],
  fileDataList: MultiUploadModuleType.UploadFileData[] = [],
): MultiUploadModuleType.UploadFileData[] => {
  const insertList: MultiUploadModuleType.UploadFileData[] = fileList.map(file => {
    // 为每个文件生成基础上传数据
    const { key, name, ext } = getFileNameInfo(file);
    return {
      key,
      file,
      ext,
      // 使用本地预览 URL
      url: URL.createObjectURL(file),
      fileName: name,
      uploadStatus: 'READY',
      cancelTokenSource: null,
    };
  });

  return [...fileDataList, ...insertList];
};

// 基于 Promise.allSettled 结果生成状态更新映射
export const getUploadStatusUpdateMap = (
  allSettledList: PromiseSettledResult<string>[] = [],
  splitList: MultiUploadModuleType.UploadFileData[] = [],
): MultiUploadModuleType.UpdateMap => {
  const updateMap: MultiUploadModuleType.UpdateMap = {};

  allSettledList.forEach((item, i) => {
    const data = splitList[i];
    const key = data?.key || '';
    if (item.status === 'fulfilled' && item.value) {
      // 成功时更新 URL 与状态
      updateMap[key] = {
        url: item.value,
        uploadStatus: 'SUCCESS',
        cancelTokenSource: null,
      };
    } else {
      // 失败时仅更新状态
      updateMap[key] = {
        uploadStatus: 'FAILURE',
        cancelTokenSource: null,
      };
    }
  });

  return updateMap;
};

// 生成上传 Promise 列表与对应的状态更新映射
export const getUploadPromiseData = (
  config: MultiUploadModuleType.GetUploadPromiseDataConfig = {},
): MultiUploadModuleType.UploadPromiseData => {
  const { splitList = [], uploadApi } = config;

  const updateDataMap: Record<string, Partial<MultiUploadModuleType.UploadFileData>> = {};
  const promiseList: Promise<string>[] = splitList.map(options => {
    const { file, key = '' } = options;

    // 为每个文件创建取消令牌并标记上传中
    const cancelTokenSource = axios.CancelToken.source();
    updateDataMap[key] = { uploadStatus: 'DOING', cancelTokenSource };

    if (typeof uploadApi === 'function') {
      // 使用自定义上传方法
      return uploadApi(options, cancelTokenSource);
    }

    // 使用默认上传接口
    return uploadFile({ file: file as File }, cancelTokenSource);
  });

  return {
    promiseList,
    updateDataMap,
  };
};

// 将文件列表按批次拆分
export const splitFileDataList = (
  fileDataList: MultiUploadModuleType.UploadFileData[] = [],
  splitNum = Number('5'),
): MultiUploadModuleType.UploadFileData[][] => {
  if (!isArrayValid(fileDataList)) {
    return [];
  }

  const list: MultiUploadModuleType.UploadFileData[][] = [];
  let start: number = 0;
  let end: number = start + splitNum;
  while (start < fileDataList.length) {
    // 按 splitNum 分段切片
    list.push(fileDataList.slice(start, end));
    start += splitNum;
    end = end + splitNum;
  }

  return list;
};

// 取消所有上传中的请求
export const abortAllUploadRequest = (
  fileDataList: MultiUploadModuleType.UploadFileData[] = [],
) => {
  fileDataList.forEach(item => {
    const { cancelTokenSource } = item;
    // 触发取消令牌
    cancelTokenSource?.cancel?.();
  });
};
