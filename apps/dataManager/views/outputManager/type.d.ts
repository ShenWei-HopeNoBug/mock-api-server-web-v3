export declare namespace OutputManagerType {
  type ActionName =
    | 'get_mock_data'
    | 'fix_mock_data'
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
    [key: string]: any;
  }

  interface TableColumn {
    title: string;
    dataIndex?: string;
    key: string;
    width?: number;
    fixed?: 'left' | 'right';
  }

  interface RequestEvent {
    type?: string;
    name?: ActionName;
    data?: Record<string, any> | boolean;
    action_id?: string;
    extra?: Record<string, any>;
  }
}
