import type { DataManagerType } from '#/qt/dataManager';

export declare namespace TestGroupManagerType {
  /** 组列表行（含条目计数） */
  type GroupRecord = DataManagerType.TestGroupSummary;

  /** 组内接口条目行 */
  type ItemRecord = DataManagerType.ApiData;

  interface TableColumn {
    title: string;
    dataIndex?: string;
    key: string;
    width?: number;
    fixed?: 'left' | 'right';
    formatter?: (options: CommonType.TableFormatterOptions) => string;
  }

  /** 新建/重命名组表单值 */
  interface GroupForm {
    name?: string;
  }

  /** 组详情条目编辑提交载荷 */
  interface ItemEditSubmitPayload {
    form?: ItemRecord;
    isEdit?: boolean;
  }

  /** 拷入目标组选择结果（入口 A：outputManager 推入，条目默认禁用） */
  interface GroupPickerSubmitPayload {
    group_id?: string;
    copy_variants?: boolean;
  }

  /** 拉取拷入搜索表单（入口 B：组详情拉取，条目默认启用） */
  interface CopySearchForm {
    url?: string;
    method?: DataManagerType.ApiMethod;
    type?: DataManagerType.ApiType;
  }
}
