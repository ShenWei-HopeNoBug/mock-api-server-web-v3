import type { OutputManagerType } from '@apps/dataManager/views/outputManager/type';
import { JsonInputType } from '@/components/ui/input/JsonInput/type';

export declare namespace DetailDialogType {
  type FieldType = 'text' | 'jsonString';

  interface ColumnItem {
    label: string;
    key: string;
    type: FieldType;
    codeEditorBindAttrs?: JsonInputType.CodeEditorAttrs;
  }
}
