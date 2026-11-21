# 方案与实施文档存档

> 本目录为方案文档存档，按版本 / 功能域分子目录归置。
> 约定：每篇为唯一权威方案，偏离修正以增量章节追加、不改正文；
> 跨方案的后续变更单开增量文档（`*-changes.md`）。

## v0_1_6/

新版本迭代目录，按功能域分设子目录。

### test-group/

测试组管理页：dataManager 布局化 + 组管理视图。上游总体方案见 `mock-api-server` 仓 `docs/plans/v0_1_6/test-group/`。

| 文档                                                                              | 范围                                             | 说明                                                        | 状态   |
| --------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- | ------ |
| [test-group-web-plan](v0_1_6/test-group/test-group-web-plan.md)                   | `apps/dataManager` / `types/qt/dataManager.d.ts` | BasicLayout 页签容器 + testGroupManager 视图 + 拷入组双入口 | 已实施 |
| [group-form-modalform-changes](v0_1_6/test-group/group-form-modalform-changes.md) | `apps/dataManager`                               | GroupFormDialog 删除，组表单改用通用 ModalForm              | 已实施 |

### dm-shared-hoist/

dataManager 跨视图共享模块上移：弹窗 + API hook 归拢应用顶层，消解双向跨视图引用。

| 文档                                                                   | 范围               | 说明                                                    | 状态   |
| ---------------------------------------------------------------------- | ------------------ | ------------------------------------------------------- | ------ |
| [dm-shared-hoist-plan](v0_1_6/dm-shared-hoist/dm-shared-hoist-plan.md) | `apps/dataManager` | 4 共享弹窗上移 `components/` + `useDataManagerApi` 合并 | 已实施 |

## v0_1_5/

当前版本工作目录，按功能域分设子目录。

### antdv/

组件库大版本升级：ant-design-vue 3.2.20 → 4.x（cssinjs），依赖 `mock-api-server` 仓 PySide6 内核升级先行落地。

| 文档                                                       | 范围               | 说明                                                                                        | 状态                 |
| ---------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------- | -------------------- |
| [antdv4-upgrade-plan](v0_1_5/antdv/antdv4-upgrade-plan.md) | 本仓 antd 全量适配 | 依赖三件套 + importStyle/open/presets 适配 + Modal.confirm 上下文化，构建/lint/dev 冒烟已过 | 已实施（回归验证中） |

### qt-bridge/

Qt Bridge 协议演进的本仓侧适配：信封 `status_code` 收敛为成败唯一权威，载荷状态字段清零。上游方案见 `mock-api-server` 仓 `docs/plans/v0_1_5/qt-bridge/`。

| 文档                                                                     | 范围                                                         | 说明                    | 状态                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------- | -------------------- |
| [qt-bridge-web-adapt-plan](v0_1_5/qt-bridge/qt-bridge-web-adapt-plan.md) | `dataManager.d.ts` 类型瘦身 + `VariantEditorDialog` 守卫删除 | 随后端 Phase 1 同批落地 | 已实施（待联调验收） |

### theme/

webview 主题适配：`mock-api-server` 仓 `config/theme.py` `PALETTE` 暖调主题向 antd 侧映射。

| 文档                                                     | 范围                                                                 | 说明                                            | 状态   |
| -------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------- | ------ |
| [qt-warm-theme-plan](v0_1_5/theme/qt-warm-theme-plan.md) | `src/styles/` + configEdit/dataManager App.vue + 视图/共享组件手码色 | antd token 映射 PALETTE + `$qt-*` scss 变量双源 | 已实施 |

### data-manager/

dataManager 子应用功能演进。

| 文档                                                                      | 范围                                  | 说明                                                       | 状态   |
| ------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------- | ------ |
| [search-collapse-plan](v0_1_5/data-manager/search-collapse-plan.md)       | `outputManager/index.vue` header      | 9 字段搜索区 v-show 折叠，默认收起，生效数徽标             | 已实施 |
| [search-collapse-changes](v0_1_5/data-manager/search-collapse-changes.md) | `outputManager/index.vue` search-area | 浮层新增「查询后自动收起」勾选项，默认勾选，内存态不持久化 | 已实施 |

## 新文档归置约定

- 新功能方案按功能域入对应子目录；新功能域先在本文件登记再建目录。
- 文件名带功能前缀（如 `antdv-*.md`），与目录同名属预期，便于全文检索识别。
- 跨方案变更单开 `*-changes.md` 增量文档，不改正文。
- plan 文档除实施方案本身外，须含「实施记录」「方案修正」栏目，记录实际落地情况与偏离修正（增量章节追加，不改正文）。
- 文档方案的落地执行不自动 git commit，由人确认后提交。
- 版本存档目录（`v0_x_x/`）为历史冻结内容，不再变更；现行方案以功能域目录为准。
