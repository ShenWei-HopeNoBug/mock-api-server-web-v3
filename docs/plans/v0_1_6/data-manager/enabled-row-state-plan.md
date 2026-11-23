# dataManager 启用/禁用表格行底色方案

> 状态：已实施
> 范围：本仓 `apps/dataManager` 带启用状态列的 a-table + `src/styles` + `src/utils`

## 1. 背景

dataManager 各列表的启用状态只靠 `enabled` 列的 `a-tag` 绿/红小标签呈现，行级无视觉区分，数据行多时状态难以扫读。需求：启用/禁用行以符合暖调主题的行底色区分。

## 2. 目标

启用行染 `STATUS_ON` 浅色绿、禁用行染 `STATUS_OFF` 浅色灰（实色）；行选中态（picker 弹窗）保留 antd 默认选中色不被覆盖；`fixed` 列同步染色。

## 3. 纳管表格

| 表格               | 文件                                                                    | 备注                       |
| ------------------ | ----------------------------------------------------------------------- | -------------------------- |
| outputManager 主表 | `views/outputManager/index.vue`                                         | `operation` 列 fixed right |
| 组详情接口表       | `views/testGroupManager/detail/index.vue`                               | —                          |
| 响应变体表         | `components/VariantEditorDialog/index.vue`                              | 弹窗内、有拖拽排序模式     |
| 拷入测试组选择表   | `components/GroupPickerDialog/index.vue`                                | radio 行选择               |
| 从已有接口拷入表   | `views/testGroupManager/detail/components/CopyFromBaseDialog/index.vue` | checkbox 行选择 + fixed    |

排除：`testGroupManager/index.vue` 组列表（`a-switch` 单启用语义，不染）；`DetailDialog`（「是否启用」为描述项非表格行）。

## 4. 改动清单

| #   | 位置                 | 改动                                                                                                   | 说明                                                                                                                                                                |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `variables.scss`     | 新增 `$qt-row-enabled-bg: #eff0d4` / `$qt-row-disabled-bg: #f5eeda`                                    | STATUS_ON / STATUS_OFF 10% 叠 PANEL_BG 合成**实色**（fixed 列遮罩须不透明，详见方案修正）；注明 PALETTE 出处                                                        |
| 2   | `global.scss`        | `.ant-table .ant-table-tbody > tr.qt-row--{enabled,disabled}:not(.ant-table-row-selected) > td` 上底色 | 打在 `td` 级覆盖 fixed 列遮罩底；`.ant-table` 前缀 + `:not` 凑足 specificity 压 `td.ant-table-cell-row-hover`；排除 selected 行使 picker 选中色让位（不覆写选中态） |
| 3   | `src/utils/index.ts` | 新增 `getEnabledRowClass(record)` 返回 `qt-row--enabled`/`qt-row--disabled`                            | 类名契约单源，5 处调用防漂移                                                                                                                                        |
| 4   | 5 个表格模板         | `a-table` 加 `:row-class-name="getEnabledRowClass"`                                                    | 每处 +1 行模板 +1 行 import                                                                                                                                         |

## 5. 不改动的部分

- `enabled` 列 `a-tag` 绿/红标签保留，行底色为增量提示非替代
- Qt Bridge 契约零改动；`config/theme.py` PALETTE 零改动（新色为既有 token 低比例叠色派生）
- 组列表 `a-switch` 列与交互零改动

## 6. 影响面

| 项       | 评估                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| 文件     | 8 个（styles 2 + utils 1 + vue 5）                                                                                     |
| 行为变化 | hover 时行 hover 色（`controlItemBgHover` #ffe9c8）仍盖状态色，第一版保持默认；picker 选中行显示选中色                 |
| 风险     | 低，纯展示层；VariantEditorDialog 拖拽排序只动 DOM 顺序，类名随行数据无冲突                                            |
| 验证     | `lint:check`/`format:check` + dev/Qt webview 目检（含 fixed 列、弹窗内表格）；叠色比例可按观感微调（改后重算实色 hex） |

## 7. 可选增强（未实施）

- 禁用行文字弱化（`color: rgba(96,62,30,.55)`）
- 状态行定制 hover 色（`td.ant-table-cell-row-hover` 覆写为更深状态色）

## 8. 实施记录

| 日期       | 步骤     | 结果                                                                                                                                | 备注                                                                                 |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 2026-11-23 | 全量实施 | 8 文件落地：styles 2 + utils 1 + vue 5；改动文件 eslint 0 error（warning 为存量）、prettier 全过；README 存量表格被 prettier 重对齐 | 组列表 `a-switch` 表按约定不染；hover 盖状态色与 picker 选中色让位均为方案内预期行为 |

## 9. 方案修正

| 日期       | 原方案                                       | 实际做法                                                               | 原因                                                                                |
| ---------- | -------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 2026-11-23 | 行底色用 rgba 低透明（`rgba(STATUS_*, .1)`） | 改为预合成实色 hex（`#eff0d4` / `#f5eeda` = STATUS_* 10% 叠 PANEL_BG） | fixed 列遮罩底带透明度会透出下层滚动的其它列文字；实色观感与 10% 叠加一致且遮罩正确 |
| ——         | ——                                           | ——                                                                     | ——                                                                                  |
