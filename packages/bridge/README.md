[English](#webmcp-anythingbridge) | [中文](#webmcp-anythingbridge-中文)

# @webmcp-anything/bridge

Bridge server for [webmcp-anything](https://github.com/CodePirate7/webmcp-anything) — connects browser tabs to AI agents via MCP protocol.

## Architecture

```
Browser Tab ←── WebSocket ──→ Bridge ←── MCP stdio ──→ AI Agent
Browser Tab ←── WebSocket ──→   ↑
Browser Tab ←── WebSocket ──→   ↑
```

The Bridge is a **thin pipe** — it routes messages between browser tabs and AI agents without interpreting or transforming tool inputs/outputs.

## Features

- **Multi-tab support** — Multiple browser tabs can connect simultaneously. Tools are auto-namespaced: single tab = no prefix, multi-tab = `{tabId}:toolName`.
- **MCP-native** — Exposes tools via standard MCP protocol (stdio transport). Works with Claude, Cursor, Craft Agent, and any MCP-compatible client.
- **Auth** — WebSocket connections require a token for security.
- **Auto-discovery** — Sends `notifications/tools/list_changed` when tabs connect/disconnect, so agents always see the current tool set.

## Install

```bash
npm install @webmcp-anything/bridge
# or
pnpm add @webmcp-anything/bridge
```

## Usage

### As a CLI

```bash
# Start with defaults (port 9100, random token)
npx @webmcp-anything/bridge

# Custom port and token
npx @webmcp-anything/bridge --port 9200 --token my-secret
```

### As a library

```typescript
import { startBridge } from '@webmcp-anything/bridge';

const bridge = await startBridge({
  port: 9100,
  token: 'my-secret',
});

// Later: stop the bridge
bridge.stop();
```

### In MCP client config

```json
{
  "mcpServers": {
    "webmcp": {
      "command": "npx",
      "args": ["@webmcp-anything/bridge"]
    }
  }
}
```

## API

### `startBridge(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `9100` | WebSocket port for browser connections |
| `token` | `string` | random | Auth token (shared with SDK) |
| `name` | `string` | `'webmcp-anything'` | Server name exposed via MCP |
| `version` | `string` | `'0.1.0'` | Server version exposed via MCP |

Returns: `{ token, port, registry, stop }`

### Exported classes

| Export | Description |
|--------|-------------|
| `TabRegistry` | Manages connected tabs and tool aggregation |
| `WsServer` | WebSocket server for browser connections |
| `McpServer` | MCP stdio server for AI agent connections |

## Message Protocol

Browser ↔ Bridge communication uses JSON over WebSocket:

| Message | Direction | Description |
|---------|-----------|-------------|
| `register` | Browser → Bridge | Tab registers its tools |
| `tools_updated` | Browser → Bridge | Tab updates its tool list |
| `execute_tool` | Bridge → Browser | Agent requests tool execution |
| `tool_result` | Browser → Bridge | Tab returns execution result |
| `tool_error` | Browser → Bridge | Tab reports execution error |

## License

MIT

---

# @webmcp-anything/bridge 中文

[webmcp-anything](https://github.com/CodePirate7/webmcp-anything) 的 Bridge 服务 — 通过 MCP 协议连接浏览器标签页与 AI Agent。

## 架构

```
浏览器标签页 ←── WebSocket ──→ Bridge ←── MCP stdio ──→ AI Agent
浏览器标签页 ←── WebSocket ──→    ↑
浏览器标签页 ←── WebSocket ──→    ↑
```

Bridge 是一个**透传管道** — 在浏览器标签页和 AI Agent 之间路由消息，不解释或转换工具的输入/输出。

## 特性

- **多标签页支持** — 多个浏览器标签页可同时连接。工具自动命名空间化：单标签页无前缀，多标签页使用 `{tabId}:toolName` 格式。
- **MCP 原生** — 通过标准 MCP 协议（stdio 传输）暴露工具。兼容 Claude、Cursor、Craft Agent 等任何 MCP 兼容客户端。
- **认证** — WebSocket 连接需要 token 验证。
- **自动发现** — 标签页连接/断开时发送 `notifications/tools/list_changed`，Agent 始终看到最新的工具列表。

## 安装

```bash
npm install @webmcp-anything/bridge
# 或
pnpm add @webmcp-anything/bridge
```

## 使用方式

### 作为命令行工具

```bash
# 默认启动（端口 9100，随机 token）
npx @webmcp-anything/bridge

# 自定义端口和 token
npx @webmcp-anything/bridge --port 9200 --token my-secret
```

### 作为库使用

```typescript
import { startBridge } from '@webmcp-anything/bridge';

const bridge = await startBridge({
  port: 9100,
  token: 'my-secret',
});

// 稍后：停止 bridge
bridge.stop();
```

### MCP 客户端配置

```json
{
  "mcpServers": {
    "webmcp": {
      "command": "npx",
      "args": ["@webmcp-anything/bridge"]
    }
  }
}
```

## API

### `startBridge(options?)`

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `port` | `number` | `9100` | 浏览器连接的 WebSocket 端口 |
| `token` | `string` | 随机生成 | 认证 token（与 SDK 共享）|
| `name` | `string` | `'webmcp-anything'` | 通过 MCP 暴露的服务器名称 |
| `version` | `string` | `'0.1.0'` | 通过 MCP 暴露的服务器版本 |

返回：`{ token, port, registry, stop }`

### 消息协议

浏览器 ↔ Bridge 通信使用 WebSocket 上的 JSON：

| 消息 | 方向 | 说明 |
|------|------|------|
| `register` | 浏览器 → Bridge | 标签页注册其工具 |
| `tools_updated` | 浏览器 → Bridge | 标签页更新工具列表 |
| `execute_tool` | Bridge → 浏览器 | Agent 请求执行工具 |
| `tool_result` | 浏览器 → Bridge | 标签页返回执行结果 |
| `tool_error` | 浏览器 → Bridge | 标签页报告执行错误 |

## 许可证

MIT
