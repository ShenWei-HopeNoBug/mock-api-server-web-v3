import { CancelTokenSource } from 'axios';

export declare namespace CommonType {
  interface EnumItem {
    label?: string;
    value?: string;
  }

  type RequestCancelToken = CancelTokenSource | null;
}
