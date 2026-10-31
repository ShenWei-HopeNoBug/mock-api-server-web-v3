# ant-design-vue 4.x 升级方案（antdv 3.2.20 → 4.2.x）

> 状态：已实施（回归验证中）
> 范围：本仓 `package.json` / `vite.config.ts` / `apps/*/{main.ts,App.vue}` / `src/components/form/**` / `apps/dataManager/views/outputManager/**`
> 前置：`mock-api-server` 仓 `docs/v0_1_5/pyside6/pyside6-migration-plan.md` 已落地（Qt WebEngine 内核 Chromium 134，解除 antdv 4.x cssinjs `:where()` 兼容约束）；后端仓本方案零改动

## 1. 背景

antdv 长期停留在 3.2.20 的根因（详见 `mock-api-server` 仓 pyside6-migration-plan §1）：4.x 改用 cssinjs 运行时注入样式，生成选择器依赖 `:where()` 等现代 CSS 特性，PyQt5 内嵌内核 Chromium 83 无法渲染。PySide6 迁移后内核为 Chromium 134，约束解除，该方案遗留的「前端 antdv 4.x 升级」独立迭代即本文档。

另有一处既有债务：源码 `src/components/form/tools.ts`、`apps/**` 多处 `import dayjs`，但 `package.json` 未声明 dayjs（当前靠 antd-vue 传递依赖侥幸可用），本次一并显式化。

现状对照：

| 包 | 现状 | 目标（与 vue3-project-template 对齐） |
|---|---|---|
| ant-design-vue | 3.2.20 | ^4.2.1 |
| @ant-design/icons-vue | 6.1.0 | ^7.0.1 |
| dayjs | 未声明（幽灵依赖） | ^1.11.21 显式声明 |

antd 使用面：3 个入口（apiTester / configEdit / dataManager）经 `unplugin-vue-components` 按需引入；组件集中在 form / table / modal / select / collapse / popconfirm 等基础件；编程式调用为 `Modal.confirm` ×2、`message.*` 约 10 处；图标全部走 `@ant-design/icons-vue` 显式 import（8 个 Outlined 图标）。

## 2. 目标与拆分

- **本方案范围**：antdv 3.2.20 → 4.2.x、icons-vue 6 → 7、dayjs 显式化，及 4.x 破坏性变更所需代码适配；
- **非目标**：构建链升级（vite 5 / unplugin-vue-components 0.27 维持，与模板一致）；废弃 API 全面重构（仅顺手清理 `ranges`、`a-input-group` 等低成本项，其余标记不管）；`Modal.confirm`/`message` 全量上下文化列为可选步骤；后端仓零改动。

## 3. 依赖改动

`package.json`：

```diff
  "dependencies": {
-   "@ant-design/icons-vue": "6.1.0",
-   "ant-design-vue": "3.2.20",
+   "@ant-design/icons-vue": "^7.0.1",
+   "ant-design-vue": "^4.2.1",
+   "dayjs": "^1.11.21",
```

说明：

- `^4.2.1` caret 解析至 4.2.x 最新；icons 7.x 仅打包格式（exports/ESM）改造，图标名全集不变，本项目 8 个图标无感知；
- 4.x 传递依赖变化：移除 moment，新增 `@ant-design/cssinjs`、`stylis` 等，随 `npm install` 自动收敛；
- dayjs 本就是 antdv 4.x 日期组件原生依赖，显式声明同时消除幽灵依赖。

## 4. 代码改动清单

### 4.1 必改（不改即报错 / 功能失效）

| # | 改动 | 位置 | 说明 |
|---|---|---|---|
| 1 | `importStyle: 'css'` → `importStyle: false` | `vite.config.ts` `AntDesignVueResolver` | 4.x 全面 cssinjs，无 css 产物可引 |
| 2 | 删除 `import 'ant-design-vue/es/message/style/css'` 与 `import 'ant-design-vue/es/modal/style/css'` | `apps/{apiTester,configEdit,dataManager}/main.ts` ×3 | 4.x 无此文件，import 直接 resolve 失败；样式由 cssinjs 自动注入 |
| 3 | `v-model:visible` → `v-model:open` | `<a-modal>` ×5：`src/components/form/ModalForm/index.vue`、`apps/dataManager/views/outputManager/components/{VariantFormDialog,UserApiEditorDialog,DetailDialog,VariantEditorDialog}/index.vue` | 4.x 移除 `visible` prop；内部变量名 `visible`/`visibleRef` 保留不动 |
| 4 | `ranges: getRangePickerRanges()` → `presets: getRangePickerPresets()` | `apps/dataManager/views/outputManager/config.ts` L83 | 4.x RangePicker 移除 `ranges`，改 `presets`（`[{label, value}]`）；`getRangePickerPresets` 为现成 helper |
| 5 | 删除 `getRangePickerRanges()` | `src/components/form/tools.ts` | #4 后无调用方；`getRangePickerPresets` 保留 |
| 6 | 补 dayjs 中文 locale：`import 'dayjs/locale/zh-cn'` + `dayjs.locale('zh-cn')` | `apps/{apiTester,configEdit,dataManager}/main.ts` ×3 | 4.x picker 面板月份/星期文案走 dayjs locale，缺失则 `zhCN` 下仍显英文 |

