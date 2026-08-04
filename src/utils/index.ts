import MD5 from 'crypto-js/md5';
import { isPlainObject } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import { CommonType } from '#/common';

// 限制数值的范围
export const limitNumRange = (num: number, min: number, max: number) => {
  let numCp = num;
  if (numCp < min) {
    numCp = min;
  }
  if (num > max) {
    numCp = max;
  }

  return numCp;
};

export const isJsonString = (v: any): boolean => {
  try {
    if (typeof v !== 'string') {
      return false;
    }

    JSON.parse(v);
    return true;
  } catch (e) {
    return false;
  }
};

export const safeJsonParse = <T = any>(v: any, fallback: T): T => {
  try {
    if (typeof v !== 'string') {
      return fallback;
    }

    return JSON.parse(v) as T;
  } catch (e) {
    return fallback;
  }
};

// 复制文本到剪贴板
export const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

// 生成uuid
export const generateUUID = (): string => uuidv4();

export const isArrayValid = (arr: any) => Array.isArray(arr) && arr.length > 0;

// 返回 md5 加密字符
export const createMd5 = (text: string): string => {
  return MD5(text).toString();
};

export const isEmptyObject = (d: any): boolean => isPlainObject(d) && Object.keys(d).length === 0;

/**
 * @description 从 Object 数组创建映射表
 * */
export const createLabelMapFromValueEnum = (
  valueEnum: Array<Record<string, any> & CommonType.EnumItem> = [],
  options: { labelKey?: string; valueKey?: string } = {},
): Record<string, string> => {
  if (!Array.isArray(valueEnum)) {
    return {};
  }

  const { labelKey = 'label', valueKey = 'value' } = options || {};

  const map: Record<string, string> = {};
  valueEnum.forEach(item => {
    const label = item[labelKey];
    const value = item[valueKey];
    if (typeof value === 'undefined') {
      return;
    }

    map[value] = String(label);
  });

  return map;
};

/**
 * @description 根据已知键名从 map 表中取值，应用在表格数据的枚举值渲染
 * */
export const getValueFromMap = (
  key: string,
  map: Record<string, any> = {},
  defaultValue: string = '-',
): string => {
  if (!isPlainObject(map)) {
    return defaultValue;
  }

  const value = map[key];
  if (typeof value !== 'undefined') {
    return String(value);
  }

  const emptySet = new Set([null, '']);

  return typeof key === 'undefined' || emptySet.has(key) ? defaultValue : key;
};
