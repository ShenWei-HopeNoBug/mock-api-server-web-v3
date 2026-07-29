import type { DetailDialogType } from './type';
import { CSSProperties } from 'vue';

const columns: DetailDialogType.ColumnItem[] = [
  {
    label: 'ID',
    key: 'id',
    type: 'text',
  },
  {
    label: 'Url',
    key: 'url',
    type: 'text',
  },
  {
    label: 'Method',
    key: 'method',
    type: 'text',
  },
  {
    label: '响应延时(ms)',
    key: 'timeout',
    type: 'text',
  },
  {
    label: 'Params',
    key: 'params',
    type: 'jsonString',
    readonly: true,
  },
  {
    label: 'Response',
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
