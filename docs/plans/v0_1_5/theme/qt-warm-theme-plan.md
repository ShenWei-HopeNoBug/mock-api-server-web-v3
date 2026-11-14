# webview 子应用 antd 暖调主题适配方案

> 状态：已实施
> 范围：本仓 `src/styles/`、`apps/configEdit`、`apps/dataManager`、`src/components`
> 上游依据：`mock-api-server` 仓 `config/theme.py` `PALETTE`（Qt 客户端暖调主题单源）

## 1. 背景

Qt 客户端 v0.1.5 已完成全量暖调主题改造（色值收敛 `config/theme.py` `PALETTE` 单源）。内嵌 webview 的 `configEdit`、`dataManager` 两个子应用仍是 antd 默认蓝白主题，与宿主窗体暖色调割裂：页底纯白 vs Qt `#ffe8c3`、antd 蓝 `#1677ff/#1890ff` vs Qt 强调橙 `#cd8c41`。

## 2. 目标

webview 子应用观感与 Qt 暖调主题一致：页面底色贴 `WINDOW_BG`、组件主色/链接/描边/列表底贴 `PALETTE` 映射，手码残留 antd 蓝清零。零逻辑变化，纯视觉适配。

## 3. 改动清单

| #   | 文件                                                  | 改动                                                                                                                                                                                                                                                           | 说明                                                                                              |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | `src/styles/qtWarmTheme.ts`（新增）                   | 导出 `qtWarmTheme: ThemeConfig`：seed token 映射 PALETTE（主色/链接/状态/文字/背景/描边/圆角 4）+ `components` 小补 Button/Table/Modal                                                                                                                         | antd-vue 4.x `a-config-provider :theme` 挂载点；hover/active 档位由 antd 算法从 colorPrimary 派生 |
| 2   | `src/styles/variables.scss`                           | 写入 `$qt-*` 变量（原 0 字节占位文件）                                                                                                                                                                                                                         | vite `additionalData` 全局 `@use` 注入，各 scoped scss 直接用；与 qtWarmTheme.ts 同 PALETTE 源    |
| 3   | `apps/configEdit/App.vue`、`apps/dataManager/App.vue` | `<a-config-provider>` 加 `:theme="qtWarmTheme"`                                                                                                                                                                                                                | 顶层注入，全组件树生效                                                                            |
| 4   | `src/styles/global.scss`                              | `background-color` `#fff`→`$qt-window-bg`；`color-scheme: light dark`→`light`；滚动条 `#e2e2e2/#c8c8c8`→`$qt-scrollbar*`                                                                                                                                       | 页底贴 Qt 窗体底色；锁 light 防系统深色翻转 UA 控件（Qt 主题固定浅色）                            |
| 5   | 视图层手码清理                                        | `ProxyListInput`：`#f0f0f0`→`$qt-border-soft`、`#ff4d4f`→`$qt-error`；`DetailDialog`：`#ccc`×2→`$qt-border-soft`、`#e8e8e8`→`$qt-divider`；`VariantEditorDialog`：`#d9d9d9`→`$qt-border`、`#1890ff`→`$qt-link`、`#e6f7ff`×3→`$qt-panel-hover/$qt-panel-select` | 全部改走 `$qt-*` 变量，不重复手码                                                                 |
| 6   | `src/components/` 共享组件                            | `Spin`：`#1677ff`×2→`$qt-accent`（桥接 loading 第一屏）；`CopyIcon`：`#1677ff`→`$qt-link`、`#52c41a`→`$qt-success`；`JsonInput`：`#1890ff/#40a9ff/#096dd9`→`$qt-accent/$qt-accent-hover/$qt-accent-deep`、fullscreen 编辑器 `#fff`→`$qt-panel-bg`              | `Spin` 是 Qt 桥接加载首屏组件，蓝改橙收益最大；`DragUploadModule` 白字（深色蒙层上）保留不动      |

### token 映射（PALETTE → antd token）

| antd token                                        | PALETTE                                 | 值                                                    |
| ------------------------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| `colorPrimary`/`colorInfo`                        | `ACCENT`                                | `#cd8c41`                                             |
| `colorLink`                                       | `LINK`                                  | `#be6e28`                                             |
| `colorSuccess`/`colorWarning`/`colorError`        | `STATUS_ON`/`STATUS_WAIT`/`ICON_DANGER` | `#5aaa5a`/`#e6a03c`/`#c83c3c`                         |
| `colorTextBase`/`colorTextHeading`                | `TEXT`/`TITLE`                          | `#603e1e`/`#7a4c24`                                   |
| `colorTextDisabled`                               | `DISABLED_TEXT`                         | `#a58c73`                                             |
| `colorBgLayout`                                   | `WINDOW_BG`                             | `#ffe8c3`                                             |
| `colorBgContainer`/`colorBgElevated`              | `PANEL_BG`                              | `#fff8e1`                                             |
| `colorBgContainerDisabled`                        | `DISABLED_BG`                           | `#faf2e4`                                             |
| `colorBorder`/`colorBorderSecondary`/`colorSplit` | `BORDER`/`BORDER_SOFT`/`DIVIDER`        | `#c3945f`/`rgba(160,120,70,.27)`/`rgba(122,76,36,.2)` |
| `controlItemBgHover`/`controlItemBgActive`        | `PANEL_HOVER`/`PANEL_SELECT`            | `#fff5e1`/`#ffe0b2`                                   |
| `borderRadius`                                    | 对齐 Qt 控件圆角                        | `4`                                                   |

