# Git 提交信息规范

> 适用范围：本仓库全部 git commit。规范只约束新提交，不改写历史。
> 格式基准：Conventional Commits 标准式 `<type>(<scope>): <描述>`，沿用 `mock-api-server` 仓 `docs/rules/git/COMMIT_MESSAGE.md` 约定。

## 1. 格式

```
<type>(<scope>): <中文描述>
<空行>
<可选正文：说明"为什么"，不写"改了什么"（diff 自己会说话），约 72 字符折行>
<空行>
<可选 footer>
```

- `<type>`：必填，英文小写，从 §2 白名单取值；
- `(<scope>)`：可选，英文小写，从 §3 建议集取值，超出集合的新 scope 视为合理扩展；
- `<描述>`：必填，单行 ≤ 50 字符（中英文同计），中文动词开头（新增/修复/统一/收敛/迁移/删除/更新），句尾不加句号；
- 正文/footer 之间、subject/body 之间均以空行分隔。

## 2. type 白名单

| type       | 用途                      | 典型场景                                 |
| ---------- | ------------------------- | ---------------------------------------- |
| `feat`     | 新功能、新能力            | 新增变体排序、新增复制工具               |
| `fix`      | bug 修复                  | 修复守卫误删、修复弹窗样式               |
| `docs`     | 纯文档变更                | 方案文档、README、评审报告、注释文档化   |
| `refactor` | 不改变外部行为的重构      | 抽离公共组件、收敛重复实现               |
| `perf`     | 性能优化                  | 分包、虚拟滚动、提速                     |
| `style`    | 格式/命名调整（不改语义） | lint 修复、改名、排版                    |
| `test`     | 测试代码与测试基建        | 测试用例、夹具                           |
| `build`    | 依赖与构建打包            | package.json/lock、vite.config、产物分包 |
| `chore`    | 其他杂务                  | .gitignore、工程配置、清理杂项           |
| `revert`   | 回滚既有提交              | revert 某 commit                         |

判型原则：一次提交多种性质时按**主导改动**归类；功能改动顺带的文档更新不拆 `docs`。

## 3. scope 建议集

| scope         | 覆盖范围                       |
| ------------- | ------------------------------ |
| `configEdit`  | 下载代理/配置编辑子应用        |
| `dataManager` | 数据管理子应用                 |
| `apiTester`   | 接口调试子应用                 |
| `bridge`      | Qt Bridge 通道与类型           |
| `theme`       | antd token / scss 主题变量     |
| `build`       | vite 构建与产物                |
| `deps`        | 依赖管理（package.json、lock） |
| `docs`        | 文档体系自身                   |

## 4. footer 约定

- `BREAKING CHANGE: <说明>`：声明破坏性变更（接口/配置/协议不兼容）；
- `Generated with [Devin](https://devin.ai)` + `Co-Authored-By: Devin <...>`：agent 提交保留该 trailer；
- 引用方案条目可写 `Refs: docs/plans/v0_1_5/theme/qt-warm-theme-plan.md`。

## 5. 其他约定

- commit message 语言：subject/正文用中文，type/scope/footer 标记用英文；
- 一个 commit 只做一件事；方案文档落地按各自「提交拆分」节执行，不自动提交；
- **agent 不主动执行 `git commit`**：未得到明确提交指示时只完成工作区改动，由人确认后提交；
- 合并提交（merge commit）保持默认生成信息，不套用本规范；
- 规范文档自身变更按 `docs:` 提交。