### 4.2 行为差异（建议改，不改有小坑）

| 改动 | 位置 | 说明 |
|---|---|---|
| 根组件包 `<a-app>`，`Modal.confirm` → `Modal.useModal()`、`message` → `App.useApp().message` | 3 个 `App.vue`；`ModalForm/index.vue`、`outputManager/index.vue` 两处 confirm；`message` 调用面 ~10 处 | 4.x 起静态方法不消费 `a-config-provider` 上下文，confirm 按钮文案/主题与 `zhCN` 不一致；上下文 API 同时解决多入口 message 样式 |

### 4.3 废弃但暂可用（仅 warning，顺手清理项）

| 改动 | 位置 | 说明 |
|---|---|---|
| `<a-input-group compact>` → `<a-space-compact>` | `apps/apiTester/views/staticResourceTester/components/StaticUrlInput/index.vue` | 4.x 废弃 Input.Group；功能仍可用 |
| `<a-collapse-panel>` → `<a-collapse :items>` | `apps/apiTester/views/mockTester/components/MockRequestTester/index.vue` | 4.x 废弃 Panel 子组件用法；含 `:deep(.ant-collapse-*)` 覆盖，改 items 结构需同步调样式 |

`<a-select-option>`、`#bodyCell` 插槽、`Modal.confirm({onOk})`、`a-config-provider :locale`、`ant-design-vue/es/locale/zh_CN` 导入路径、`FormInstance` 类型等在 4.x 均未变，零改动。

## 5. 实施顺序

```
package.json 三处版本 → npm install（dayjs 显式化随安装生效）
  → vite.config.ts importStyle: false
  → 3× main.ts：删 css import + 补 dayjs locale（§4.1-#2/#6）
  → 5× v-model:visible → v-model:open（§4.1-#3）
  → config.ts ranges→presets + tools.ts 删 helper（§4.1-#4/#5）
  → （可选）§4.2 a-app + useModal/useMessage 上下文化
  → npm run dev 三入口逐个冒烟（dev:apiTester / dev:configEdit / 默认 dataManager）
  → npm run lint:check + npm run build
  → PySide6 客户端内嵌 webview 实机回归（§6）
  → 文档对齐（本方案实施记录回填、仓 README/CHANGELOG 如需）
```

## 6. 回归验证矩阵

| 项 | 验证点 |
|---|---|
| 三入口渲染 | apiTester / configEdit / dataManager 首屏正常、控制台无 import/resolve 报错 |
| Modal ×5 | ModalForm 及 outputManager 四个弹窗均能打开/关闭/提交，`destroy-on-close` 生效 |
| RangePicker | outputManager「创建时间」预设项中文显示、可点选回填、提交参数 `create_start/end_time` 正确 |
| Modal.confirm | 重置表单确认框、批量删除确认框按钮文案语言（§4.2 未做则确认是否接受英文） |
| 拖拽排序 | VariantEditorDialog 表格 Sortable 拖拽后顺序正确 —— 索引偏移逻辑依赖 `.ant-table-measure-row`，4.x DOM 重点实测 |
| 样式注入 | message 弹层、Modal.confirm 蒙层样式正常（cssinjs 运行时注入验证） |
| `:deep` 覆盖 | `.ant-collapse-header/content-box`（MockRequestTester）、`.ant-card-body`、`.ant-form-item`、`.ant-table-tbody` 覆盖效果不丢 |
| 日期面板 | RangePicker 月份/星期中文（dayjs locale 生效） |
| 构建 | `npm run build` 产物经 mock server 静态服务加载正常；`antd-vendor` chunk 生成 |
| 内嵌场景 | PySide6 客户端打开内嵌页面：渲染、桥接交互、缩放正常（Chromium 134 下 cssinjs 实机确认） |

## 7. 影响面与风险