## 4. 不改动的部分

- `apps/apiTester`：不在本次范围；theme 文件共享后接入 = `:theme` 一行
- `reset.css`：第三方 reset 生成物；其 body 文字色被 antd token 覆盖，不动
- `DragUploadModule` 蒙层白字：深色半透明蒙层上的正确用色，保留
- Qt 侧（`mock-api-server` 仓）：零改动；antd 组件用法、locale、bridge 逻辑零改动

## 5. 双源约束

PALETTE 是 Qt 侧唯一权威；本仓 `qtWarmTheme.ts` 与 `variables.scss` 是同源映射（改色以 PALETTE 为准同步两处）。`$qt-accent-hover` 为 PALETTE 无对应 token 的派生提亮档，已在变量处注释。

## 6. 影响面

| 项       | 评估                                                                                        |
| -------- | ------------------------------------------------------------------------------------------- |
| 文件     | 10：新 theme/variables、App.vue×2、global.scss、视图×3、共享组件×3                          |
| 行为风险 | 零逻辑变化；antd token 顶层注入全树生效，免逐组件改                                         |
| 验证     | `lint:check`/`format:check`/`build` 过；`dev:configEdit`/`dev:dataManager` 目检对 Qt 主面板 |
| 后续     | apiTester 接入 = App.vue 加 `:theme`；PALETTE 变更需同步两处映射文件                        |

## 7. 验收

- `npm run lint:check` / `format:check` / `build` 全绿
- dev 目检：页面底色暖黄、按钮/选中/链接橙系、表格表头暖调、滚动条暖调、桥接 loading 橙
- 全仓 grep 无 `#1677ff|#1890ff|#40a9ff|#096dd9|#52c41a|#e6f7ff|#ff4d4f` 手码残留（apiTester 不动项除外）

## 8. 实施记录

| 日期       | 步骤                        | 结果                                                                                                                                                                                                                | 备注                                                         |
| ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 2026-11-14 | 全量实施                    | qtWarmTheme.ts + variables.scss 双源落位；App.vue×2 挂 `:theme`；global.scss 底色/color-scheme/滚动条；视图×3 + 共享组件×3 手码清零（比计划多出 Spin/CopyIcon/JsonInput 共享组件的 antd 蓝清理——grep 全量扫描发现） | ruff 无关；`lint:check`/`format:check`/`build` 验证          |
| 2026-11-14 | apiTester 接入 + hover 加深 | `apiTester/App.vue` 挂 `:theme`（三个内嵌界面主题统一）；`controlItemBgHover` `#fff5e1`→`#ffe9c8` 派生中档；`variables.scss` 加 `$qt-option-hover`                                                                  | apiTester 接入为原方案"未来项"收口；hover 加深为实测反馈修正 |

## 9. 方案修正

| 日期       | 原方案                                                                                             | 实际做法                                                                                                                                                                            | 原因                                                                                                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-14 | 手码清理仅计视图层 ~8 行                                                                           | 追加 `src/components` 共享组件 3 文件（Spin/CopyIcon/JsonInput）                                                                                                                    | 全仓 grep 复核发现 antd 蓝残留；Spin 是桥接 loading 首屏，视觉割裂最明显                                                                                                                                             |
| 2026-11-14 | `controlItemBgHover` 取 `PANEL_HOVER #fff5e1`                                                      | 改派生中档 `#ffe9c8`（介于 `PANEL_BG` 与 `PANEL_SELECT` 之间）                                                                                                                      | 实测 select 选项 hover 与容器底仅差 3 亮度单位、肉眼不可见；antd-vue 4.x 无 Select 专属 `optionActiveBg` 可覆写，全局 token 调深连带 Menu/Table 行等 hover 一并清晰（预期收益）；仍浅于选中态 `#ffe0b2` 一档保持层级 |
| 2026-11-14 | `components` 按 React antd v5 组件 token 写 `Button.defaultBg`/`Table.headerBg`/`Modal.titleColor` | antd-vue 4.x `ComponentToken` 为空接口，改：`Button.colorBgContainer` alias 覆写、`colorFillAlter` 覆盖表头、Modal 删覆写（`colorBgElevated`/`colorTextHeading` 基础 token 已命中） | vue-tsc TS2353 暴露；顺带修 `DetailDialog` v-for 索引类型存量报错 TS2365                                                                                                                                             |
