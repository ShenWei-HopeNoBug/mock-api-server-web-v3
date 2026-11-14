# mock-api-server-web-v3

`mock-api-server` 本地 mock 服务桌面工具的**内嵌 webview 界面仓**：Vue 3 + TypeScript + Vite 多入口 + antd-vue 4.x（cssinjs）。构建产物拷入 Qt 客户端 `appServer/static` 随 Qt 侧发布。

子应用（`apps/` 下多入口，共享 `src/`）：

| 应用        | 入口                | 说明                  |
| ----------- | ------------------- | --------------------- |
| configEdit  | `apps/configEdit/`  | 下载代理等配置编辑    |
| dataManager | `apps/dataManager/` | 数据管理（变体/导出） |
| apiTester   | `apps/apiTester/`   | 接口调试              |

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **pnpm**: >= 8.0.0

### 安装依赖

```bash
npm install
# 或 pnpm install
```

### 开发环境

```bash
npm run dev              # 根入口
npm run dev:configEdit   # configEdit 独立入口
npm run dev:apiTester    # apiTester 独立入口
# 注：dev:dataManager 脚本不存在，经根入口/构建产物访问
```

开发服务器在 http://localhost:3000 启动。

### 构建与检查

```bash
npm run build            # 生产构建 → web-v3/
npm run build:test       # test 模式构建
npm run preview          # 预览构建结果
npm run lint:check       # eslint（门禁 0 error）
npm run format:check     # prettier 检查
npm run lint / format    # 自动修复
```

## 📚 文档与规范

- `AGENTS.md` —— 项目说明、命令、红线（贡献/Agent 入口）
- `docs/README.md` —— 文档总地图（plans / rules / reference / reports）
- `docs/rules/git/COMMIT_MESSAGE.md` —— 提交规范（Conventional Commits）
- `docs/rules/code/CODE_RULES.md` —— 代码规范（antd 自动引入、主题 `$qt-*` 单源、alias）

## ⚠️ 注意

- `web-v3/` 构建产物、`components.d.ts` 生成物：不入库、不手改；
- Qt Bridge 协议以 `mock-api-server` 仓契约为准，信封/载荷字段改动须与 Qt 侧同批发布。
