import type { Form as FormType } from '@/components/form/types';
import type { OutputManagerType } from './type';

/** 表格默认可视高度（px） */
const defaultTableHeight = 550;
/** 表格高度计算偏移量（px） */
const tableHeightOffset = 140;
/** 表格最小高度（px） */
const tableMinHeight = 200;

/** 分页初始配置 */
const initPagination = {
  currentPage: 1,
  pageSize: 10,
  pageSizes: ['10', '20', '50', '100'],
};

/** 请求 action_id 初始映射（用于响应匹配） */
const initActionIdMap: Record<OutputManagerType.ActionName, string> = {
  get_mock_data: '',
  fix_mock_data: '',
  edit_mock_data: '',
  add_mock_data: '',
  delete_mock_data: '',
  copy_mock_data: '',
};

/** 搜索表单初始值 */
const initSearchForm: OutputManagerType.SearchForm = {
  type: 'USER',
};

/** 搜索表单项配置 */
const searchFormColumns: FormType.FormItemOptions[] = [
  {
    label: '数据来源',
    key: 'type',
    inputType: 'select',
    options: [
      { label: 'MITMPROXY', value: 'MITMPROXY' },
      { label: 'USER', value: 'USER' },
    ],
  },
  {
    label: '请求Url',
    key: 'url',
    inputType: 'input',
  },
  {
    label: '请求类型',
    key: 'method',
    inputType: 'select',
    options: [
      { label: 'GET', value: 'GET' },
      { label: 'POST', value: 'POST' },
    ],
  },
  {
    label: '请求参数',
    key: 'params',
    inputType: 'input',
  },
  {
    label: '响应数据',
    key: 'response',
    inputType: 'input',
  },
];

/** 列表表格列配置 */
const tableColumns: OutputManagerType.TableColumn[] = [
  {
    title: '序号',
    key: 'index',
    width: 70,
  },
  {
    title: '数据来源',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: '请求Url',
    dataIndex: 'url',
    key: 'url',
  },
  {
    title: '请求类型',
    dataIndex: 'method',
    key: 'method',
    width: 100,
  },
  {
    title: '请求参数',
    dataIndex: 'params',
    key: 'params',
  },
  {
    title: '操作',
    key: 'operation',
    width: 300,
    fixed: 'right',
  },
];

export {
  defaultTableHeight,
  tableHeightOffset,
  tableMinHeight,
  initPagination,
  initActionIdMap,
  initSearchForm,
  searchFormColumns,
  tableColumns,
};
