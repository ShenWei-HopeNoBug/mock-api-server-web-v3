import type { DataManagerType } from '#/qt/dataManager';

export declare namespace DetailDialogType {
  type FieldType = 'text' | 'jsonString';

  interface ColumnItem {
    label: string;
    key: string;
    type: FieldType;
    readonly?: boolean;
  }

  interface DataSource extends DataManagerType.ApiDataDetail {
    [key: string]: any;
  }
}
