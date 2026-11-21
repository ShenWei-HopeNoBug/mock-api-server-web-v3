import type { DataManagerType } from '#/qt/dataManager';

export declare namespace UserApiEditorDialogType {
  interface ShowOptions {
    isEdit?: boolean;
    formData?: DataManagerType.ApiData;
    recordType?: DataManagerType.ApiType;
  }

  interface SubmitPayload {
    form: DataManagerType.ApiData;
    isEdit: boolean;
  }
}
