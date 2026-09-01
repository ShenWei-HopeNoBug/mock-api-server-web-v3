import { isArrayValid } from '@/utils/index';

class BaseNormalize {
  static normalizeString(str: unknown = '', defaultValue: string = ''): string {
    return typeof str === 'string' ? str : defaultValue;
  }

  static normalizeArray<T>(arr: T[] = []): T[] {
    return isArrayValid(arr) ? arr : [];
  }

  static normalizeBoolean(bool: unknown, defaultValue: boolean = false): boolean {
    return typeof bool === 'boolean' ? bool : defaultValue;
  }

  static normalizeStringArray(arr: unknown = [], defaultValue: string[] = []): string[] {
    return Array.isArray(arr)
      ? arr.filter((v): v is string => typeof v === 'string')
      : defaultValue;
  }
}

export default BaseNormalize;
