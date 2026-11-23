# AGENTS.md

## 项目

mock-api-server-web-v3：本地 mock 服务桌面工具的内嵌 webview 界面仓。Vue 3 + TypeScript + Vite 多入口 + antd-vue 4.x（cssinjs），随 `mock-api-server` 仓 Qt 客户端发布，构建产物拷入 Qt 侧 `appServer/static`。

## 命令

```bash
npm run dev              # 开发服务（根入口）
npm run dev:configEdit   # configEdit 子应用开发入口
npm run dev:apiTester    # apiTester 子应用开发入口
npm run build            # 生产构建（产物 → web-v3/）
npm run build:test       # test 模式构建
npm run lint:check       # eslint 检查（要求 0 error）
npm run format:check     # prettier 检查
npm run lint:changed     # eslint 仅查工作区改动文件（日常默认）
npm run format:changed   # prettier --check 同上范围
npm run lint             # eslint --fix
npm run format           # prettier --write
```

注：`dev:dataManager` 脚本不存在，dataManager 页经根入口/构建产物访问。

## 规则（改动代码前必读）

- `docs/rules/code/CODE_RULES.md` —— 组件/样式/别名约定（antd 自动引入、主题单源、alias 用法）
- `docs/rules/git/COMMIT_MESSAGE.md` —— git 提交规范（Conventional Commits）

## 文档地图

- `docs/README.md` —— 文档总地图（plans / rules / reference / reports 四类）
- `docs/plans/README.md` —— 方案与实施文档存档索引（含 plan 归置与「实施记录/方案修正」栏目约定）
- 上游文档（Qt 侧契约/PALETTE/桥协议）：`mock-api-server` 仓 `docs/`

## 红线

- `web-v3/` 构建产物目录不入库、不手改
- `components.d.ts` 是 `unplugin-vue-components` 生成物，不手改
- antd 组件只经自动按需引入，禁止 `app.use(Antd)` 全量注册
- 主题色单源：`qtWarmTheme.ts` token + `variables.scss` `$qt-*` 变量；禁引入 antd 默认蓝手码
- Qt Bridge 协议以 `mock-api-server` 仓契约为准；本仓产物与 Qt 版本须配套发布，改动信封/载荷字段必须与 Qt 侧同批
- 方案文档落地不自动 git commit，由人确认后提交
