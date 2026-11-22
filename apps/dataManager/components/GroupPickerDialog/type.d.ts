export declare namespace GroupPickerDialogType {
  /** 拷入目标组选择结果（入口 A：outputManager 推入，条目默认禁用） */
  interface GroupPickerSubmitPayload {
    group_id?: string;
    copy_variants?: boolean;
  }

  /** 组选择搜索表单值（与 TestGroupManagerType.SearchForm 同构，独立定义不反向依赖视图类型） */
  interface SearchForm {
    name?: string;
    enabled?: boolean;
  }
}
