# dataManager 跨视图共享模块上移方案

> 结构重构：弹窗与 API hook 上移 `apps/dataManager` 顶层，消解测试组功能引入的双向跨视图引用。

## 1. 背景

testGroupManager 落地后 `apps/dataManager` 出现双向跨视图引用：

- `testGroupManager → outputManager`：组详情页引 `UserApiEditorDialog`/`VariantEditorDialog`（后者内部再引 `VariantFormDialog` + `useOutputManagerApi`）
- `outputManager → testGroupManager`：主视图引 `GroupPickerDialog`（拷入组入口）
- **hooks 层重复**：`useTestGroupApi` 与 `useOutputManagerApi` 重复实现 `getMockDataPage`/`editMockData`/`deleteMockData`/`copyIntoTestGroup` 四个方法

view 级目录只服务本路由，共享物应上移到应用顶层（既有先例：`apps/dataManager/hooks/useDataManagerRequest.ts`、`apps/dataManager/enum/`）。

**关键前提**：`useDataManagerRequest` 每次调用新建一套 bridge + manager（绑定调用组件生命周期）。「一个调用点一个 hook 实例」是既有语义，合并 hook 文件只是方法归拢，**不改变任何生命周期行为**。

## 2. 目标结构

```
apps/dataManager/
  components/                                # 新建：跨视图共享弹窗（目录整搬，内部结构不变）
    UserApiEditorDialog/   index.vue config.ts useFormColumns.ts type.d.ts
    VariantEditorDialog/   index.vue type.d.ts
    VariantFormDialog/     index.vue config.ts useFormColumns.ts type.d.ts
    GroupPickerDialog/     index.vue type.d.ts（新建）
  hooks/
    useDataManagerRequest.ts                 # 既有，不动
    useDataManagerApi.ts                     # 新建：合并版 API hook
```

## 3. 移动清单

| 源                                                     | 目标                              |
| ------------------------------------------------------ | --------------------------------- |
| `views/outputManager/components/UserApiEditorDialog/`  | `components/UserApiEditorDialog/` |
| `views/outputManager/components/VariantEditorDialog/`  | `components/VariantEditorDialog/` |
| `views/outputManager/components/VariantFormDialog/`    | `components/VariantFormDialog/`   |
| `views/testGroupManager/components/GroupPickerDialog/` | `components/GroupPickerDialog/`   |

`DetailDialog/`（仅 outputManager 用）、`CopyFromBaseDialog/`、`GroupFormDialog/`（仅 testGroupManager 用）留在各自 view 级不动。

## 4. hook 合并：`useDataManagerApi`

- 承载 `/mock_data/*` + `/variant/*` + `/test_group/*` 协议方法全集；**方法名/签名/返回类型不变**，调用点只换 hook 名
- 去重 4 个重复方法：`getMockDataPage`/`editMockData`/`deleteMockData`/`copyIntoTestGroup`
- 保留 `options.onReady` 入参与 `guardedFetch` 守卫
- 删除 `views/outputManager/hooks/useOutputManagerApi.ts`、`views/testGroupManager/hooks/useTestGroupApi.ts`

**否决项**：拆 `useMockDataApi` + `useTestGroupApi` 双 hook——需双域的视图（如 outputManager 用 `/test_group/copy_into`）要调两个 hook = 两套 bridge + 两个 onReady，首屏拉取易双触发。

## 5. 类型修正

| 位置                                          | 现状                                                        | 改法                                                                     |
| --------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `UserApiEditorDialog/type.d.ts` + `index.vue` | 引 `OutputManagerType`（`RowRecord` = `ApiData` 别名）      | 改引 `DataManagerType.ApiData`，脱钩视图类型                             |
| `VariantFormDialog/type.d.ts`                 | `import ... from '../VariantEditorDialog/type'`             | 相对路径不变（两目录仍平级）                                             |
| `GroupPickerDialog`                           | 无 type.d.ts，`GroupPickerSubmitPayload` 来自 `../../type`  | 新建自有 `type.d.ts` 收该载荷类型；`testGroupManager/type.d.ts` 移除该项 |
| 视图私有类型                                  | `SearchForm`/`TableColumn`/`ItemRecord`/`CopySearchForm` 等 | 留各自 `type.d.ts` 不动                                                  |

## 6. 调用点修改清单

| 文件                                                                   | 改动                                                                                            |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `outputManager/index.vue`                                              | 3 个组件 import → `@apps/dataManager/components/*`；`useOutputManagerApi` → `useDataManagerApi` |
| `outputManager/components/DetailDialog/index.vue`                      | 仅换 hook import                                                                                |
| `testGroupManager/index.vue`、`detail/index.vue`                       | 组件路径 + `useTestGroupApi` → `useDataManagerApi`                                              |
| `CopyFromBaseDialog/index.vue`、`GroupPickerDialog/index.vue`          | `useTestGroupApi` → `useDataManagerApi`                                                         |
| `UserApiEditorDialog`、`VariantFormDialog`、`VariantEditorDialog` 内部 | hook/兄弟组件引用换 `@apps/dataManager/*` 绝对路径                                              |

**删除**：4 个原组件目录 + 2 个旧 hook 文件；清空的 `views/outputManager/hooks/`、`views/testGroupManager/components/` 目录删除。

**不碰**：`useDataManagerRequest`、`enum/`、BasicLayout、路由、`#/qt/dataManager.d.ts`、Qt 侧一切。

## 7. 语义保证

- hook 每调用点仍独立 requestManager 生命周期——合并零行为变化
- 弹窗 props/emits 签名零改动；`InstanceType<typeof X>` ref 用法不受影响
- 方法名全集不变 ⇒ 无调用体改动，纯 import 路径/名称机械替换

## 8. 实施步骤

1. `git mv` 4 个组件目录到 `apps/dataManager/components/`（保 git 历史）
2. 新建 `useDataManagerApi.ts`（合并两 hook）→ 删旧 2 个
3. 类型修正（§5）+ `GroupPickerDialog/type.d.ts` 新建
4. 全仓 import 路径/hook 名替换（§6）
5. 验证：grep 确认无残留旧路径 → eslint 改动文件 → prettier → `npm run build`

## 9. 验收

```bash
npx eslint <改动文件>     # 0 error
npx prettier --check .   # 改动文件全过
npm run build            # 通过，无残留旧路径 import 报错
```

| 项         | 方式                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 引用完整性 | `grep -rn "views/outputManager/components\|views/testGroupManager/components/GroupPickerDialog\|useOutputManagerApi\|useTestGroupApi" apps/` 归零 |
| 行为回归   | 构建后两页签冒烟：条目编辑/变体编辑/拷入组弹窗正常打开与提交                                                                                      |

## 10. 实施记录

| 日期    | 步骤                                                       | 结果      | 备注   |
| ------- | ---------------------------------------------------------- | --------- | ------ |
| 2026-04 | 共享模块上移（4 弹窗 + useDataManagerApi 合并 + 类型脱钩） | apps/dataManager eslint 0 error（warning 存量同款）；prettier 全过；`npm run build` 通过 | 未提交 |

## 11. 方案修正

| 日期 | 修正内容 | 原因 |
| ---- | -------- | ---- |
| ——   | ——       | ——   |
