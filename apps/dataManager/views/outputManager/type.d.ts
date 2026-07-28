export declare namespace OutputManagerType {
  type ActionName =
    | 'get_mock_data_page'
    | 'edit_mock_data'
    | 'add_mock_data'
    | 'delete_mock_data'
    | 'copy_mock_data';

  // 模拟数据来源
  type MockDataType = 'USER' | 'MITMPROXY';

  interface SearchForm {
    type?: MockDataType;
    url?: string;
    method?: string;
    params?: string;
    response?: string;
    [key: string]: any;
  }

  interface RowRecord {
    id?: string;
    type?: MockDataType;
    url?: string;
    method?: string;
    params?: string;
    response?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }

  interface TableColumn {
    title: string;
    dataIndex?: string;
    key: string;
    width?: number;
    fixed?: 'left' | 'right';
  }

  interface PageResult {
    list: RowRecord[];
    page_num: number;
    page_size: number;
    total: number;
  }
}
