import type { DataManagerType } from '#/qt/dataManager';

export declare namespace VariantEditorDialogType {
  interface ShowOptions {
    apiDataId?: string;
    apiDataUrl?: string;
  }

  type VariantRecord = DataManagerType.ApiResponseVariant;
}
