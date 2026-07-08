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
    label: 'Params',
    key: 'params',
    type: 'jsonString',
    codeEditorBindAttrs: {
      // 只读模式
      options: {
        onEditable: () => false,
      },
    },
  },
  {
    label: 'Response',
    key: 'response',
    type: 'jsonString',
    codeEditorBindAttrs: {
      // 只读模式
      options: {
        onEditable: () => false,
      },
    },
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
