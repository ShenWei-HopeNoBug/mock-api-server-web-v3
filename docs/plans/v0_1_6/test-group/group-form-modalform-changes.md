# GroupFormDialog 删除，组表单改用 ModalForm 复用

> test-group-web-plan 的增量修正：自研单字段弹窗与通用 `ModalForm` 功能重叠，删除组件改直用。

## 1. 变更动机

`testGroupManager/components/GroupFormDialog`（90 行自研弹窗，单字段「组名称」）与 `src/components/form/ModalForm`（BaseForm + Modal 通用封装）功能完全重叠。删除专用组件，组列表页直接使用 ModalForm，减少维护面并对齐通用表单体系（内联校验、统一 footer）。

## 2. 变更内容

### 2.1 行为映射

| 行为       | 原 GroupFormDialog               | ModalForm 接管                                                                              |
| ---------- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| 标题       | `isEdit` 内部判定                | `title` prop（`groupFormTitle` computed 读 `isEdit`）                                       |
| 表单       | `a-input` maxlength 50           | `columns` 单列 `required:true` + `inputProps:{maxlength:100, allowClear:true, placeholder}` |
| 必填       | 手动 trim + `message.error`      | `required:true` → BaseForm 内置规则，表单项内联提示                                         |
| trim       | submit 时 `.trim()`              | 不处理（前后空格残留，影响可忽略）                                                          |
| 模式判定   | 弹窗内 `Boolean(curId)`          | 父级 `isEdit` 显式标记：`onAdd` 置 false、`onRename` 置 true                                |
| 编辑行数据 | `curId` 弹窗内                   | `curRow` 整行（`cloneDeep`），提交取 `curRow.value.id`                                      |
| 初值       | `show({id,name})`                | `initFormValues: TestGroupManagerType.GroupForm`（destroy-on-close 每次重挂重灌）           |
| 弹窗壳     | width 480 / centered             | `v-bind="$attrs"` 透传                                                                      |
| 接口       | emit `submit{id,name}` / `close` | emit `submit(form)` / expose `show`/`close`                                                 |

### 2.2 文件改动

- `views/testGroupManager/index.vue`：组件替换 + `isEdit`/`curRow`/`groupFormTitle`/`groupFormInit`/`groupFormColumns` 状态；`onFormSubmit` 改按 `isEdit` 分支调 `updateTestGroup`/`createTestGroup`
- 删除 `views/testGroupManager/components/GroupFormDialog/`（`components/` 目录随删清空）
- `type.d.ts`：`GroupForm` 保留，注释更新为「initFormValues / submit form 双侧类型」

### 2.3 UX 差异（接受项）

| 差异                                     | 评估                                                |
| ---------------------------------------- | --------------------------------------------------- |
| footer 确定/取消 → 重置（二次确认）/保存 | ModalForm 默认 footer 零改动；重命名态重置=还原原名 |
| Enter 提交丢失                           | `pressEnter` 无透传链路，丢弃                       |
| 校验提示                                 | `message.error` → 表单项内联错误                    |
| maxlength                                | 50 → 100                                            |
| 不 trim                                  | name 前后空格可残留                                 |

## 3. 语义保证

- 模式由按钮入口显式置位，与行数据内容解耦：`id` 异常为空不会误走新建分支
- `destroy-on-close` + `initFormValues` 重灌 ⇒ 连续开关不串值
- 请求成功才 `close()`（不用 `closeAfterSubmit`，失败不关窗），`.finally` 复位 `formLoading`

## 4. 实施记录

| 日期    | 步骤                                            | 结果      | 备注   |
| ------- | ----------------------------------------------- | --------- | ------ |
| 2026-04 | GroupFormDialog 删除 + index.vue 改用 ModalForm | 改动文件 eslint 0 error；prettier 全过；`npm run build` 通过 | 未提交 |