| 项 | 说明 |
|---|---|
| 代码改动量 | 必改 ~15 处编辑点（多为单行改名/删行），无架构性改动；可选 §4.2 再加 ~12 处 |
| cssinjs 覆盖 | `:deep(.ant-*)` 选择器在 4.x 大体保留，但 collapse/table 内部 DOM 微调，按 §6 回归 |
| 静态方法 locale | 见 §4.2，4.x 文档明确的上下文隔离行为 |
| 老浏览器 | `@vitejs/plugin-legacy` targets Chrome>=64 不变；`:where()` 需 Chrome 88+，主场景已由 webview Chromium 134 覆盖，纯浏览器场景沿用模板现状、不在本方案收紧 |
| manualChunks | `antd-vendor` 名单可保留；4.x 新增传递依赖（cssinjs/stylis 等）落默认 chunk，追求极致分包可追加名单（可选优化项） |
| components.d.ts | 按需引入声明文件由 unplugin-vue-components 自动重生成，无需手改 |
| 构建产物 | 输出 `web-v3/` 目录结构与内嵌服务方式不变 |

## 8. 回滚

依赖全量走 `package-lock.json` 快照，代码改动为单行替换/删除级别，无数据迁移、无接口协议变更。**回滚 = 还原工作区 + `npm ci`**，零成本。

## 9. 实施记录

| 日期 | 步骤 | 结果 | 备注 |
|---|---|---|---|
| 2026-11-01 | 方案定稿 | 影响面全量扫描完成：css import ×3、`v-model:visible` ×5、`ranges` ×1、`:deep(.ant-*)` 覆盖 ×8、Sortable measure-row 依赖 ×1；选型对齐 vue3-project-template（antdv ^4.2.1 / icons ^7.0.1 / dayjs 显式化） | 待实施 |
| 2026-11-01 | §3 依赖换绑 | `ant-design-vue@4.2.6` / `@ant-design/icons-vue@7.0.1` / `dayjs@1.11.21`（显式声明）；moment 已移除，`npm install` 收敛 | — |
| 2026-11-01 | §4.1 必改落地 | `importStyle: false`；3× main.ts 删 css import + 补 `dayjs.locale('zh-cn')`；5× `v-model:open`；`ranges→presets` + 删 `getRangePickerRanges` | — |
| 2026-11-01 | §4.2/§4.3 落地 | 2× `Modal.confirm` → `Modal.useModal()` + contextHolder（最小实现，见 §10-修正2）；`a-input-group` → `a-space-compact`；`a-collapse-panel` 维持不动 | — |
| 2026-11-01 | 扫描补充项 | 实施中发现 `wrap-class-name` ×2（DetailDialog / UserApiEditorDialog）→ `root-class-name`，见 §10-修正1 | — |
| 2026-11-01 | 构建验证 | `lint:check` 0 error；`build` / `build:test` 均通过（三入口全量，antd-vendor chunk 正常）；dev server 三入口 200 + 模块 transform 无报错；`Modal.useModal`/resolver `SpaceCompact→Compact` 链路确认 | §6 人工回归矩阵待执行 |
| 2026-11-01 | 移除 `@vitejs/plugin-legacy` | 卸载插件及 117 个传递依赖（core-js/regenerator 等）；`build:test` 通过，构建耗时 ~42s → ~13s，产物不再含 legacy/polyfills 冗余 chunk，index.html 体积减半；Vite 默认 `target:'modules'` 即现代 ESM 浏览器基线，未显式配 target | 见 §10-修正3 |

## 10. 方案修正

| 日期 | 修正内容 | 原因 |
|---|---|---|
| 2026-11-01 | 初稿 | — |
| 2026-11-01 | 修正1：补充 `wrap-class-name` → `root-class-name` ×2 | 4.x 中 Modal 的 `wrapClassName` 更名为 `rootClassName`，方案定稿扫描遗漏（DetailDialog、UserApiEditorDialog 各 1 处），实施中补改 |
| 2026-11-01 | 修正2：§4.2 收敛为最小实现——仅 2× `Modal.confirm` → `Modal.useModal()`，`message` 保持静态，不包 `<a-app>` | `message` 调用面 ~10 处且含 `src/utils/request` 等非组件模块（无 setup 上下文，无法走 `App.useApp()`），部分迁移反而口径不一；静态 `message` 内容均为自定义中文文案，无内建 locale 文案问题。useModal 经 ConfigProvider 注入即可获得 zhCN，无需 `<a-app>` 包装 |
| 2026-11-01 | 修正3：移除 `@vitejs/plugin-legacy`，不配置显式 `build.target` | 页面唯一运行场景为 PySide6 内嵌 webview（Chromium 134）与现代桌面浏览器访问 `localhost:5000`，legacy 的 Chrome>=64 双份转译 + polyfills 已无受众；Vite 默认 `target:'modules'` 即为现代 ESM 浏览器基线。§7「老浏览器」风险行随之失效，若后续确有老浏览器诉求再加回插件或收紧 target |
