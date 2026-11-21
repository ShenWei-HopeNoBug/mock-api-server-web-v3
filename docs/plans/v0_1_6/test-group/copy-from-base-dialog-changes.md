# CopyFromBaseDialog 搜索区 SearchForm 化与弹窗限高

> test-group-web-plan 的增量修正：「从已有接口拷入」弹窗搜索区改用通用 `SearchForm`，补齐弹窗限高与宽度策略（对齐 `VariantEditorDialog`）。

## 1. 变更动机

`testGroupManager/detail/components/CopyFromBaseDialog` 两处与全站体系不一致：

1. `.search-bar` 手写 flex 布局（1 input + 2 select + 查询按钮），未复用 `src/components/form/SearchForm`；
2. 弹窗内容无限高、未挂 `__modal-wrap-no-scroll__`，矮视口/多数据时整个 modal 顶出视口（其余限高弹窗均已挂该 wrap class，见 `src/styles/global.scss` Qt WebEngine 混帧缓解注释）。

## 2. 变更内容

### 2.1 搜索区 SearchForm 化

| 行为       | 原实现                                            | SearchForm 接管                                                                       |
| ---------- | ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 布局       | 手写 flex + gap，input 自适应/select 定宽 180px   | `form-item-col` 固定 8 → 一行 3 列（字段恰好 3 个），工具区右侧 200px 自带按钮位      |
| 控件配置   | 模板内联 3 个控件 + `methodOptions`/`typeOptions` | script 侧 `searchFormColumns` 配置化（url/input、method/select、type/select）         |
| 查询/重置  | 仅「查询」                                        | 自带「重置 + 查询」双按钮，重置即清空并提交空表单                                     |
| 空值过滤   | `getDataSource` 内 3 个 `if` 守卫逐字段拼参       | `filterFormValue` 默认滤掉 `undefined/null/''`，直接 `{...searchForm, page_num, ...}` |
| label/占位 | 无 label，控件各自 placeholder                    | labelCol 默认宽 90px；input「请输入」/ select「请选择」统一占位                       |

- `form-item-col` 固定传 `8`，不接 `useSearchFormResize`（弹窗宽度由视口计算，无需响应式列数）。
- 提交回调 `onSearchSubmit(form)`：`searchForm = cloneDeep(form)` 后 `getDataSource(1, pageSize)` 回第一页。
- `destroy-on-close` + `show()` 内 `searchForm` 置空，保证每次打开表单重建不串值。
- SearchForm `loading` 绑 `listLoading`，拉取中禁重复提交。

### 2.2 弹窗限高与宽度

| 项       | 原值   | 新值                                                                                        |
| -------- | ------ | ------------------------------------------------------------------------------------------- |
| 宽度     | `920`  | `calc(100vw - 48px)`（对齐 `VariantEditorDialog`/`UserApiEditorDialog`）                    |
| wrap     | 无     | `wrap-class-name="__modal-wrap-no-scroll__"`                                                |
| 内容容器 | 无限高 | `.container` `height: calc(100vh - 220px)` flex 列（本弹窗带原生 footer，偏移比 160 多 60） |
| 表格滚动 | 无     | `.content` `v-dom-resize` 驱动 `tableHeight`，`:scroll="{ x: 900, y: tableHeight }"`        |

- `.content` flex:1 包裹表格，`onResize` 中 `tableHeight = max(100, 内容高 - 110)`，offset 110 覆盖表头（~40）+ 内置分页条（~64）占位。
- `.footer-bar`/`.tip` 置容器尾部 `flex-shrink:0`；`.tip` 条件渲染出现时 `.content` 自动收缩，`v-dom-resize` 触发重算。
- `x: 900` = 选择列 ~50 + 定宽列 620 + url 最小 ~230，窄视口出横向滚动条保底。

### 2.3 UX 差异（接受项）

| 差异               | 评估                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| 多「重置」按钮     | 与 outputManager 一致，重置=清空+查第一页，属收益                     |
| select 带输入筛选  | `showSearch`+`filterOption` 为 select 默认 props，全站统一            |
| 占位文案统一       | 「请输入」/「请选择」替代原「请求 Url 关键词」等                      |
| url 框回车搜索丢失 | SearchForm 无 `pressEnter` 透传链路，确认放弃（outputManager 同样无） |

## 3. 影响面

- 单文件改动：`apps/dataManager/views/testGroupManager/detail/components/CopyFromBaseDialog/index.vue`；
- props/emits/`defineExpose` 与 submit 载荷 `{ids, copy_variants}` 不变 → 父级 `detail/index.vue` 零改动，Qt 桥契约无影响；
- 复用只读依赖：`SearchForm`/`BaseForm`/`InputRender`（不改动）、`v-dom-resize` 全局指令、`__modal-wrap-no-scroll__` 全局样式；无新增依赖；
- `TestGroupManagerType.CopySearchForm` 等类型不变。

## 4. 实施记录

| 日期       | 步骤                                                                          | 结果                                                                    | 备注   |
| ---------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| 2026-11-22 | index.vue 改造：SearchForm 化 + `.container` 限高 + 宽度 `calc(100vw - 48px)` | 改动文件 eslint 0 error；改动文件 prettier 全过（含 README/本文档重排） | 未提交 |

## 方案修正

（预留：偏离正文的修正以增量章节追加。）
