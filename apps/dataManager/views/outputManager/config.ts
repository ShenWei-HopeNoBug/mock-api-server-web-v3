import type { Form as FormType } from '@/components/form/types';
import { getRangePickerRanges } from '@/components/form/tools';
import type { OutputManagerType } from './type';
import { cloneDeep } from 'lodash-es';
import dayjs from 'dayjs';

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
  {
    label: '创建时间',
    key: 'create_time_range',
    inputType: 'rangePicker',
    inputProps: {
      ranges: getRangePickerRanges(),
    },
  },
];

const processBeforeSearchFormSubmit = (form: Record<string, any> = {}): Record<string, any> => {
  const formCp = cloneDeep(form);
  const submitForm: Record<string, any> = {};
  Object.keys(formCp).forEach(key => {
    const value = formCp[key];
    if (key !== 'create_time_range') {
      submitForm[key] = value;
      return;
    }

    if (!Array.isArray(value)) {
      return;
    }

    const [startTime, endTime] = value;
    if (!startTime || !endTime) {
      return;
    }

    submitForm['create_start_time'] = dayjs(startTime).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    submitForm['create_end_time'] = dayjs(endTime).endOf('day').format('YYYY-MM-DD HH:mm:ss');
  });
  return submitForm;
};

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
    width: 240,
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
    width: 240,
  },
  {
    title: '响应延时(ms)',
    dataIndex: 'timeout',
    key: 'timeout',
    width: 120,
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
    width: 300,
    fixed: 'right',
  },
];

export {
  defaultTableHeight,
  tableHeightOffset,
  tableMinHeight,
  initPagination,
  initSearchForm,
  searchFormColumns,
  processBeforeSearchFormSubmit,
  tableColumns,
};
