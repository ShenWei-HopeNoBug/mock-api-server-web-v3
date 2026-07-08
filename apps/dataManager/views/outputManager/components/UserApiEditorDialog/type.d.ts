import type { OutputManagerType } from '@apps/dataManager/views/outputManager/type';

export declare namespace UserApiEditorDialogType {
  interface ShowOptions {
    isEdit?: boolean;
    formData?: OutputManagerType.RowRecord;
  }

  interface SubmitPayload {
    form: OutputManagerType.RowRecord;
    isEdit: boolean;
  }

  type FormColumns = FormType.FormItemOptions[];
}
