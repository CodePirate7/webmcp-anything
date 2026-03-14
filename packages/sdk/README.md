[English](#webmcp-anythingsdk) | [中文](#webmcp-anythingsdk-中文)

# @webmcp-anything/sdk

Browser SDK for [webmcp-anything](https://github.com/CodePirate7/webmcp-anything) — register MCP Tools directly from your React components.

## What It Does

1. **Re-exports `useWebMCP`** from the [`usewebmcp`](https://www.npmjs.com/package/usewebmcp) package — the standard React hook for registering tools on `navigator.modelContext`.
2. **Provides `initBridge()`** — installs a WebSocket-backed `navigator.modelContext` polyfill when native WebMCP is unavailable. Your existing `useWebMCP` hooks work transparently without any code changes.

## Install

```bash
npm install @webmcp-anything/sdk
# or
pnpm add @webmcp-anything/sdk
```

**Peer dependency:** React 17 / 18 / 19

## Quick Start

### 1. Initialize the Bridge (app entry point)

```typescript
import { initBridge } from '@webmcp-anything/sdk';

initBridge({
  url: 'ws://localhost:9100',
  appId: 'my-app',
});
```

### 2. Register Tools (in any component)

```typescript
import { useWebMCP, textResult } from '@webmcp-anything/sdk';

function MyPage() {
  const [data, setData] = useState({ title: 'Hello' });

  useWebMCP({
    name: 'read_page_state',
    description: 'Read the current page state',
    execute: async () => textResult(JSON.stringify(data)),
  });

  useWebMCP({
    name: 'update_title',
    description: 'Update the page title',
    schema: { type: 'object', properties: { title: { type: 'string' } } },
    execute: async (params) => {
      setData(prev => ({ ...prev, title: params.title }));
      return textResult('Title updated');
    },
  });
}
```

### 3. Cleanup (optional)

```typescript
import { cleanupBridge } from '@webmcp-anything/sdk';

// When your app unmounts
cleanupBridge();
```

## API

| Export | Description |
|--------|-------------|
| `useWebMCP(config)` | React hook to register an MCP Tool (from `usewebmcp`) |
| `initBridge(options)` | Initialize WebSocket bridge to `@webmcp-anything/bridge` |
| `cleanupBridge()` | Disconnect and remove the polyfill |
| `getBridge()` | Get the current bridge instance |
| `textResult(text)` | Helper to create MCP text content result |
| `jsonResult(data)` | Helper to create MCP JSON content result |

### `initBridge(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | `'ws://localhost:9100'` | Bridge WebSocket URL |
| `appId` | `string` | — | Application identifier |
| `token` | `string` | — | Auth token (must match Bridge) |

## How It Works

```
React Component
  └─ useWebMCP()
       └─ navigator.modelContext.registerTool()
            └─ Bridge polyfill (WebSocket) ──→ @webmcp-anything/bridge ──→ AI Agent
```

When native WebMCP (`navigator.modelContext`) is available (e.g., via browser extension), `initBridge()` is a no-op and hooks talk directly to the native API. Otherwise, the Bridge polyfill takes over.

## License

MIT

---

# @webmcp-anything/sdk 中文

[webmcp-anything](https://github.com/CodePirate7/webmcp-anything) 的浏览器 SDK — 直接在 React 组件中注册 MCP Tools。

## 功能

1. **重新导出 `useWebMCP`** — 来自 [`usewebmcp`](https://www.npmjs.com/package/usewebmcp) 包的标准 React Hook，用于在 `navigator.modelContext` 上注册工具。
2. **提供 `initBridge()`** — 当原生 WebMCP 不可用时，安装基于 WebSocket 的 `navigator.modelContext` polyfill。你现有的 `useWebMCP` hooks 无需任何代码改动即可透明工作。

## 安装

```bash
npm install @webmcp-anything/sdk
# 或
pnpm add @webmcp-anything/sdk
```

**依赖要求：** React 17 / 18 / 19

## 快速开始

### 1. 初始化 Bridge（应用入口）

```typescript
import { initBridge } from '@webmcp-anything/sdk';

initBridge({
  url: 'ws://localhost:9100',
  appId: 'my-app',
});
```

### 2. 注册工具（在任意组件中）

```typescript
import { useWebMCP, textResult } from '@webmcp-anything/sdk';

function MyPage() {
  const [data, setData] = useState({ title: 'Hello' });

  useWebMCP({
    name: 'read_page_state',
    description: '读取当前页面状态',
    execute: async () => textResult(JSON.stringify(data)),
  });

  useWebMCP({
    name: 'update_title',
    description: '更新页面标题',
    schema: { type: 'object', properties: { title: { type: 'string' } } },
    execute: async (params) => {
      setData(prev => ({ ...prev, title: params.title }));
      return textResult('标题已更新');
    },
  });
}
```

### 3. 清理（可选）

```typescript
import { cleanupBridge } from '@webmcp-anything/sdk';

// 应用卸载时
cleanupBridge();
```

## API

| 导出 | 说明 |
|------|------|
| `useWebMCP(config)` | 注册 MCP Tool 的 React Hook（来自 `usewebmcp`）|
| `initBridge(options)` | 初始化到 `@webmcp-anything/bridge` 的 WebSocket 连接 |
| `cleanupBridge()` | 断开连接并移除 polyfill |
| `getBridge()` | 获取当前 bridge 实例 |
| `textResult(text)` | 创建 MCP 文本内容结果的辅助函数 |
| `jsonResult(data)` | 创建 MCP JSON 内容结果的辅助函数 |

## 工作原理

```
React 组件
  └─ useWebMCP()
       └─ navigator.modelContext.registerTool()
            └─ Bridge polyfill (WebSocket) ──→ @webmcp-anything/bridge ──→ AI Agent
```

当原生 WebMCP（`navigator.modelContext`）可用时（例如通过浏览器扩展），`initBridge()` 不会执行任何操作，hooks 直接与原生 API 通信。否则，Bridge polyfill 接管。

## 许可证

MIT
