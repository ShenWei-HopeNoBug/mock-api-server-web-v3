# 测试组管理页 web 侧实施方案

> 关联文档：上游总体方案见 `mock-api-server` 仓 `docs/plans/v0_1_6/test-group/test-group-plan.md`（决策汇总、schema、匹配层、桥协议契约）；概念源流 `mock-api-server` 仓 `docs/discussions/TEST_GROUP_DESIGN_DISCUSSION.md`
> 状态：待实施
> 范围：`apps/dataManager/{layouts,router,views/testGroupManager,enum,hooks}` / `types/qt/dataManager.d.ts` / `views/outputManager`

## 1. 背景与范围

测试组 = 一组 mock 接口数据的命名集合，可一键启用遮蔽底层数据（语义与契约见上游方案）。本仓负责 **dataManager 子应用的布局化与组管理视图**，是测试组功能的唯一控制面（MCP 工具面后置）。

**本仓做**：BasicLayout 页签容器、`testGroupManager` 视图（组列表 + 组详情）、拷入组双入口、类型定义同步。

**本仓不做**：桥协议本身（上游 `MitmproxyDataEditDialog` 侧实现 `/test_group/*`）、组匹配语义（mock 服务端职责）。

## 2. 上游桥协议依赖

`/test_group/*` 八个请求名（上游方案 §7 契约为准）：`list / detail / create / update / delete / enable / disable / copy_into`。组 item 编辑/删除/变体操作复用现有 `/mock_data/*`、`/variant/*`（组 item 本质 api_data 行；"设为唯一启用"即 pin 等效）。

## 3. BasicLayout 页签容器

新 `apps/dataManager/layouts/BasicLayout/index.vue`（子应用内部归位，不上浮 `src/layouts/`；后续其他子应用需要同型布局再上浮）：

- header：横向 `a-menu`，菜单项由路由 children 的 `meta.title`/`meta.hidden` 生成（对齐 template 仓 `layoutRoute` 约定），`selectedKeys` 绑当前路由 name，点击 `router.push`
- content：`<router-view/>`
- `App.vue` 不动（桥接初始化 + ConfigProvider 壳）

## 4. 路由与导航

`apps/dataManager/router/staticRoute.ts`：

- root `component: BasicLayout`、`redirect` → `/outputManager`；
- children 平级挂 `outputManager`（meta.title 数据列表）+ `testGroupManager`（meta.title 测试组）；
- 组详情若做成子页面，用 `meta.hidden: true` + `activeMenu: 'testGroupManager'` 归高亮（template 仓已有此约定）；
- Qt 侧零改动：弹窗默认进 `#/outputManager`，`#/testGroupManager` 深链天然可用。

## 5. testGroupManager 视图

骨架复用 outputManager 的 header-card + content-card 模式。

**组列表页**：表格列 name / enabled（开关=原子顶替，`/test_group/enable|disable`）/ item 数 / updated_at；操作列：管理条目 / 编辑（改名，`/test_group/update`）/ 删除（级联确认）；header 新建按钮（表单仅 name，`/test_group/create`）。

**组详情（item 表）**：item 表格（复用 outputManager 表格模式，数据来自 `/test_group/detail` 的 items）；操作复用 `/mock_data/*` 与 `/variant/*` 编辑/变体/启禁用/删除。

**两处提示**：

- item 编辑 key 字段（url/method/params/content_type）时提示「修改 key 字段将使该条变为新增接口而非覆盖」；
- 新建/编辑组数据时提示「组数据变更需重启 mock 服务生效」（group_map 启动全量加载语义）。

## 6. 拷入组双入口

**入口 A（推）：outputManager 行操作「拷入测试组」**

- 操作列加第 7 个 link（后续拥挤再收 a-dropdown）；
- dialog：radio 目标组列表（name + item_count + 启用徽标，`/test_group/list`）+ checkbox「连带复制响应变体」（默认勾）；
- 确认 → `/test_group/copy_into`，item **默认 enabled=false**；toast「已拷入（默认禁用，请到组详情启用）」；目标组启用中附带「需重启生效」；无组时空态 + 「去测试组页新建」链接。

**入口 B（拉）：组详情「从已有接口拷入」**

- item 表上方按钮 → 大 dialog：精简搜索条（url/method/type）+ base 接口表格（`/mock_data/list` 白名单）+ checkbox 多选 + footer「连带复制变体」（默认勾）；
- 确认 → 逐条 `/test_group/copy_into`，item **默认 enabled=true** → 刷新 item 表。

**公共规则**：组内已存在同 key 条目时覆盖语义写进确认文案（"后者覆盖前者"，不做硬校验）；picker 只喂 base 类型数据（组→组互拷 UI 不暴露）。

## 7. 类型与代码风格约定

- 桥协议类型进 `types/qt/dataManager.d.ts` 的 `DataManagerType` 命名空间：`ApiData` 补 `group_id?: string`；`/test_group/*` 各建 params/result interface，注释标 `协议：/test_group/xxx`；`TestGroup`/`TestGroupSummary`/`TestGroupDetail` 字段逐字段注释；
- 视图本地类型进 `apps/dataManager/views/testGroupManager/type.d.ts` 的 `TestGroupManagerType` 命名空间（`RowRecord` 别名复用、`TableColumn` 沿用 `CommonType`），对齐 `outputManager/type.d.ts` 写法；
- 枚举常量进 `apps/dataManager/enum/index.ts`（`CommonType.EnumItem[]` + `createLabelMapFromValueEnum` 风格）。

## 8. 实施节奏

与上游步骤 ③ 同批：Qt bridge handlers + 本仓页面。完成 → 报验收 → 等确认 → commit。**不自动提交**。

## 9. 影响面（本仓）

| 位置 | 改动 |
|---|---|
| `apps/dataManager/layouts/BasicLayout/`（新） | 页签容器 |
| `apps/dataManager/router/staticRoute.ts` | 容器化 + 新路由 |
| `apps/dataManager/views/testGroupManager/`（新，含 `type.d.ts`） | 组列表/组详情/拷入 dialog |
| `apps/dataManager/views/outputManager/index.vue` + `config.ts` | 行操作「拷入测试组」 |
| `types/qt/dataManager.d.ts` | `DataManagerType` 协议类型扩展 |
| `apps/dataManager/enum`、`hooks` | 枚举/请求封装 |

## 10. 明确不做

- 组 item 的 pin 选择器（`pinned_variant_id` 列未建，pin 语义后置）；
- 组→组互拷 UI；
- MCP 工具面对应的任何前端面；
- `src/layouts/` 共享层（本子应用独有布局）。

## 11. 验收

```bash
npm run lint:check     # 0 error
npm run format:check
npm run build
npm run dev            # 目检：页签切换、组 CRUD、拷入、启停
```

| 项 | 方式 |
|---|---|
| 页签 | 两路由互切、刷新保持、组详情隐藏页高亮归位 |
| 组操作 | 新建/改名/删除/启停（开关单选语义）全链路 |
| 拷入 | A 推入默认禁 + B 拉取默认启，变体连带勾选生效 |
| 提示 | key 字段修改提示、重启生效提示出现 |

## 12. 实施记录

| 日期 | 步骤 | 结果 | 备注 |
|---|---|---|---|
| - | - | - | - |

## 13. 方案修正

| 日期 | 修正内容 | 原因 |
|---|---|---|
| - | - | - |
