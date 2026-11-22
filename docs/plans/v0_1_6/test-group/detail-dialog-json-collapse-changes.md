# DetailDialog 变体响应 JSON 折叠优化（后续变更）

> 关联文档：`test-group-web-plan.md`（DetailDialog 共享层化）；`copy-dialog-operation-column-changes.md`（弹窗调用点背景）
> 状态：已实施
> 范围：`apps/dataManager/components/DetailDialog/index.vue`

## 1. 背景

详情弹窗内每个响应变体挂一个 `JsonInput`（内嵌 CodeMirror，300px 高）。变体数量多时 N 个重量级编辑器同时挂载，单页渲染压力大。在变体 `response` 单元格外层加折叠容器：默认收起、收起态 `v-if` 不渲染 JsonInput。

## 2. 方案

- **仅折叠变体内 `response`**（`params`/主 `response` 两处 `json-area` 不动）；key 复用 `v-for` 既有表达式 `variant-${variant.id}-${vIndex}`（id 缺失有 index 兜底，与 `:key` 一致）。
- 展开态存 `expandedJsonKeys: Record<string, boolean>`；`isJsonExpanded`/`toggleJsonExpand` 两函数。
- 收起态 `v-if`（非 v-show）：CodeMirror 完全销毁；再展开按需重新挂载。
- toggle 用自定义薄行：`RightOutlined` 旋转 + 「展开查看/收起」文案，样式照抄 `filter-toggle` 图标旋转范式；不引 `a-collapse`（InfoDescription 槽内样式割裂且面板更重）。
- `resetStates()` 补 `expandedJsonKeys = {}`：modal `destroy-on-close` 不重置组件实例 ref，弹窗重开须全部回收起态。

## 3. 影响面

| 范围 | 内容 |
|---|---|
| 改动 | `DetailDialog/index.vue` 单文件（模板一处 + 两函数 + reset 一处 + 样式） |
| 零改动 | JsonInput、InfoDescription、类型、协议层、Qt 仓 |
| 受益 | outputManager/CopyFromBaseDialog/组详情「查看详情」全部调用方 |

## 4. 验收

`npx eslint` 0 error、`prettier --check`、`npm run build`；目检：多变体独立开合、编辑器挂载销毁正常、弹窗重开全收起、copy/readonly 功能不变。

## 5. 实施记录

| 日期 | 步骤 | 结果 | 备注 |
|---|---|---|---|
| 2026-11-22 | 变体 response 折叠容器：薄 toggle + `v-if` 懒挂载 + resetStates 清零 | eslint 0 error；prettier 通过；`npm run build` 通过 | 未提交，待确认 |

## 6. 方案修正

| 日期 | 修正内容 | 原因 |
|---|---|---|
| 2026-11-22 | toggle 由行内薄行升级为整行 header：`json-area--collapse` 修饰去内边距 + `$qt-option-hover` 底色 + `overflow:hidden` 收圆角，内容区独立 `padding:14px` | 感应区域扩大为整行可点，header 底色提供明确分区感；展开后 header 高度不变，仅内容区增减 |
| 2026-11-22 | 变体 `response` 编辑器高度 300px → 550px（与根部响应数据同高） | 折叠后空间约束解除，展开态给足查看高度 |
