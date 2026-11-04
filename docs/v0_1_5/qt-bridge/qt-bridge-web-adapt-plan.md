# qt-bridge 信封状态收敛 — 前端适配方案

> 状态：已实施（随后端 Phase 1 同批落地，待联调验收）
> 范围：本仓 `types/qt/dataManager.d.ts`、`apps/dataManager/views/outputManager/components/VariantEditorDialog/index.vue`
> 上游方案：`mock-api-server` 仓 `docs/v0_1_5/qt-bridge/qt-bridge-refactor-plan.md`（Phase 1 §4.3）

## 1. 背景

Qt Bridge 回包原存在两级状态：信封 `status_code`（恒 0，只表达分发/异常）与载荷内 DB `OperationResult` 的 `success/status_code/status_msg` 三元组。后端 Phase 1 已把三元组上提为信封字段——**信封 `status_code` 自此是成败唯一权威**，`data` 变为纯业务载荷（失败固定 `null`，成功剥空为 `null`，保留 `id`/`affected_count` 等业务字段）。

本仓适配要点：

- 类型声明与真实载荷对齐：`dataManager.d.ts` 的操作结果类型不再声明系统状态字段；
- 消灭载荷状态字段的读取点：全仓唯一一处是 `VariantEditorDialog` 的 `res?.success` 守卫；
- 其余调用点本就依赖「resolve = 成功」语义（`QtRequestManager` 按信封 `status_code !== 0` reject），本次协议变更对它们反而修复了「业务失败也弹成功 toast」的既有 bug。

## 2. 改动清单

| # | 文件 | 改动 | 说明 |
|---|---|---|---|
| 1 | `types/qt/dataManager.d.ts` | `OperationResult` 删 `success/status_code/status_msg`，只留 `id?: string`；`BatchOperationResult` 同删三字段，保留 `affected_count?: number` | `affected_count` 是真实业务字段（批量删除 toast「共删除 N 条」依赖），非冗余状态 |
| 2 | `apps/dataManager/views/outputManager/components/VariantEditorDialog/index.vue` | `reorderVariants(...).then` 内删 `if (res?.success)` 守卫，resolve 即执行成功分支 | 原守卫下失败会走 resolve 但跳过成功分支且无错误提示（静默）；现失败由信封 `status_code` → reject → 默认错误拦截统一处理 |

## 3. 不改动的部分

- `src/utils/bridge/**`：`sendObjMsg`/`parseMessage`/`QtEventSender` 内部的 `{success: boolean}` 是发送/解析结果的本地语义，与协议载荷无关；
- `types/qt/downloadProxy.d.ts`：该通道本就无 OperationResult 载荷类型；
- `src/utils/request/index.ts`：HTTP 层（非 bridge）读信封 `status_code`，语义本就一致；
- 其余 mutation 调用点：无 `res.success`/`res.status_code` 读取（已全仓 grep 确认），依赖 resolve/reject 语义，零改动获得修复。

## 4. 发布约束

必须与后端 Phase 1 §4.1-4.2 同批：构建产物拷入后端 `appServer/static` 后随 Qt 端一起生效。错位组合的后果：

- 新 Qt + 旧 web → `reorder` 保存静默（旧守卫读到 `undefined`）；
- 旧 Qt + 新 web → 退回现状 bug（失败弹成功 toast）。

## 5. 验收

| 用例 | 预期 |
|---|---|
| 变体排序保存成功 | toast「排序保存成功」，列表刷新 |
| 变体排序保存失败 | 走错误拦截提示，不静默 |
| 批量删除成功 | toast「共删除 N 条记录」，`affected_count` 正常 |
| 增/改/删/复制 | resolve 即成功 toast，失败走错误提示（含「记录不存在」） |

## 6. 实施记录

| 日期 | 步骤 | 结果 | 备注 |
|---|---|---|---|
| 2026-11-04 | §2 两项改动落地 | 完成 | 后端同批实施见 mock-api-server 仓重构方案实施记录 |

## 7. 方案修正

| 日期 | 修正内容 | 原因 |
|---|---|---|
| （待填） | | |
