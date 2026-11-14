# 代码规范

> 适用范围：`mock-api-server-web-v3` 全仓（`apps/`、`src/`、`types/`）。

## 组件与写法

- Vue 单文件组件统一 `<script setup lang="ts">`；样式统一 `<style scoped lang="scss">`；
- 子应用入口三件套同构：`apps/<name>/index.html` + `main.ts` + `App.vue`，新增子应用按现有目录复制结构；
- antd 组件**只经 `unplugin-vue-components` 自动按需引入**，禁止 `app.use(Antd)` 全量注册、禁止手动 import 组件样式（cssinjs 运行时注入）；`components.d.ts` 为生成物不手改；
- dayjs locale 已在各 `main.ts` 设 `zh-cn`，新增日期组件无需重复设置。

## 样式与主题

- 主题色单源：`a-config-provider :theme` 走 `src/styles/qtWarmTheme.ts`（antd token）；scoped scss 手码色一律用 `$qt-*` 变量（`src/styles/variables.scss`，vite `additionalData` 全局注入，**无需手动 @use**）；
- 禁再引入 antd 默认蓝（`#1677ff`/`#1890ff` 等）与无源 hex；确需新色先加 `$qt-*` 变量并注明 PALETTE 对应；
- 色值权威源是 `mock-api-server` 仓 `config/theme.py` `PALETTE`，改色先同步该仓再更新本仓两个映射文件。

## 路径与引用

- 别名：`@/` → `src/`、`@apps/` → `apps/`；跨子应用共享代码放 `src/`，禁止子应用互相 import；
- 类型声明集中 `types/`（Qt bridge 载荷类型在 `types/qt/`，以 py 仓桥契约为准）。

## 门禁

- 提交前 `npm run lint:check` 0 error（warning 存量不新增）、`npm run format:check` 通过；
- `npm run build` 产物目录 `web-v3/` 为生成物，不入库不手改；构建产物拷入 Qt `appServer/static` 属发布动作。
