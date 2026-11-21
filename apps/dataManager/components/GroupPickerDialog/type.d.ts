export declare namespace GroupPickerDialogType {
  /** 拷入目标组选择结果（入口 A：outputManager 推入，条目默认禁用） */
  interface GroupPickerSubmitPayload {
    group_id?: string;
    copy_variants?: boolean;
  }
}
