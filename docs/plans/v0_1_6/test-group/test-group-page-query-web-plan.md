# 测试组列表分页/筛选 + 启用组指示 web 侧实施方案

> 关联文档：上游契约方案见 `mock-api-server` 仓 `docs/plans/v0_1_6/test-group/test-group-page-query-plan.md`（`/test_group/page`、`/test_group/enabled` 契约为准）；功能源流见同目录 `test-group-web-plan.md`
> 状态：待实施
> 范围：`apps/dataManager/views/testGroupManager/` / `apps/dataManager/hooks/useDataManagerApi.ts` / `types/qt/dataManager.d.ts`

## 1. 背景与范围

testGroupManager 组列表经 `/test_group/list` 无参全量拉取，无分页与筛选。本期升级为服务端分页 + 筛选浮层（结构与交互照抄 outputManager），并在页头展示当前启用组简略信息便于定位。

**本仓做**：协议类型扩展、`useDataManagerApi` 两方法、组列表页 UI/数据流改造。

**本仓不做**：桥协议实现（Qt 侧同批）、`GroupPickerDialog`（继续走 `/test_group/list` 全量）、组详情页。

## 2. 上游桥协议依赖（契约以 Qt 侧方案为准）

| 请求名 | 参数 | 返回 | 用途 |
|---|---|---|---|
| `/test_group/page` | `{name?, enabled?, page_num?, page_size?}` | `{list, total, page_num, page_size}` | 组列表分页+筛选主数据源 |
| `/test_group/enabled` | `{}` | `TestGroupSummary \| null` | 页头启用组指示 |

## 3. 头部结构（照抄 outputManager）

- `.collapse-row`：`justify-content: space-between`——左簇为「新建测试组」+ **启用组指示**（§4）；右簇为筛选 toggle 按钮（`FilterOutlined` + `DownOutlined` + `activeFilterCount` 计数角标）。
- `.search-area` 悬浮层：`position: absolute` 挂 header 卡下沿（`top:100%`、`z-index:10`、阴影/边框变量照抄），`v-show` 保留表单态。
- 浮层内容：`search-options` 行（「查询后自动收起」checkbox，默认勾）+ `SearchForm`（组名称 input + 启用状态 select，`ENABLED_ENUM` 复用）。无批量删除 → **不建 `tool-bar`**。
- `.header` 卡补 `position: relative` 锚点；`search-form` 限高样式段照抄。

## 4. 启用组指示

左簇「新建测试组」右侧展示：`当前启用：<name>` + `(<item_count> 条)`：

- 无启用组 → `当前启用：无`（弱化色）；
- **点击组名 → `onSearchSubmit({name: enabledGroup.name})`**，一步过滤定位该组（「便于查找」的落地交互）；
- 组名旁 `QuestionCircleOutlined` + tooltip 复用现有「启用/停用与组内数据变更，均需重启 mock 服务后生效」文案；
- 数据存 `enabledGroup` 独立 `ref`，`requestTokenMap` 分配独立 key（`get_test_group_enabled`）做竞态过滤；**不进 `tableLoading`**，避免启停切换时闪整表。

## 5. 数据流（照抄 outputManager）

- `searchForm`/`pagination`(`initPagination`)/`tableData`/`total`/`tableHeight`/`searchCollapsed`/`autoCollapseAfterSearch` 状态集同构；
- `loadingMap`/`requestTokenMap` 按本页动作建 key：`get_test_group_page`、`get_test_group_enabled`、`delete_test_group`；
- `getDataSource(pageNum, pageSize)`：`/test_group/page` + `/test_group/enabled` **并行**拉取，各自 token 竞态过滤（非最新响应丢弃）；
- `fetchData(refresh)`、`getRowIndex(index)`（分页序号换算）、`onPageChange`/`onSizeChange`、`onSearchSubmit`（含自动收起门控）照抄；
- `.pagination` 分页栏：`a-pagination`（size-changer/quick-jumper/`共 N 条`），表格 `:pagination="false"` 不变；
- `onResize`：`tableHeightOffset` 复核——结构同构后与 outputManager 同为 140（含分页栏 60px），实施时以实测为准。

