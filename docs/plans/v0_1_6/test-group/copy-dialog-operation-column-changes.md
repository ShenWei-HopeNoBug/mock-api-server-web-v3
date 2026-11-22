# CopyFromBaseDialog 新增「查看详情」操作列 + DetailDialog 上移共享

> copy-from-base-dialog-changes / dm-shared-hoist-plan 的后续增量：拷入弹窗表格补操作列复用详情弹窗，`DetailDialog` 出现第二消费方而上移共享层。

## 1. 变更动机

1. 拷入弹窗挑选 base 接口时无法预览完整数据（params/response/变体），误拷成本高；
2. `DetailDialog` 原按「仅 outputManager 用」留在 `views/outputManager/components/`，现 CopyFromBaseDialog 成为第二消费方 → 按 dm-shared-hoist 标准上移 `apps/dataManager/components/`。

## 2. 变更内容

### 2.1 DetailDialog 上移

- `git mv`：`views/outputManager/components/DetailDialog/`（index.vue + config.ts + type.d.ts）→ `apps/dataManager/components/DetailDialog/`；
- 依赖全部为 `@/`、`@apps/`、`#/qt` 共享物与自身 `./type`/`./config`，无 view 级耦合，整目录平移零改动；
- `outputManager/index.vue` import 改 `@apps/dataManager/components/DetailDialog/index.vue`，渲染零变化。

### 2.2 CopyFromBaseDialog 操作列

| 项       | 值                                                                                        |
| -------- | ----------------------------------------------------------------------------------------- |
| 列配置   | `pickerTableColumns` 尾部加 `{ title:'操作', key:'operation', width:100, fixed:'right' }` |
| 单元格   | `<a-button type="link" @click="onDetail(record)">查看详情</a-button>`                     |
| 详情弹窗 | `<DetailDialog ref="detailDialogRef" />` 置于父 modal 内；`onDetail` 调 `show(record.id)` |
| scroll.x | 1670 → 1770（+操作列 100）                                                                |

- DetailDialog 自身为 a-modal（teleport 到 body），嵌套挂于父弹窗 DOM 内无层级问题，且随父 `destroy-on-close` 一并销毁；
- 不绑 `close` 回调：弹窗内无依赖行详情的状态需复位（outputManager 的回调仅用于清 `curRow`）。

## 3. 影响面

- 文件位移 3 个 + 改动 2 个 vue（outputManager/index.vue 仅 import 路径；CopyFromBaseDialog 新增列/弹窗）；
- `empty dir`：`views/outputManager/components/` 随移空在 git 中消失；
- DetailDialog API 未动，Qt 契约零影响。

## 4. 实施记录

| 日期       | 步骤                                                                      | 结果                                                           | 备注   |
| ---------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- | ------ |
| 2026-11-22 | DetailDialog 整目录 `git mv` 上移共享层 + outputManager import 改 `@apps` | git 识别为 rename 三连；改动文件 eslint 0 error；prettier 通过 | 未提交 |
| 2026-11-22 | CopyFromBaseDialog 加操作列/详情弹窗挂接 + scroll.x 1670→1770             | eslint 0 error；prettier 通过                                  | 未提交 |

## 方案修正

（预留：偏离正文的修正以增量章节追加。）
