[English](#webmcp-anything) | [中文](#webmcp-anything-中文)

# webmcp-anything

Turn any Web App into an MCP Tool Server.

This is the CLI package for [webmcp-anything](https://github.com/CodePirate7/webmcp-anything). It starts the Bridge server that connects your web application to AI agents via the Model Context Protocol (MCP).

## Install

```bash
npm install -g webmcp-anything
# or use directly with npx
npx webmcp-anything
```

## Commands

```bash
webmcp-anything              # Start bridge server (default)
webmcp-anything start        # Same as above
webmcp-anything info         # Show connection info & quick start guide
webmcp-anything help         # Show help
```

## Options

```bash
--port NUM    WebSocket port (default: 9100)
--token STR   Auth token (default: auto-generated)
```

## Configuration

Place a `webmcp.config.json` in your project root:

```json
{
  "port": 9100,
  "token": "my-secret-token"
}
```

CLI arguments take precedence over config file values.

## Quick Start

### 1. Add to your MCP client config

```json
{
  "mcpServers": {
    "webmcp": {
      "command": "npx",
      "args": ["webmcp-anything"]
    }
  }
}
```

### 2. In your web app, install the SDK

```bash
npm install @webmcp-anything/sdk
```

```typescript
// App entry point
import { initBridge } from '@webmcp-anything/sdk';
initBridge({ url: 'ws://localhost:9100', appId: 'my-app' });

// In components
import { useWebMCP, textResult } from '@webmcp-anything/sdk';

function MyPage() {
  useWebMCP({
    name: 'read_data',
    description: 'Read page data',
    execute: async () => textResult('Hello from browser!'),
  });
}
```

### 3. Your AI agent can now call browser tools!

## How It Works

```
Your Web App                          AI Agent (Claude, Cursor, etc.)
    │                                         │
    ├─ useWebMCP() hooks                      │
    │   register tools on                     │
    │   navigator.modelContext                 │
    │                                         │
    └── WebSocket ──→ Bridge ──→ MCP stdio ───┘
                    (this CLI)
```

## Related Packages

| Package | Description |
|---------|-------------|
| [@webmcp-anything/sdk](https://www.npmjs.com/package/@webmcp-anything/sdk) | Browser SDK — `useWebMCP` hook + Bridge client |
| [@webmcp-anything/bridge](https://www.npmjs.com/package/@webmcp-anything/bridge) | Bridge server library (used by this CLI) |

## License

MIT

---

# webmcp-anything 中文

将任何 Web 应用变成 MCP Tool Server。

这是 [webmcp-anything](https://github.com/CodePirate7/webmcp-anything) 的 CLI 包。它启动 Bridge 服务器，通过 Model Context Protocol (MCP) 将你的 Web 应用连接到 AI Agent。

## 安装

```bash
npm install -g webmcp-anything
# 或直接使用 npx
npx webmcp-anything
```

## 命令

```bash
webmcp-anything              # 启动 Bridge 服务器（默认）
webmcp-anything start        # 同上
webmcp-anything info         # 显示连接信息和快速入门指南
webmcp-anything help         # 显示帮助
```

## 选项

```bash
--port NUM    WebSocket 端口（默认：9100）
--token STR   认证 token（默认：自动生成）
```

## 配置

在项目根目录放置 `webmcp.config.json`：

```json
{
  "port": 9100,
  "token": "my-secret-token"
}
```

命令行参数优先级高于配置文件。

## 快速开始

### 1. 添加到 MCP 客户端配置

```json
{
  "mcpServers": {
    "webmcp": {
      "command": "npx",
      "args": ["webmcp-anything"]
    }
  }
}
```

### 2. 在 Web 应用中安装 SDK

```bash
npm install @webmcp-anything/sdk
```

```typescript
// 应用入口
import { initBridge } from '@webmcp-anything/sdk';
initBridge({ url: 'ws://localhost:9100', appId: 'my-app' });

// 在组件中
import { useWebMCP, textResult } from '@webmcp-anything/sdk';

function MyPage() {
  useWebMCP({
    name: 'read_data',
    description: '读取页面数据',
    execute: async () => textResult('来自浏览器的问候！'),
  });
}
```

### 3. AI Agent 现在可以调用浏览器工具了！

## 工作原理

```
你的 Web 应用                            AI Agent（Claude、Cursor 等）
    │                                         │
    ├─ useWebMCP() hooks                      │
    │   在 navigator.modelContext              │
    │   上注册工具                              │
    │                                         │
    └── WebSocket ──→ Bridge ──→ MCP stdio ───┘
                    （本 CLI）
```

## 相关包

| 包 | 说明 |
|----|------|
| [@webmcp-anything/sdk](https://www.npmjs.com/package/@webmcp-anything/sdk) | 浏览器 SDK — `useWebMCP` Hook + Bridge 客户端 |
| [@webmcp-anything/bridge](https://www.npmjs.com/package/@webmcp-anything/bridge) | Bridge 服务器库（本 CLI 使用）|

## 许可证

MIT