## 6. 操作后刷新语义（对齐 outputManager）

| 动作 | 刷新 |
|---|---|
| 新建成功 | `fetchData(true)` 回第一页 |
| 重命名成功 | `fetchData(false)` 保持当前页 |
| 启用/停用切换 | `fetchData(false)`（启用组指示随并行请求自动更新） |
| 删除成功 | `fetchData(true)`（与 outputManager 一致，不精细退页） |

## 7. config/type/api 改动点

- `config.ts`：+`initPagination`、`initSearchForm`（`{}`）、`searchFormColumns`（组名称 input + 启用状态 select）、`searchFormFormProps`（labelCol 对齐）；`tableHeightOffset` 按 §5 复核。
- `type.d.ts`：+`SearchForm`（`name?: string; enabled?: boolean`）。
- `useDataManagerApi.ts`：+`getTestGroupPage`（`/test_group/page`）、`getEnabledTestGroup`（`/test_group/enabled`，返回 `TestGroupSummary | null`）；`getTestGroupList` 保留。
- `types/qt/dataManager.d.ts`：+`GetTestGroupPageParams`、`TestGroupPageResult`，注释标 `协议：/test_group/page`；`/test_group/enabled` 返回类型直接 `TestGroupSummary | null`。

## 8. 影响面（本仓）

| 位置 | 改动 |
|---|---|
| `apps/dataManager/views/testGroupManager/index.vue` | 头部筛选浮层 + 启用组指示 + 分页栏 + 数据流重写 |
| `apps/dataManager/views/testGroupManager/config.ts` | 分页/搜索配置常量新增 |
| `apps/dataManager/views/testGroupManager/type.d.ts` | `SearchForm` 新增 |
| `apps/dataManager/hooks/useDataManagerApi.ts` | 两方法新增 |
| `types/qt/dataManager.d.ts` | 协议类型扩展 |

**零影响**：`GroupPickerDialog`（`/test_group/list` 不变）、outputManager、组详情页、其余子应用。

## 9. 明确不做

- `/test_group/list` 消费方切换（GroupPickerDialog 全量语义保留）；
- 组详情页分页（本期仅组列表）；
- 删除后「当前页最后一条退一页」精细逻辑（与 outputManager `fetchData(true)` 对齐）；
- 更多筛选字段（`TestGroupQuery` 已留扩展位，按需后加）。

## 10. 实施节奏

与 Qt 侧两条协议同批。完成 → 报验收 → 等确认 → commit。**不自动提交**。

## 11. 验收

```bash
npm run lint:check     # 0 error
npm run format:check
npm run build
npm run dev            # 目检（需配新 Qt 构建联调桥方法）
```

| 项 | 方式 |
|---|---|
| 筛选+分页 | 组名模糊/启用过滤/翻页/页大小切换组合；生效数角标；自动收起勾选 |
| 启用组指示 | 启用/停用/顶替后指示刷新；点击组名过滤定位；无启用组弱化态 |
| 序号列 | 翻页后 `getRowIndex` 连续编号 |
| 操作回归 | 新建/重命名/删除/启停后刷新语义（§6）；GroupPickerDialog 全量列表不回归 |
| 高度 | 浮层开合 + 分页栏下 `scroll.y` 无遮挡/无空白 |

## 12. 实施记录

| 日期 | 步骤 | 结果 | 备注 |
|---|---|---|---|
| 2026-11-22 | 协议类型扩展 + api 两方法 + 头部浮层/启用组指示/分页栏 + 服务端分页数据流 | 改动文件 eslint 0 error（warning 均存量同款）；prettier 通过；`npm run build` 通过 | 未提交，待确认；webview 联调待新 Qt 构建 |

## 13. 方案修正

| 日期 | 修正内容 | 原因 |
|---|---|---|
| — | — | — |
