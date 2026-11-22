# CopyFromBaseDialog 表格列与 outputManager 对齐

> copy-from-base-dialog-changes 的后续增量：拷入弹窗表格展示列与宽度同步 outputManager 列表口径，配置级复制、不抽象共享文件。

## 1. 变更动机

拷入弹窗与 outputManager 列表展示同一批 `ApiData`（同走 `getMockDataPage`），但列集合与列宽口径不一致：弹窗缺 `type`/`timeout`/`operator`/`created_at`/`updated_at` 列，`params` 200 vs 240、`url` 自适应 vs 260、url 单元格无 CopyIcon，两处视觉与信息量不对齐。

## 2. 变更内容

### 2.1 列集合同步

`pickerTableColumns` 按 outputManager `tableColumns` 的 10 个展示列原样同步（含顺序与宽度），剔除列表页专属的「序号」「操作」列：

| 列           | dataIndex              | width |
| ------------ | ---------------------- | ----- |
| 数据来源     | `type`                 | 120   |
| 请求Url      | `url`                  | 260   |
| 请求类型     | `method`               | 100   |
| Content-Type | `request_content_type` | 220   |
| 请求参数     | `params`               | 240   |
| 响应延时(ms) | `timeout`              | 120   |
| 启用状态     | `enabled`              | 100   |
| 操作人       | `operator`             | 100   |
| 创建时间     | `created_at`           | 180   |
| 更新时间     | `updated_at`           | 180   |

无 bodyCell 分支的列走 a-table 默认文本渲染，与 outputManager 一致。

### 2.2 单元格对齐

- `url` 分支改 outputManager 同款：`url-text` + `CopyIcon` + 空值 `-`（新增 `CopyIcon` import）；
- `enabled` tag 保留；`.params` 截断 1 行 → 2 行对齐 outputManager。

### 2.3 滚动宽

`scroll.x`：900 → 1670（10 列定宽合计 1620 + 选择列 ~50）。

### 2.4 取舍说明

- 列配置两处各存一份（应要求不抽共享模块）；后续 outputManager 调整展示列需手动同步本文件；
- 不含序号列：picker 按勾选挑数据，分页序号无实际用途。

## 3. 影响面

- 单文件改动：`apps/dataManager/views/testGroupManager/detail/components/CopyFromBaseDialog/index.vue`；
- props/emits/`defineExpose` 与请求参数不变，outputManager、共享组件、Qt 契约零触碰；
- 展示字段均已在 `ApiData` 类型内，无类型改动。

## 4. 实施记录

| 日期       | 步骤                                                         | 结果                                                                | 备注   |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------------------- | ------ |
| 2026-11-22 | index.vue 列配置同步 + url 单元格 CopyIcon + params 2 行截断 | 改动文件 eslint 0 error；改动文件 prettier 全过（含 README/本文档） | 未提交 |

## 方案修正

（预留：偏离正文的修正以增量章节追加。）
