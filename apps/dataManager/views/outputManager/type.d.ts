import type { DataManagerType } from '#/qt/dataManager';

export declare namespace OutputManagerType {
  interface SearchForm {
    type?: DataManagerType.ApiType;
    url?: string;
    method?: DataManagerType.ApiMethod;
    request_content_type?: DataManagerType.RequestContentType;
    params?: string;
    response?: string;
    create_start_time?: string;
    create_end_time?: string;
    operator?: string;
  }

  type RowRecord = DataManagerType.ApiData;

  interface TableColumn {
    title: string;
    dataIndex?: string;
    key: string;
    width?: number;
    fixed?: 'left' | 'right';
    formatter?: (options: CommonType.TableFormatterOptions) => string;
  }
}
