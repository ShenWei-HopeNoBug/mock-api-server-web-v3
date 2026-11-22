# GroupPickerDialog 表单化改造（后续变更）

> 关联文档：`test-group-web-plan.md`（拷入组双入口原方案）；桥协议契约见 `mock-api-server` 仓 `test-group-page-query-plan.md`（`/test_group/page`）
> 状态：已实施
> 范围：`apps/dataManager/components/GroupPickerDialog/`

## 1. 背景

拷入测试组选择弹窗原为 `a-radio-group` 全量列表（`/test_group/list`），组量增长后无筛选无分页。参照组详情 `CopyFromBaseDialog` 的「SearchForm + 表格行选择 + 内置分页」模式改造，数据源复用 `/test_group/page`（服务端分页筛选，web 侧本期落地后唯一消费方）。

## 2. 结构（复刻 CopyFromBaseDialog 骨架）

```
a-modal(width=960, destroy-on-close, confirm-loading=loading)
└─ .container（flex column，v-dom-resize 驱动表格高）
   ├─ .search-bar  → SearchForm（组名称 input + 启用状态 ENABLED_ENUM select，form-item-col=8）
   ├─ .content     → a-table（row-selection type:'radio' + 内置 paginationProps + @change + #emptyText）
   └─ .footer-bar  → 「连带复制响应变体」checkbox + 已选计数 + 启用组提示
```

与 CopyFromBaseDialog 的有意偏离：`width` 固定 `960`（5 列不需全屏）；`scroll` 只设 `{y: tableHeight}` 不设 `x`（列少，表格自适应弹窗内宽，长组名走 word-break）。

## 3. 表格列（picker 版，5 列）

| 列 | dataIndex | 宽 | 渲染 |
|---|---|---|---|
| 组名称 | `name` | 280 | `text \|\| '未命名组'` |
| 接口条目数 | `item_count` | 100 | 默认 |
| 启用状态 | `enabled` | 100 | `a-tag` 绿/红（CopyFromBaseDialog 同款 bodyCell） |
| 操作人 | `operator` | 100 | 默认 |
| 更新时间 | `updated_at` | 180 | 默认 |

省：序号、创建时间、操作列。

## 4. 单选行选择

- `rowSelection.type='radio'`；`selectedRowKeys` 由 `selectedRow` 派生；
- **存整行 `selectedRow`**（`onChange(keys, rows)` 取 `rows[0]`）：`targetEnabled` 提示依赖所选行 `enabled`，翻页后 `tableData` 换页查不到该行；
- radio 单选天然无跨页累计，`preserveSelectedRowKeys` 不需要。

## 5. 数据流与交互

- `getDataSource(num, size)` → `getTestGroupPage({...searchForm, page_num, page_size})`；弹窗操作串行，不加竞态 token（同 CopyFromBaseDialog）；
- 分页用表格内置 `paginationProps`（`total/current/pageSize/showSizeChanger/pageSizeOptions:['10','20','50']/showTotal`）+ `@change="onTableChange"`；
- `show()` 重置：`searchForm={}`、`selectedRow=null`、`copyVariants=true` → 拉第 1 页；`destroy-on-close` 重置表单 DOM 态，`pageSize` 不重置（同型惯例）；
- `onResize`：offset=80 / min=100 同款；
- 空态：`#emptyText` slot 渲染「暂无测试组，去测试组页新建」，`onGoCreate` 原逻辑保留；
- 提交：`selectedRow?.id` 校验 → emit `{group_id, copy_variants}`，**载荷契约不变**；
- `targetEnabled` 由 `selectedRow.enabled` 计算，为 true 时 footer 显示「目标组当前处于启用状态，拷入数据需重启 mock 服务后生效」。

## 6. 类型与依赖

- `type.d.ts` 加 `SearchForm`（`name?: string; enabled?: boolean`）——独立定义，不引 `TestGroupManagerType`（共享组件不反向依赖视图类型）；
- `useDataManagerApi` 换绑 `getTestGroupList` → `getTestGroupPage`；
- import 增 `SearchForm`/`ENABLED_ENUM`/`FormType`/`TableRowSelection`，删 `a-radio-group` 相关与 `.group-list` 样式。

## 7. 影响面

| 范围 | 内容 |
|---|---|
| 改动 | `components/GroupPickerDialog/index.vue`（重写）、`type.d.ts`（+`SearchForm`） |
| 零改动 | outputManager 调用点（submit 载荷不变）、组列表页、Qt 仓、桥协议 |
| 衍生 | `getTestGroupList`/`/test_group/list` web 侧自此无消费方——hook 属 API 全集封装且 Qt 协议保留，保留不删 |

## 8. 验收

```bash
npx eslint <改动文件>     # 0 error
npx prettier --check <改动文件>
npm run build
```

回归点：弹窗重开状态重置；翻页/筛选后 `selectedRow` 与勾选回显一致；enabled 过滤（启用组至多 1 行）；空态跳转；选中启用组 footer 提示；提交载荷与拷入 toast 链路不回归。

## 9. 实施记录

| 日期 | 步骤 | 结果 | 备注 |
|---|---|---|---|
| 2026-11-22 | 弹窗重写：SearchForm + radio 单选表格 + `/test_group/page` 内置分页 + footer 提示 | 改动文件 eslint 0 error；prettier 通过；`npm run build` 通过 | 未提交，待确认 |

## 10. 方案修正

| 日期 | 修正内容 | 原因 |
|---|---|---|
| — | — | — |
