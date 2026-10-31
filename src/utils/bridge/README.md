# Qt Bridge 模块（Web 端）

Web 端 Qt 桥接工具集。通信协议（消息格式、通道清单、错误码、Qt 端分发模型）见主文档：

> **`mock-api-server/QT_BRIDGE.md`**

本文件仅说明 Web 端模块的使用方式。

## 模块组成

| 文件 | 说明 |
|---|---|
| `QtBridge.ts` | 传输层：包装 QWebChannel 桥接对象，提供 `send` / `sendObjMsg` 与 `RECEIVE` / `BEFORE_DESTROY` 事件；静态方法 `getQtBridgeData()` 获取 `channel.objects` |
| `QtRequestManager.ts` | 会话层：request/response 的 `action_id` 配对、超时、`interceptors.response` 拦截器链、`QtRequestError` |
| `QtEventSender.ts` | `createQtEventSender(getBridge, onError)`：发送 `type: 'event'` 单向事件，无回包 |
| `InterceptorManager.ts` | axios 风格拦截器管理器（`use` / `eject`） |
| `defaultInterceptors.ts` | 默认拦截器：成功解包 `data.data`；失败按 `config.noMessage` 决定是否全局 toast |
| `tools.ts` | `isBridgeUsable`：校验桥接对象是否可收发 |
| `type.d.ts` | 全部类型定义（`QtBridgeType` / `QtRequestManagerType` / `QtEventSenderType` / `InterceptorManagerType`） |

## 使用方式

页面侧不直接使用本模块，统一走各 app 的生命周期 hook：

- `apps/dataManager` → `useDataManagerRequest()`（`dataManager` 通道）
- `apps/configEdit` → `useDownloadProxyBridge()`（`downloadProxy` 通道，额外提供 `closeDialog` 事件封装）

hook 内部完成：等待 `qtBridgeStore.register` → 取 `channelObj.<通道名>` → `new QtBridge` → `new QtRequestManager` → `setupDefaultInterceptors` → 组件卸载时自动销毁。

业务调用层（如 `useOutputManagerApi` / `useDownloadProxyApi`）在此基础上用 `manager.fetch(name, params, config)` 发请求：

```ts
const { requestManager, isReady } = useDataManagerRequest({ timeout: 10000, onError: message.error });

// 成功 resolve 业务数据（默认拦截器已解包 data.data）；失败 reject QtRequestError
const res = await requestManager.value.fetch<GetMockDataPageRes>('/mock_data/list', {
  page_num: 1,
  page_size: 20,
});
```

发送单向事件：

```ts
const sendEvent = createQtEventSender(() => bridge, onError);
sendEvent('download_proxy.close_requested', { errorMessage: '关闭窗口通知发送失败' });
```

## 关键约定

- **超时**：`0` = 无超时（默认）；各 hook 统一传 `10000`；单次请求 `config.timeout` 覆盖
- **noMessage**：`config.noMessage` / event `options.noMessage` 跳过全局错误 toast，错误仍会 reject
- **销毁顺序**：先 `requestManager.destroy()` 再 `bridge.destroy()`；bridge 销毁会广播 `BEFORE_DESTROY`，使 manager 以 `BRIDGE_DESTROYED` 清理 pending
- **协议名**：request 用 `/namespace/action`，event 用 `domain.action_name`；新增协议同步更新 `types/qt/*.d.ts` 与 Qt 端 `app_types/`
