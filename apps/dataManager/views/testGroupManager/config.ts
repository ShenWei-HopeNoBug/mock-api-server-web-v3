import type { TestGroupManagerType } from './type';

/** 表格默认可视高度（px） */
const defaultTableHeight = 550;
/** 表格高度计算偏移量（px） */
const tableHeightOffset = 140;
/** 表格最小高度（px） */
const tableMinHeight = 200;

/** 组列表表格列配置 */
const groupTableColumns: TestGroupManagerType.TableColumn[] = [
  {
    title: '序号',
    key: 'index',
    width: 70,
  },
  {
    title: '组名称',
    dataIndex: 'name',
    key: 'name',
    width: 260,
  },
  {
    title: '接口条目数',
    dataIndex: 'item_count',
    key: 'item_count',
    width: 120,
  },
  {
    title: '启用状态',
    dataIndex: 'enabled',
    key: 'enabled',
    width: 120,
  },
  {
    title: '操作人',
    dataIndex: 'operator',
    key: 'operator',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    key: 'updated_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'operation',
    width: 260,
    fixed: 'right',
  },
];

/** 组内条目表格列配置（与 outputManager 对齐） */
const itemTableColumns: TestGroupManagerType.TableColumn[] = [
  {
    title: '序号',
    key: 'index',
    width: 70,
  },
  {
    title: '请求Url',
    dataIndex: 'url',
    key: 'url',
    width: 280,
  },
  {
    title: '请求类型',
    dataIndex: 'method',
    key: 'method',
    width: 100,
  },
  {
    title: 'Content-Type',
    dataIndex: 'request_content_type',
    key: 'request_content_type',
    width: 220,
  },
  {
    title: '请求参数',
    dataIndex: 'params',
    key: 'params',
    width: 240,
  },
  {
    title: '响应延时(ms)',
    dataIndex: 'timeout',
    key: 'timeout',
    width: 120,
  },
  {
    title: '启用状态',
    dataIndex: 'enabled',
    key: 'enabled',
    width: 100,
  },
  {
    title: '操作',
    key: 'operation',
    width: 260,
    fixed: 'right',
  },
];

export {
  defaultTableHeight,
  tableHeightOffset,
  tableMinHeight,
  groupTableColumns,
  itemTableColumns,
};
