import type { OutputManagerType } from '@apps/dataManager/views/outputManager/type';
import type { DataManagerType } from '#/qt/dataManager';

export declare namespace UserApiEditorDialogType {
  interface ShowOptions {
    isEdit?: boolean;
    formData?: OutputManagerType.RowRecord;
    recordType?: DataManagerType.ApiType;
  }

  interface SubmitPayload {
    form: OutputManagerType.RowRecord;
    isEdit: boolean;
  }
}
