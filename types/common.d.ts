import { CancelTokenSource } from 'axios';

export declare namespace CommonType {
  interface EnumItem {
    label?: string;
    value?: any;
  }

  type RequestCancelToken = CancelTokenSource | null;

  // 表格展示数据 formatter 入参
  interface TableFormatterOptions {
    text?: string;
    record?: Common.CommonMap;
  }
}
