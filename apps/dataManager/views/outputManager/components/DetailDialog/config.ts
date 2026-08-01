import type { DetailDialogType } from './type';
import { CSSProperties } from 'vue';

const columns: DetailDialogType.ColumnItem[] = [
  {
    label: 'ID',
    key: 'id',
    type: 'text',
  },
  {
    label: '请求Url',
    key: 'url',
    type: 'text',
  },
  {
    label: '请求类型',
    key: 'method',
    type: 'text',
  },
  {
    label: 'Content-Type',
    key: 'request_content_type',
    type: 'text',
  },
  {
    label: '响应延时(ms)',
    key: 'timeout',
    type: 'text',
  },
  {
    label: '请求参数',
    key: 'params',
    type: 'jsonString',
    readonly: true,
  },
  {
    label: '响应数据',
    key: 'response',
    type: 'jsonString',
    readonly: true,
  },
];

const codeEditorStyleMap: Record<string, CSSProperties> = {
  params: {
    height: '300px',
  },
  response: {
    height: '550px',
  },
};

export { columns, codeEditorStyleMap };
